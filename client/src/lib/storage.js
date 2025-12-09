import { supabase } from './supabase';

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
const uploadWithProgress = (file, path, onProgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get the upload URL from Supabase
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const uploadUrl = `${supabaseUrl}/storage/v1/object/exercise-videos/${path}`;
      
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
    } catch (err) {
      reject(err);
    }
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

export default uploadExerciseVideo;
