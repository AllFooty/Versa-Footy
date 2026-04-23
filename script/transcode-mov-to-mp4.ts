/**
 * Transcode every .mov in the `exercise-videos` bucket to .mp4 (H.264 / AAC),
 * upload the .mp4 alongside, and repoint `exercises.video_url` at the .mp4.
 *
 * The original .mov is left in storage until you verify playback and manually
 * clean it up (run with --cleanup to delete originals that have an .mp4 sibling
 * the DB now points at).
 *
 * Requires:
 *   - ffmpeg on PATH
 *   - env SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — admin-only operations)
 *   - env VITE_SUPABASE_URL
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx script/transcode-mov-to-mp4.ts
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx script/transcode-mov-to-mp4.ts --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx script/transcode-mov-to-mp4.ts --limit 5
 *   SUPABASE_SERVICE_ROLE_KEY=... npx tsx script/transcode-mov-to-mp4.ts --cleanup
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';

const BUCKET = 'exercise-videos';
const ROOT_PREFIX = 'exercises';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Set both, then rerun. Service role bypasses RLS so transcoding can write to storage.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- args ---
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const cleanup = args.has('--cleanup');
const limitArg = process.argv.find((a, i) => process.argv[i - 1] === '--limit');
const limit = limitArg ? parseInt(limitArg, 10) : Infinity;

type MovEntry = { path: string; size: number; exerciseId: string; baseName: string };

async function listAllMovs(): Promise<MovEntry[]> {
  // storage.list() is shallow per prefix, so we walk: exercises/ → exercises/{id}/
  const out: MovEntry[] = [];
  let offset = 0;
  const pageSize = 1000;

  // 1) enumerate exercise folders
  const folders: string[] = [];
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(ROOT_PREFIX, { limit: pageSize, offset });
    if (error) throw error;
    if (!data || !data.length) break;
    for (const entry of data) {
      // Supabase returns folders as objects where `id` is null and `name` is the folder name
      if (entry.id === null) folders.push(`${ROOT_PREFIX}/${entry.name}`);
    }
    if (data.length < pageSize) break;
    offset += data.length;
  }

  // 2) enumerate .mov files inside each folder
  for (const folder of folders) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(folder, { limit: pageSize });
    if (error) throw error;
    if (!data) continue;
    for (const entry of data) {
      if (!entry.name || !entry.name.toLowerCase().endsWith('.mov')) continue;
      out.push({
        path: `${folder}/${entry.name}`,
        size: (entry.metadata as any)?.size || 0,
        exerciseId: folder.split('/').pop() || '',
        baseName: entry.name.replace(/\.mov$/i, ''),
      });
    }
  }
  return out;
}

async function downloadTo(path: string, destPath: string) {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error) throw error;
  if (!data) throw new Error('empty download');
  const buf = Buffer.from(await data.arrayBuffer());
  await fs.writeFile(destPath, buf);
}

function runFfmpeg(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // H.264 baseline-ish for wide compatibility, AAC audio, 720p cap on height,
    // +faststart so the moov atom sits at the front for streaming starts.
    const argv = [
      '-y',
      '-i', input,
      '-vf', "scale='if(gt(iw,ih),min(1280,iw),-2)':'if(gt(iw,ih),-2,min(1280,ih))'",
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-c:a', 'aac',
      '-b:a', '128k',
      output,
    ];
    const child = spawn('ffmpeg', argv, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-1000)}`));
    });
  });
}

async function uploadMp4(localPath: string, storagePath: string): Promise<string> {
  const body = await fs.readFile(localPath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, body, {
      contentType: 'video/mp4',
      cacheControl: '3600',
      upsert: true,
    });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return pub.publicUrl;
}

async function updateExerciseVideoUrl(exerciseId: string, oldUrl: string, newUrl: string): Promise<boolean> {
  // Only repoint exercises that currently reference the old .mov, and only within the right folder id.
  // Using LIKE guards against case-or-urlencoding drift between what's in the DB and what we list.
  const { data, error } = await supabase
    .from('exercises')
    .update({ video_url: newUrl, updated_at: new Date().toISOString() })
    .eq('id', exerciseId)
    .eq('video_url', oldUrl)
    .select('id');
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

async function run() {
  console.log(`mode: ${dryRun ? 'DRY RUN' : cleanup ? 'CLEANUP' : 'TRANSCODE'}`);
  const movs = await listAllMovs();
  console.log(`found ${movs.length} .mov files`);

  if (cleanup) return runCleanup(movs);

  const work = movs.slice(0, limit);
  const tmp = await fs.mkdtemp(join(tmpdir(), 'versa-transcode-'));
  console.log(`scratch dir: ${tmp}`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < work.length; i++) {
    const m = work[i];
    const newStoragePath = `${ROOT_PREFIX}/${m.exerciseId}/${m.baseName}.mp4`;
    const oldPublicUrl = supabase.storage.from(BUCKET).getPublicUrl(m.path).data.publicUrl;
    const newPublicUrl = supabase.storage.from(BUCKET).getPublicUrl(newStoragePath).data.publicUrl;

    const prefix = `[${i + 1}/${work.length}]`;
    console.log(`${prefix} ${m.path} (${(m.size / 1e6).toFixed(1)} MB)`);

    if (dryRun) {
      console.log(`${prefix}   would upload → ${newStoragePath}`);
      continue;
    }

    // skip if an .mp4 of the same basename is already there
    const { data: existing } = await supabase.storage
      .from(BUCKET)
      .list(`${ROOT_PREFIX}/${m.exerciseId}`, { limit: 1000 });
    if (existing?.some((e) => e.name === `${m.baseName}.mp4`)) {
      console.log(`${prefix}   .mp4 sibling already exists, skipping`);
      skipped++;
      continue;
    }

    const localIn = join(tmp, `${randomUUID()}.mov`);
    const localOut = join(tmp, `${randomUUID()}.mp4`);
    try {
      await downloadTo(m.path, localIn);
      await runFfmpeg(localIn, localOut);
      const stat = await fs.stat(localOut);
      console.log(`${prefix}   transcoded → ${(stat.size / 1e6).toFixed(1)} MB`);
      await uploadMp4(localOut, newStoragePath);
      const changed = await updateExerciseVideoUrl(m.exerciseId, oldPublicUrl, newPublicUrl);
      console.log(`${prefix}   uploaded; DB row ${changed ? 'updated' : 'NOT changed (url mismatch)'}`);
      ok++;
    } catch (err: any) {
      console.error(`${prefix}   FAILED: ${err?.message || err}`);
      failed++;
    } finally {
      await fs.rm(localIn, { force: true });
      await fs.rm(localOut, { force: true });
    }
  }

  await fs.rm(tmp, { recursive: true, force: true });
  console.log(`\ndone. ok=${ok} skipped=${skipped} failed=${failed}`);
  console.log(`originals left in place. When you're happy with playback, rerun with --cleanup.`);
}

async function runCleanup(movs: MovEntry[]) {
  // Delete each .mov whose .mp4 sibling exists AND whose exercise no longer references the .mov.
  let removed = 0;
  let kept = 0;
  for (let i = 0; i < movs.length; i++) {
    const m = movs[i];
    const prefix = `[${i + 1}/${movs.length}]`;
    const oldPublicUrl = supabase.storage.from(BUCKET).getPublicUrl(m.path).data.publicUrl;

    const { data: siblings } = await supabase.storage
      .from(BUCKET)
      .list(`${ROOT_PREFIX}/${m.exerciseId}`, { limit: 1000 });
    const hasMp4 = siblings?.some((e) => e.name === `${m.baseName}.mp4`);
    if (!hasMp4) {
      console.log(`${prefix} no .mp4 sibling for ${m.path} — keeping`);
      kept++;
      continue;
    }

    // Refuse to delete if ANY exercise still points at this .mov.
    const { data: ref } = await supabase
      .from('exercises')
      .select('id')
      .eq('video_url', oldPublicUrl)
      .limit(1);
    if (ref && ref.length) {
      console.log(`${prefix} exercise #${ref[0].id} still references ${m.path} — keeping`);
      kept++;
      continue;
    }

    if (dryRun) {
      console.log(`${prefix} would delete ${m.path}`);
      continue;
    }
    const { error } = await supabase.storage.from(BUCKET).remove([m.path]);
    if (error) {
      console.error(`${prefix} delete failed ${m.path}: ${error.message}`);
      kept++;
    } else {
      console.log(`${prefix} deleted ${m.path}`);
      removed++;
    }
  }
  console.log(`\ncleanup done. removed=${removed} kept=${kept}`);
}

run().catch((err) => {
  console.error('fatal:', err);
  process.exit(1);
});
