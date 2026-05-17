"use client";

import { supabase } from "../../../../_lib/supabase";

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;

// Must match storage.buckets.allowed_mime_types for bucket 'exercise-videos'.
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
  "video/x-matroska",
  "video/3gpp",
  "video/3gpp2",
  "video/x-m4v",
  "video/hevc",
]);

export type UploadResult = { path: string; publicUrl: string };

export async function uploadExerciseVideo(
  file: File,
  exerciseId: number | null,
  onProgress?: (percent: number) => void,
): Promise<UploadResult> {
  if (!file) throw new Error("No file provided for upload.");
  if (!file.type.startsWith("video/")) throw new Error("Only video files are allowed.");
  if (!ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
    throw new Error(
      `This video format (${file.type}) isn't supported. Use MP4, MOV, WebM, MKV, 3GP, AVI, or M4V.`,
    );
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(
      `Video must be under 200 MB. This file is ${(file.size / (1024 * 1024)).toFixed(0)} MB.`,
    );
  }

  const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
  const extension = cleanName.split(".").pop() || "mp4";
  const uniqueId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `exercises/${exerciseId ?? "new"}/${uniqueId}.${extension}`;

  if (onProgress) {
    return uploadWithProgress(file, path, onProgress);
  }

  const { error } = await supabase.storage
    .from("exercise-videos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "video/mp4",
    });
  if (error) throw error;
  const { data } = supabase.storage.from("exercise-videos").getPublicUrl(path);
  return { path, publicUrl: data?.publicUrl ?? "" };
}

async function uploadWithProgress(
  file: File,
  path: string,
  onProgress: (percent: number) => void,
): Promise<UploadResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/exercise-videos/${path}`;

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const { data } = supabase.storage.from("exercise-videos").getPublicUrl(path);
        resolve({ path, publicUrl: data?.publicUrl ?? "" });
      } else {
        let msg = "Upload failed";
        try {
          const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
          msg = parsed.message ?? parsed.error ?? msg;
        } catch {
          /* ignore parse */
        }
        reject(new Error(msg));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));
    xhr.open("POST", uploadUrl, true);
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken ?? supabaseAnonKey}`);
    xhr.setRequestHeader("apikey", supabaseAnonKey);
    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.setRequestHeader("Cache-Control", "3600");
    xhr.send(file);
  });
}

function extractStoragePath(input: string | null | undefined): string | null {
  if (!input) return null;
  let path = input;
  if (input.startsWith("http")) {
    const marker = "/storage/v1/object/";
    const idx = input.indexOf(marker);
    if (idx === -1) return null;
    path = input.slice(idx + marker.length);
  }
  if (path.startsWith("public/")) path = path.replace(/^public\//, "");
  if (path.startsWith("exercise-videos/")) path = path.slice("exercise-videos/".length);
  return path;
}

export async function deleteExerciseVideo(urlOrPath: string | null | undefined): Promise<boolean> {
  const path = extractStoragePath(urlOrPath);
  if (!path) return false;
  const { error } = await supabase.storage.from("exercise-videos").remove([path]);
  if (error) {
    // best-effort; log via console for QA, don't throw
    console.warn("Failed to delete storage object:", error.message);
    return false;
  }
  return true;
}

const EXTERNAL_VIDEO_HOSTS = /(?:youtube\.com|youtu\.be|vimeo\.com|player\.vimeo\.com)/i;
export function isAcceptableExternalUrl(url: string): boolean {
  return EXTERNAL_VIDEO_HOSTS.test(url);
}

export function isUploadedStorageUrl(url: string | null | undefined): boolean {
  return !!url && url.includes("/exercise-videos/");
}
