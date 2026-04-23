-- Admin-only audit function that surfaces exercise/video drift:
--   missing   : exercises with NULL or empty video_url
--   external  : exercises whose URL is not from our storage bucket (e.g. YouTube)
--   mismatched: exercises whose storage path encodes a different exercise id
--   broken    : exercises whose referenced storage object does not exist
--   orphans   : storage objects in 'exercise-videos' not referenced by any exercise
--   duplicates: storage folders with more than one object (old uploads left behind)
-- SECURITY DEFINER so the client can see storage.objects without direct grant.

CREATE OR REPLACE FUNCTION public.exercise_video_audit()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'permission denied: admin only';
  END IF;

  WITH exercises_with_url AS (
    SELECT id, name, video_url,
           substring(video_url from 'exercise-videos/(.*)$') AS storage_path,
           substring(video_url from 'exercise-videos/exercises/([0-9]+)/')::int AS url_exercise_id
    FROM public.exercises
    WHERE video_url IS NOT NULL AND video_url <> ''
  ),
  missing AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'skill_id', skill_id
    ) ORDER BY id) AS data
    FROM public.exercises
    WHERE video_url IS NULL OR video_url = ''
  ),
  external AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'video_url', video_url
    ) ORDER BY id) AS data
    FROM exercises_with_url
    WHERE video_url !~ '/storage/v1/object/public/exercise-videos/'
  ),
  mismatched AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'video_url', video_url,
      'url_exercise_id', url_exercise_id
    ) ORDER BY id) AS data
    FROM exercises_with_url
    WHERE url_exercise_id IS NOT NULL AND url_exercise_id <> id
  ),
  broken AS (
    SELECT jsonb_agg(jsonb_build_object(
      'id', e.id, 'name', e.name, 'storage_path', e.storage_path
    ) ORDER BY e.id) AS data
    FROM exercises_with_url e
    LEFT JOIN storage.objects o
      ON o.bucket_id = 'exercise-videos' AND o.name = e.storage_path
    WHERE e.storage_path IS NOT NULL AND o.name IS NULL
  ),
  orphans AS (
    SELECT jsonb_agg(jsonb_build_object(
      'path', o.name,
      'size_bytes', (o.metadata->>'size')::bigint,
      'created_at', o.created_at
    ) ORDER BY o.created_at DESC) AS data
    FROM storage.objects o
    WHERE o.bucket_id = 'exercise-videos'
      AND NOT EXISTS (
        SELECT 1 FROM public.exercises e
        WHERE e.video_url LIKE '%' || o.name || '%'
      )
  ),
  duplicates AS (
    SELECT jsonb_agg(jsonb_build_object(
      'exercise_id', exercise_id_str::int,
      'objects', objects,
      'paths', paths
    ) ORDER BY objects DESC) AS data
    FROM (
      SELECT split_part(name, '/', 2) AS exercise_id_str,
             count(*) AS objects,
             array_agg(name ORDER BY created_at) AS paths
      FROM storage.objects
      WHERE bucket_id = 'exercise-videos' AND name LIKE 'exercises/%/%'
      GROUP BY 1
      HAVING count(*) > 1
    ) d
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'missing',    COALESCE((SELECT data FROM missing), '[]'::jsonb),
    'external',   COALESCE((SELECT data FROM external), '[]'::jsonb),
    'mismatched', COALESCE((SELECT data FROM mismatched), '[]'::jsonb),
    'broken',     COALESCE((SELECT data FROM broken), '[]'::jsonb),
    'orphans',    COALESCE((SELECT data FROM orphans), '[]'::jsonb),
    'duplicates', COALESCE((SELECT data FROM duplicates), '[]'::jsonb)
  )
  INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.exercise_video_audit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exercise_video_audit() TO authenticated;
