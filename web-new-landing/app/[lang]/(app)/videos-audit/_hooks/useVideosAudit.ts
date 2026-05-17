"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../../_lib/supabase";

export type MissingRow = { id: number; name: string; skill_id: number };
export type BrokenRow = { id: number; name: string; storage_path: string };
export type MismatchedRow = { id: number; name: string; url_exercise_id: number };
export type ExternalRow = { id: number; name: string; video_url: string };
export type DuplicateRow = { exercise_id: number; objects: number; paths: string[] };
export type OrphanRow = { path: string; size_bytes: number };

export type Audit = {
  generated_at: string | null;
  missing: MissingRow[];
  broken: BrokenRow[];
  mismatched: MismatchedRow[];
  external: ExternalRow[];
  duplicates: DuplicateRow[];
  orphans: OrphanRow[];
};

const EMPTY_AUDIT: Audit = {
  generated_at: null,
  missing: [],
  broken: [],
  mismatched: [],
  external: [],
  duplicates: [],
  orphans: [],
};

export type DeleteResult = { removed: number; errors: string[] };

export function useVideosAudit() {
  const [audit, setAudit] = useState<Audit>(EMPTY_AUDIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("exercise_video_audit");
      if (rpcError) throw rpcError;
      setAudit({ ...EMPTY_AUDIT, ...(data as Partial<Audit>) });
    } catch (err) {
      // Supabase sometimes throws errors with an empty .message (e.g. when the
      // RPC isn't deployed). Surface something useful rather than letting the
      // dict prefix double up.
      const message =
        err instanceof Error && err.message ? err.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const deleteOrphans = useCallback(
    async (paths: string[]): Promise<DeleteResult> => {
      if (!paths.length) return { removed: 0, errors: [] };
      // supabase.storage.remove() silently 400s on very large batches; chunk safely.
      const BATCH_SIZE = 500;
      let removed = 0;
      const errors: string[] = [];
      for (let i = 0; i < paths.length; i += BATCH_SIZE) {
        const batch = paths.slice(i, i + BATCH_SIZE);
        const { data, error: removeError } = await supabase.storage
          .from("exercise-videos")
          .remove(batch);
        if (removeError) {
          errors.push(removeError.message);
          continue;
        }
        removed += data?.length ?? batch.length;
      }
      await refresh();
      return { removed, errors };
    },
    [refresh],
  );

  return { audit, loading, error, refresh, deleteOrphans };
}
