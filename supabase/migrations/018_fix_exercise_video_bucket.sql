-- Align the exercise-videos bucket with the web client's upload constraints.
-- Client cap is 200 MB (see client/src/lib/storage.js). Narrow MIME list was
-- silently rejecting .mkv, .3gp, .mpeg and some Android exports.

UPDATE storage.buckets
SET
  file_size_limit = 209715200,
  allowed_mime_types = ARRAY[
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/mpeg',
    'video/x-matroska',
    'video/3gpp',
    'video/3gpp2',
    'video/x-m4v',
    'video/hevc'
  ]
WHERE id = 'exercise-videos';
