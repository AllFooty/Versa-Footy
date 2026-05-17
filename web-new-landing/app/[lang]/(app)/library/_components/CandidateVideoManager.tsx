"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Spinner } from "../../../../_components/primitives/Spinner";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../../_components/primitives/Toast";
import {
  addExerciseVideoCandidate,
  deleteExerciseVideoCandidate,
  listExerciseVideos,
  setActiveExerciseVideo,
  type VideoCandidate,
} from "../_hooks/useExerciseMutations";
import type { ProductDict } from "../../../../_dictionaries/product";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CandidateVideoManager({
  exerciseId,
  activeUrl,
  onActiveChange,
  dict,
}: {
  exerciseId: number;
  activeUrl: string | null;
  onActiveChange: (publicUrl: string | null) => void;
  dict: ProductDict;
}) {
  const t = dict.library.candidates;
  const [items, setItems] = useState<VideoCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyPaths, setBusyPaths] = useState<Set<string>>(() => new Set());
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<VideoCandidate | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeUrlRef = useRef(activeUrl);
  useEffect(() => {
    activeUrlRef.current = activeUrl;
  }, [activeUrl]);

  const addBusy = (path: string) =>
    setBusyPaths((prev) => {
      const n = new Set(prev);
      n.add(path);
      return n;
    });
  const removeBusy = (path: string) =>
    setBusyPaths((prev) => {
      const n = new Set(prev);
      n.delete(path);
      return n;
    });

  const reload = useCallback(async () => {
    try {
      const list = await listExerciseVideos(exerciseId);
      setItems(list);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [exerciseId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleUpload = async (file: File) => {
    setUploadPct(0);
    try {
      await addExerciseVideoCandidate(exerciseId, file, (p) => setUploadPct(p));
      toast.success(t.uploaded);
      await reload();
    } catch (e) {
      toast.error(fmt(t.uploadFailed, { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setUploadPct(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSetActive = async (cand: VideoCandidate) => {
    addBusy(cand.path);
    try {
      await setActiveExerciseVideo(exerciseId, cand.publicUrl);
      onActiveChange(cand.publicUrl);
      toast.success(t.activated);
    } catch (e) {
      toast.error(fmt(t.activateFailed, { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      removeBusy(cand.path);
    }
  };

  const confirmDelete = async () => {
    const cand = pendingDelete;
    if (!cand) return;
    setPendingDelete(null);
    addBusy(cand.path);
    try {
      const { clearedActive } = await deleteExerciseVideoCandidate(
        exerciseId,
        cand,
        activeUrlRef.current,
      );
      if (clearedActive) onActiveChange(null);
      toast.success(t.deleted);
      await reload();
    } catch (e) {
      toast.error(fmt(t.deleteFailed, { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      removeBusy(cand.path);
    }
  };

  return (
    <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display label-md uppercase text-accent-dark">{t.title}</p>
          <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.hint}</p>
        </div>
        <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-s uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream">
          {t.addCandidate}
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleUpload(f);
            }}
          />
        </label>
      </div>

      {uploadPct != null && (
        <p className="mt-3 font-sans text-body-xs text-warm-shadow">
          {fmt(t.uploading, { percent: uploadPct })}
        </p>
      )}

      <div className="mt-4">
        {error ? (
          <p className="rounded-xl border border-error/40 bg-error/10 px-3 py-2 font-sans text-body-s text-error">
            {fmt(t.loadFailed, { error })}
          </p>
        ) : items == null ? (
          <div className="flex items-center gap-2 font-sans text-body-xs text-warm-shadow">
            <Spinner /> {t.loading}
          </div>
        ) : items.length === 0 ? (
          <p className="font-sans text-body-s italic text-warm-shadow">{t.empty}</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {items.map((cand) => {
              const isActive = activeUrl === cand.publicUrl;
              const isBusy = busyPaths.has(cand.path);
              const anyBusy = busyPaths.size > 0;
              const disabled = isBusy || anyBusy;
              return (
                <li
                  key={cand.path}
                  className="flex flex-wrap items-center gap-3 border-b border-accent-dark/8 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={cand.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate font-mono text-[12px] text-accent-dark hover:text-glyph-gold"
                      >
                        {cand.name}
                      </a>
                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-glyph-gold/20 px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
                          {t.active}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-body-xs text-warm-shadow">
                      {formatSize(cand.sizeBytes)}
                      {cand.createdAt
                        ? ` · ${new Date(cand.createdAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => void handleSetActive(cand)}
                        disabled={disabled}
                        className="inline-flex min-h-[36px] items-center rounded-full border border-accent-dark/15 bg-cream px-3 font-display label-xs uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream disabled:opacity-60"
                      >
                        {t.setActive}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingDelete(cand)}
                      disabled={disabled}
                      className="inline-flex min-h-[36px] items-center rounded-full border border-error/40 bg-error/10 px-3 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white disabled:opacity-60"
                    >
                      {t.delete}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {items != null && items.length === 100 && (
          <p className="mt-2 font-sans text-body-xs italic text-warm-shadow">
            {t.truncatedNotice}
          </p>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        title={t.deleteTitle}
        description={
          pendingDelete && activeUrl === pendingDelete.publicUrl
            ? t.deleteMessageActive
            : t.deleteMessage
        }
        confirmLabel={t.delete}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
