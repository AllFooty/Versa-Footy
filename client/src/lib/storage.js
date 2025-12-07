import { supabase } from './supabase';

/**
 * Upload an exercise video to Supabase Storage and return its public URL.
 * Bucket is assumed to be public. Paths are namespaced per exercise to avoid collisions.
 */
export const uploadExerciseVideo = async (file, exerciseId = null) => {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const cleanName = file.name.replace(/\s+/g, '-').toLowerCase();
  const extension = cleanName.split('.').pop() || 'mp4';
  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const path = `exercises/${exerciseId || 'new'}/${uniqueId}.${extension}`;

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

export default uploadExerciseVideo;
