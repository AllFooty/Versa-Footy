"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../../../_lib/supabase";
import { Input } from "../../../../../_components/primitives/Input";
import { Textarea } from "../../../../../_components/primitives/Textarea";
import { Field } from "../../../../../_components/primitives/Field";
import { Spinner } from "../../../../../_components/primitives/Spinner";
import { toast } from "../../../../../_components/primitives/Toast";
import {
  addExercise,
  updateExercise,
  type ExerciseInput,
} from "../../_hooks/useExerciseMutations";
import {
  isAcceptableExternalUrl,
  isUploadedStorageUrl,
} from "../../_lib/storage";
import type { Category, Exercise, Skill } from "../../_lib/types";
import type { ProductDict } from "../../../../../_dictionaries/product";
import type { Locale } from "../../../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type FormState = {
  name: string;
  skillIds: number[];
  difficulty: number;
  duration: string;
  description: string;
  equipment: string[];
  videoUrl: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  skillIds: [],
  difficulty: 1,
  duration: "",
  description: "",
  equipment: [],
  videoUrl: "",
};

export function ExerciseEditView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.library.exerciseEdit;
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const skillIdParam = params.get("skillId");
  const id = idParam ? Number.parseInt(idParam, 10) : null;
  const isEdit = id != null && !Number.isNaN(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [previous, setPrevious] = useState<Exercise | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [equipmentDraft, setEquipmentDraft] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [cRes, sRes] = await Promise.all([
        supabase.from("categories").select("id, name, icon, color").order("id"),
        supabase.from("skills").select("id, category_id, name, age_group, description").order("id"),
      ]);
      if (cancelled) return;
      if (cRes.error || sRes.error) {
        setError(cRes.error?.message ?? sRes.error?.message ?? "Load failed");
        setLoading(false);
        return;
      }
      const cats = (cRes.data as Category[]) ?? [];
      const sks = ((sRes.data as {
        id: number;
        category_id: number;
        name: string;
        age_group: string | null;
        description: string | null;
      }[]) ?? []).map((s) => ({
        id: s.id,
        categoryId: s.category_id,
        name: s.name,
        ageGroup: (s.age_group as Skill["ageGroup"]) ?? null,
        description: s.description,
      }));
      setCategories(cats);
      setSkills(sks);

      if (isEdit && id != null) {
        const [exRes, junctionRes] = await Promise.all([
          supabase
            .from("exercises")
            .select(
              "id, skill_id, name, video_url, difficulty, description, equipment, minimum_duration",
            )
            .eq("id", id)
            .single(),
          supabase.from("exercise_skills").select("skill_id").eq("exercise_id", id),
        ]);
        if (cancelled) return;
        if (exRes.error || !exRes.data) {
          setError(t.notFound);
          setLoading(false);
          return;
        }
        const r = exRes.data as {
          id: number;
          skill_id: number;
          name: string;
          video_url: string | null;
          difficulty: number | null;
          description: string | null;
          equipment: string[] | null;
          minimum_duration: number | null;
        };
        const junctionIds = ((junctionRes.data as { skill_id: number }[] | null) ?? []).map(
          (j) => j.skill_id,
        );
        const allSkillIds = junctionIds.length > 0 ? junctionIds : [r.skill_id];
        setPrevious({
          id: r.id,
          skillId: r.skill_id,
          skillIds: allSkillIds,
          name: r.name,
          videoUrl: r.video_url,
          difficulty: r.difficulty,
          description: r.description,
          equipment: r.equipment ?? [],
          minimumDuration: r.minimum_duration,
        });
        setForm({
          name: r.name,
          skillIds: allSkillIds,
          difficulty: r.difficulty ?? 1,
          duration: r.minimum_duration?.toString() ?? "",
          description: r.description ?? "",
          equipment: r.equipment ?? [],
          videoUrl: r.video_url ?? "",
        });
      } else {
        const preselect = skillIdParam ? Number.parseInt(skillIdParam, 10) : null;
        if (preselect && sks.some((s) => s.id === preselect)) {
          setForm((prev) => ({ ...prev, skillIds: [preselect] }));
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  const skillsByCategory = useMemo(() => {
    const term = skillSearch.trim().toLowerCase();
    const result = new Map<number, Skill[]>();
    for (const s of skills) {
      if (term && !s.name.toLowerCase().includes(term)) continue;
      const list = result.get(s.categoryId) ?? [];
      list.push(s);
      result.set(s.categoryId, list);
    }
    return result;
  }, [skills, skillSearch]);

  const visibleCategories = categories.filter((c) => skillsByCategory.has(c.id));

  const toggleSkill = (sid: number) => {
    setForm((prev) => {
      const has = prev.skillIds.includes(sid);
      return {
        ...prev,
        skillIds: has ? prev.skillIds.filter((x) => x !== sid) : [...prev.skillIds, sid],
      };
    });
  };

  const addEquipment = () => {
    const v = equipmentDraft.trim();
    if (!v) return;
    if (form.equipment.includes(v)) {
      setEquipmentDraft("");
      return;
    }
    setForm({ ...form, equipment: [...form.equipment, v] });
    setEquipmentDraft("");
  };

  const removeEquipment = (item: string) => {
    setForm({ ...form, equipment: form.equipment.filter((e) => e !== item) });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setVideoFile(file);
    if (file) {
      // clear any external URL when a file is staged
      setForm((prev) => ({ ...prev, videoUrl: "" }));
    }
  };

  const clearVideo = () => {
    setVideoFile(null);
    setForm({ ...form, videoUrl: "" });
    if (fileRef.current) fileRef.current.value = "";
    toast.success(t.videoRemoved);
  };

  const handleExternalUrl = (v: string) => {
    setForm({ ...form, videoUrl: v });
    setVideoFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(t.nameRequired);
      return;
    }
    if (form.skillIds.length === 0) {
      toast.error(t.skillsRequired);
      return;
    }
    if (
      form.videoUrl &&
      !isUploadedStorageUrl(form.videoUrl) &&
      !isAcceptableExternalUrl(form.videoUrl)
    ) {
      toast.error(t.videoExternalInvalid);
      return;
    }
    setBusy(true);
    setUploadPercent(videoFile ? 0 : null);
    try {
      const duration = form.duration.trim() ? Number.parseInt(form.duration, 10) : null;
      const payload: ExerciseInput = {
        name: form.name.trim(),
        skillIds: form.skillIds,
        videoUrl: form.videoUrl.trim() || null,
        difficulty: form.difficulty,
        description: form.description.trim() ? form.description : null,
        equipment: form.equipment,
        minimumDuration: duration != null && !Number.isNaN(duration) ? duration : null,
      };
      const onProgress = videoFile
        ? (p: number) => setUploadPercent(p)
        : undefined;
      if (isEdit && id != null) {
        await updateExercise(id, payload, previous, videoFile, onProgress);
        toast.success(t.updatedToast);
      } else {
        await addExercise(payload, videoFile, onProgress);
        toast.success(t.createdToast);
      }
      router.push(`/${lang}/library`);
    } catch (e) {
      toast.error(fmt(t.saveError, { error: e instanceof Error ? e.message : String(e) }));
    } finally {
      setBusy(false);
      setUploadPercent(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isCombo = form.skillIds.length > 1;
  const hasUploadedVideo = isUploadedStorageUrl(form.videoUrl);

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/library`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToLibrary}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">{t.eyebrow}</p>
        <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
          {isEdit ? t.editTitle : t.newTitle}
        </h1>
      </header>

      {error && (
        <p className="mt-4 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 font-sans text-body-s text-error">
          {error}
        </p>
      )}

      <section className="mt-8 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <Field label={t.nameLabel}>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t.namePlaceholder}
            autoFocus
          />
        </Field>
      </section>

      <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display label-md uppercase text-accent-dark">{t.skillsLabel}</p>
          <p className="font-sans text-body-xs text-warm-shadow">
            {fmt(t.selectedCount, { count: form.skillIds.length })}
            {isCombo && (
              <span className="ms-2 inline-flex items-center rounded-full bg-glyph-gold/20 px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
                {t.combo}
              </span>
            )}
          </p>
        </div>
        <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.skillsHint}</p>
        <div className="mt-3">
          <Input
            type="search"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            placeholder={t.skillSearchPlaceholder}
          />
        </div>
        <div className="mt-3 max-h-[280px] space-y-3 overflow-y-auto rounded-xl border border-accent-dark/10 bg-cream/30 p-3">
          {visibleCategories.length === 0 ? (
            <p className="font-sans text-body-s italic text-warm-shadow">{t.noSkillsMatch}</p>
          ) : (
            visibleCategories.map((c) => (
              <div key={c.id}>
                <p className="mb-1 font-display label-xs uppercase text-warm-shadow">
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </p>
                <ul className="m-0 list-none p-0">
                  {(skillsByCategory.get(c.id) ?? []).map((s) => {
                    const checked = form.skillIds.includes(s.id);
                    return (
                      <li key={s.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 font-sans text-body-s text-accent-dark hover:bg-cream/60">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSkill(s.id)}
                            className="h-4 w-4 accent-glyph-gold"
                          />
                          <span className="flex-1">{s.name}</span>
                          {s.ageGroup && (
                            <span className="font-display label-xs uppercase text-warm-shadow">
                              {s.ageGroup}
                            </span>
                          )}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-4 grid gap-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:grid-cols-2 md:p-6">
        <Field label={t.difficultyLabel} hint={t.difficultyScale}>
          <input
            type="range"
            min={0}
            max={5}
            step={1}
            value={form.difficulty}
            onChange={(e) =>
              setForm({ ...form, difficulty: Number.parseInt(e.target.value, 10) })
            }
            className="h-2 w-full accent-glyph-gold"
          />
          <p className="mt-1 font-sans text-body-s text-accent-dark">
            {"★".repeat(form.difficulty)}
            {"☆".repeat(Math.max(0, 5 - form.difficulty))} ({form.difficulty})
          </p>
        </Field>
        <Field label={t.durationLabel} hint={t.durationHint}>
          <Input
            type="number"
            min={0}
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            placeholder="—"
          />
        </Field>
      </section>

      <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <Field label={t.descriptionLabel}>
          <Textarea
            rows={5}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={t.descriptionPlaceholder}
          />
        </Field>
      </section>

      <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <p className="font-display label-md uppercase text-accent-dark">{t.equipmentLabel}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {form.equipment.length === 0 ? (
            <p className="font-sans text-body-s italic text-warm-shadow">{t.equipmentEmpty}</p>
          ) : (
            form.equipment.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-3 py-1 font-sans text-body-xs text-accent-dark"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeEquipment(item)}
                  className="font-mono text-warm-shadow hover:text-error"
                  aria-label="remove"
                >
                  ✕
                </button>
              </span>
            ))
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={equipmentDraft}
            onChange={(e) => setEquipmentDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addEquipment();
              }
            }}
            placeholder={t.equipmentPlaceholder}
            className="flex-1"
          />
          <button
            type="button"
            onClick={addEquipment}
            className="inline-flex min-h-[44px] items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-s uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
          >
            {t.equipmentAdd}
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <p className="font-display label-md uppercase text-accent-dark">{t.videoLabel}</p>
        <p className="mt-1 font-sans text-body-xs text-warm-shadow">{t.videoHint}</p>

        {(form.videoUrl || videoFile) && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-accent-dark/10 bg-cream/40 px-3 py-2">
            <span className="flex-1 truncate font-mono text-[12px] text-accent-dark/80">
              {videoFile ? videoFile.name : form.videoUrl}
            </span>
            <button
              type="button"
              onClick={clearVideo}
              className="inline-flex min-h-[36px] items-center rounded-full border border-error/40 bg-error/10 px-3 font-display label-xs uppercase text-error transition-colors hover:bg-error hover:text-white"
            >
              {t.videoRemove}
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="inline-flex min-h-[44px] cursor-pointer items-center rounded-full border border-accent-dark/15 bg-cream px-4 py-2 font-display label-s uppercase text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream">
            {hasUploadedVideo || videoFile ? t.videoReplaceButton : t.videoUploadButton}
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              onChange={handleFile}
              className="hidden"
            />
          </label>
          {uploadPercent != null && (
            <span className="font-sans text-body-xs text-warm-shadow">
              {fmt(t.videoUploading, { percent: uploadPercent })}
            </span>
          )}
        </div>

        <div className="mt-4">
          <Field label={t.videoExternalLabel}>
            <Input
              value={hasUploadedVideo ? "" : form.videoUrl}
              onChange={(e) => handleExternalUrl(e.target.value)}
              placeholder={t.videoExternalPlaceholder}
              disabled={!!videoFile}
            />
          </Field>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={busy}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90 disabled:opacity-60"
        >
          {busy ? t.saving : t.save}
        </button>
        <Link
          href={`/${lang}/library`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-accent-dark/15 bg-cream px-6 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-accent-dark hover:text-cream"
        >
          {dict.common.cancel}
        </Link>
      </div>
    </div>
  );
}
