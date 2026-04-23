import { supabase } from './supabase';

const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024; // 200 MB — must match storage.buckets.file_size_limit for bucket 'exercise-videos'

// Must match storage.buckets.allowed_mime_types for bucket 'exercise-videos'.
// Kept here so the client fails fast with a friendly error instead of a 400 from storage.
const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
  'video/x-matroska',
  'video/3gpp',
  'video/3gpp2',
  'video/x-m4v',
  'video/hevc',
]);

/**
 * Upload an exercise video to Supabase Storage and return its public URL.
 * Bucket is assumed to be public. Paths are namespaced per exercise to avoid collisions.
 * @param {File} file - The video file to upload
 * @param {string|null} exerciseId - Optional exercise ID for namespacing
 * @param {function} onProgress - Optional callback for upload progress (receives 0-100)
 */
export const uploadExerciseVideo = async (file, exerciseId = null, onProgress = null) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  if (!file.type.startsWith('video/')) {
    throw new Error('Only video files are allowed.');
  }

  if (!ALLOWED_VIDEO_MIME_TYPES.has(file.type)) {
    throw new Error(
      `This video format (${file.type}) isn't supported. Use MP4, MOV, WebM, MKV, 3GP, AVI, or M4V.`
    );
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error(`Video must be under 200 MB. This file is ${(file.size / (1024 * 1024)).toFixed(0)} MB.`);
  }

  const cleanName = file.name.replace(/\s+/g, '-').toLowerCase();
  const extension = cleanName.split('.').pop() || 'mp4';
  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const path = `exercises/${exerciseId || 'new'}/${uniqueId}.${extension}`;

  // Use XMLHttpRequest for progress tracking
  if (onProgress) {
    return uploadWithProgress(file, path, onProgress);
  }

  // Standard upload without progress
  const { error: uploadError } = await supabase.storage
    .from('exercise-videos')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'video/mp4',
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicData } = supabase.storage
    .from('exercise-videos')
    .getPublicUrl(path);

  return {
    path,
    publicUrl: publicData?.publicUrl,
  };
};

/**
 * Upload file with progress tracking using XMLHttpRequest
 */
const uploadWithProgress = async (file, path, onProgress) => {
  // Get the upload URL from Supabase
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const uploadUrl = `${supabaseUrl}/storage/v1/object/exercise-videos/${path}`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL
        const { data: publicData } = supabase.storage
          .from('exercise-videos')
          .getPublicUrl(path);

        resolve({
          path,
          publicUrl: publicData?.publicUrl,
        });
      } else {
        let errorMessage = 'Upload failed';
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.message || response.error || errorMessage;
        } catch (e) {
          // ignore parse error
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('POST', uploadUrl, true);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken || supabaseAnonKey}`);
    xhr.setRequestHeader('apikey', supabaseAnonKey);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.setRequestHeader('x-upsert', 'true');
    xhr.setRequestHeader('Cache-Control', '3600');

    xhr.send(file);
  });
};

/**
 * Extract the relative storage path from a full URL or a path string.
 */
const extractStoragePath = (input) => {
  if (!input) return null;
  let path = input;

  if (input.startsWith('http')) {
    const marker = '/storage/v1/object/';
    const idx = input.indexOf(marker);
    if (idx === -1) return null;
    path = input.slice(idx + marker.length);
  }

  // Strip optional public/ prefix
  if (path.startsWith('public/')) {
    path = path.replace(/^public\//, '');
  }

  // Strip bucket prefix
  if (path.startsWith('exercise-videos/')) {
    path = path.slice('exercise-videos/'.length);
  }

  return path;
};

/**
 * Delete an exercise video from Supabase Storage.
 * Best-effort: ignores errors and returns false on failure.
 */
export const deleteExerciseVideo = async (urlOrPath) => {
  const path = extractStoragePath(urlOrPath);
  if (!path) return false;

  const { error } = await supabase.storage
    .from('exercise-videos')
    .remove([path]);

  if (error) {
    console.warn('Failed to delete storage object:', error.message);
    return false;
  }
  return true;
};

/**
 * List every video file stored for an exercise.
 * Returns candidates (there can be multiple; `video_url` on the exercise
 * decides which one is shown to end users — everything else is a spare the
 * admin may promote later).
 */
export const listExerciseVideos = async (exerciseId) => {
  if (exerciseId == null) return [];
  const folder = `exercises/${exerciseId}`;
  const { data, error } = await supabase.storage
    .from('exercise-videos')
    .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw error;
  return (data || [])
    .filter((entry) => entry.id !== null) // skip sub-folders
    .map((entry) => {
      const path = `${folder}/${entry.name}`;
      const { data: pub } = supabase.storage.from('exercise-videos').getPublicUrl(path);
      return {
        path,
        name: entry.name,
        publicUrl: pub?.publicUrl || '',
        sizeBytes: entry.metadata?.size ?? null,
        createdAt: entry.created_at ?? null,
        mimeType: entry.metadata?.mimetype ?? null,
      };
    });
};

export default uploadExerciseVideo;
