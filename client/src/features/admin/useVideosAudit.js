import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const EMPTY_AUDIT = {
  generated_at: null,
  missing: [],
  external: [],
  mismatched: [],
  broken: [],
  orphans: [],
  duplicates: [],
};

export const useVideosAudit = () => {
  const [audit, setAudit] = useState(EMPTY_AUDIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('exercise_video_audit');
      if (rpcError) throw rpcError;
      setAudit({ ...EMPTY_AUDIT, ...data });
    } catch (err) {
      setError(err.message || 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteOrphans = useCallback(async (paths) => {
    if (!paths?.length) return { removed: 0, errors: [] };
    // Supabase storage.remove() has an undocumented per-call limit that's
    // well above our current usage but will silently 400 on very large
    // deletes. Chunk so we never hit it.
    const BATCH_SIZE = 500;
    let removed = 0;
    const errors = [];
    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      const batch = paths.slice(i, i + BATCH_SIZE);
      const { data, error: removeError } = await supabase.storage
        .from('exercise-videos')
        .remove(batch);
      if (removeError) {
        errors.push(removeError.message);
        continue;
      }
      removed += data?.length || batch.length;
    }
    await refresh();
    return { removed, errors };
  }, [refresh]);

  return { audit, loading, error, refresh, deleteOrphans };
};
