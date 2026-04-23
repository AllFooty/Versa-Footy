/**
 * One-shot copy of every object in main's `exercise-videos` bucket into demo's
 * `exercise-videos` bucket, at the same storage paths. Used to seed the demo
 * project so local dev (which points at demo) can see the same videos the
 * prod library references.
 *
 * This is a one-way copy. New uploads to main after seeding do NOT sync.
 *
 * Requires in ~/.versa-seed.env (or exported in the shell):
 *   MAIN_SUPABASE_URL            e.g. https://knbksbvzzliuxwvyjzoj.supabase.co
 *   MAIN_SERVICE_ROLE_KEY        main's service_role key  (BYPASSES RLS)
 *   DEMO_SUPABASE_URL            e.g. https://xmmdululrtyrdaqxcdcp.supabase.co
 *   DEMO_SERVICE_ROLE_KEY        demo's service_role key  (BYPASSES RLS)
 *
 * Usage:
 *   set -a; source ~/.versa-seed.env; set +a
 *   npx tsx script/seed-demo-from-main.ts --dry-run
 *   npx tsx script/seed-demo-from-main.ts
 *   npx tsx script/seed-demo-from-main.ts --limit 10 --concurrency 5
 *
 * Flags:
 *   --dry-run         List what would be copied, copy nothing
 *   --limit N         Stop after N files (for testing)
 *   --concurrency N   Parallel copy workers (default 3)
 *   --overwrite       Re-copy files even if demo already has them (default: skip existing)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'exercise-videos';

const MAIN_URL = process.env.MAIN_SUPABASE_URL;
const MAIN_KEY = process.env.MAIN_SERVICE_ROLE_KEY;
const DEMO_URL = process.env.DEMO_SUPABASE_URL;
const DEMO_KEY = process.env.DEMO_SERVICE_ROLE_KEY;

if (!MAIN_URL || !MAIN_KEY || !DEMO_URL || !DEMO_KEY) {
  console.error('Missing one of MAIN_SUPABASE_URL / MAIN_SERVICE_ROLE_KEY / DEMO_SUPABASE_URL / DEMO_SERVICE_ROLE_KEY.');
  console.error('Create ~/.versa-seed.env with all four, then:  set -a; source ~/.versa-seed.env; set +a');
  process.exit(1);
}

const main = createClient(MAIN_URL, MAIN_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const demo = createClient(DEMO_URL, DEMO_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const overwrite = argv.includes('--overwrite');
const limit = readFlagInt('--limit') ?? Infinity;
const concurrency = readFlagInt('--concurrency') ?? 3;

function readFlagInt(flag: string): number | null {
  const i = argv.indexOf(flag);
  if (i === -1) return null;
  const v = argv[i + 1];
  const n = v ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) {
    console.error(`Invalid value for ${flag}: ${v ?? '(missing)'}`);
    process.exit(1);
  }
  return n;
}

type FileEntry = { path: string; sizeBytes: number | null };

async function listAllFiles(client: SupabaseClient, prefix = ''): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  const queue: string[] = [prefix];
  while (queue.length) {
    const folder = queue.shift()!;
    let offset = 0;
    while (true) {
      const { data, error } = await client.storage.from(BUCKET).list(folder, {
        limit: 1000,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const full = folder ? `${folder}/${entry.name}` : entry.name;
        if (entry.id === null) {
          queue.push(full);
        } else {
          out.push({ path: full, sizeBytes: entry.metadata?.size ?? null });
        }
      }
      if (data.length < 1000) break;
      offset += data.length;
    }
  }
  return out;
}

function fmtBytes(n: number | null): string {
  if (n == null) return '?';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function copyOne(entry: FileEntry, index: number, total: number): Promise<'copied' | 'skipped' | 'failed'> {
  const tag = `[${index + 1}/${total}]`;

  if (!overwrite) {
    const parent = entry.path.includes('/') ? entry.path.slice(0, entry.path.lastIndexOf('/')) : '';
    const name = entry.path.slice(parent.length + (parent ? 1 : 0));
    const { data: existing } = await demo.storage.from(BUCKET).list(parent, { limit: 1, search: name });
    if (existing && existing.some((e) => e.name === name && e.id !== null)) {
      console.log(`${tag} skip (exists)   ${entry.path}`);
      return 'skipped';
    }
  }

  const { data: blob, error: dlErr } = await main.storage.from(BUCKET).download(entry.path);
  if (dlErr || !blob) {
    console.error(`${tag} FAIL download  ${entry.path}  ${dlErr?.message ?? 'no blob'}`);
    return 'failed';
  }

  const buf = Buffer.from(await blob.arrayBuffer());
  const contentType = blob.type || 'application/octet-stream';

  if (dryRun) {
    console.log(`${tag} would copy     ${entry.path}  (${fmtBytes(buf.byteLength)}, ${contentType})`);
    return 'copied';
  }

  const { error: upErr } = await demo.storage.from(BUCKET).upload(entry.path, buf, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  });
  if (upErr) {
    console.error(`${tag} FAIL upload    ${entry.path}  ${upErr.message}`);
    return 'failed';
  }

  console.log(`${tag} copied         ${entry.path}  (${fmtBytes(buf.byteLength)})`);
  return 'copied';
}

async function runPool<T, R>(items: T[], workers: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(workers, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main_() {
  console.log(`Listing objects in main (${MAIN_URL}) ...`);
  const all = await listAllFiles(main);
  console.log(`Found ${all.length} files on main.`);

  const slice = Number.isFinite(limit) ? all.slice(0, limit) : all;
  const totalBytes = slice.reduce((a, b) => a + (b.sizeBytes ?? 0), 0);
  console.log(`Copying ${slice.length} files (${fmtBytes(totalBytes)}) with concurrency=${concurrency}${dryRun ? ' [DRY RUN]' : ''}${overwrite ? ' [OVERWRITE]' : ''}`);

  const startedAt = Date.now();
  const results = await runPool(slice, concurrency, (entry, i) => copyOne(entry, i, slice.length));
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

  const copied = results.filter((r) => r === 'copied').length;
  const skipped = results.filter((r) => r === 'skipped').length;
  const failed = results.filter((r) => r === 'failed').length;
  console.log('');
  console.log(`Done in ${elapsed}s — copied ${copied}, skipped ${skipped}, failed ${failed}.`);
  if (failed > 0) process.exit(2);
}

main_().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
