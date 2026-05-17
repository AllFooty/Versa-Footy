"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../../../../_lib/supabase";
import { Spinner } from "../../../../../_components/primitives/Spinner";
import { getYouTubeEmbedUrl, isDirectVideo } from "../../_lib/youtube";
import type { Exercise, Skill, Category } from "../../_lib/types";
import type { ProductDict } from "../../../../../_dictionaries/product";
import type { Locale } from "../../../../../_dictionaries";

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type RawExercise = {
  id: number;
  skill_id: number;
  name: string;
  video_url: string | null;
  difficulty: number | null;
  description: string | null;
  equipment: string[] | null;
  minimum_duration: number | null;
};

type LoadedExercise = Exercise & {
  category: Category | null;
  primarySkill: Skill | null;
  allSkills: Skill[];
};

export function ExercisePreviewView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.library.exercisePreview;
  const params = useSearchParams();
  const idParam = params.get("id");
  const id = idParam ? Number.parseInt(idParam, 10) : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<LoadedExercise | null>(null);

  useEffect(() => {
    if (id == null || Number.isNaN(id)) {
      setError(t.notFound);
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [exRes, junctionRes] = await Promise.all([
        supabase
          .from("exercises")
          .select("id, skill_id, name, video_url, difficulty, description, equipment, minimum_duration")
          .eq("id", id)
          .single(),
        supabase
          .from("exercise_skills")
          .select("skill_id")
          .eq("exercise_id", id),
      ]);
      if (cancelled) return;
      if (exRes.error || !exRes.data) {
        setError(t.notFound);
        setLoading(false);
        return;
      }
      const raw = exRes.data as RawExercise;
      const skillIds: number[] =
        ((junctionRes.data as { skill_id: number }[] | null) ?? []).map((r) => r.skill_id) ?? [];
      const allSkillIds = skillIds.length > 0 ? skillIds : [raw.skill_id];

      const { data: skillRows } = await supabase
        .from("skills")
        .select("id, category_id, name, age_group, description")
        .in("id", allSkillIds);
      if (cancelled) return;
      const skills: Skill[] = ((skillRows ?? []) as {
        id: number;
        category_id: number;
        name: string;
        age_group: string | null;
        description: string | null;
      }[]).map((s) => ({
        id: s.id,
        categoryId: s.category_id,
        name: s.name,
        ageGroup: (s.age_group as Skill["ageGroup"]) ?? null,
        description: s.description,
      }));
      const primary = skills.find((s) => s.id === raw.skill_id) ?? skills[0] ?? null;
      let category: Category | null = null;
      if (primary) {
        const { data: cRow } = await supabase
          .from("categories")
          .select("id, name, icon, color")
          .eq("id", primary.categoryId)
          .single();
        if (cancelled) return;
        category = (cRow as Category) ?? null;
      }

      setData({
        id: raw.id,
        skillId: raw.skill_id,
        skillIds: allSkillIds,
        name: raw.name,
        videoUrl: raw.video_url,
        difficulty: raw.difficulty,
        description: raw.description,
        equipment: raw.equipment ?? [],
        minimumDuration: raw.minimum_duration,
        category,
        primarySkill: primary,
        allSkills: skills,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, t.notFound]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-10 md:py-16">
        <Link
          href={`/${lang}/library`}
          className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
        >
          <span aria-hidden className="rtl:rotate-180">←</span>
          {t.backToLibrary}
        </Link>
        <p className="mt-6 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 font-sans text-body-s text-error">
          {error ?? t.notFound}
        </p>
      </div>
    );
  }

  const embedUrl = getYouTubeEmbedUrl(data.videoUrl);
  const directVideo = !embedUrl && isDirectVideo(data.videoUrl);
  const isCombo = data.allSkills.length > 1;

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/library`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">←</span>
        {t.backToLibrary}
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display uppercase label-xs text-glyph-gold/80">{t.eyebrow}</p>
          <h1 className="mt-1 font-display text-display-s text-accent-dark md:text-display-m">
            {data.name}
          </h1>
          {data.category && data.primarySkill && (
            <p className="mt-2 font-sans text-body-s text-warm-shadow">
              {data.category.icon ? `${data.category.icon} ` : ""}
              {data.category.name}
              <span aria-hidden className="mx-2">›</span>
              {data.primarySkill.name}
              {data.primarySkill.ageGroup && (
                <span className="ms-2 font-display label-xs uppercase">
                  · {data.primarySkill.ageGroup}
                </span>
              )}
            </p>
          )}
        </div>
        <Link
          href={`/${lang}/library/exercise/edit?id=${data.id}`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-glyph-gold px-5 py-2 font-display label-s uppercase tracking-wide text-accent-dark transition-colors hover:bg-glyph-gold/90"
        >
          {t.editExercise}
        </Link>
      </header>

      <section className="mt-6 overflow-hidden rounded-2xl border border-accent-dark/10 bg-black shadow-sm">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={data.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        ) : directVideo && data.videoUrl ? (
          <video
            src={data.videoUrl}
            controls
            playsInline
            className="aspect-video w-full bg-black"
          >
            {t.videoNotSupported}
          </video>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-accent-dark/8 text-warm-shadow">
            <p className="font-sans text-body-s">{t.noVideoAvailable}</p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Stat
          label={t.difficulty}
          value={data.difficulty != null ? "★".repeat(data.difficulty) + "☆".repeat(Math.max(0, 5 - data.difficulty)) : "—"}
        />
        <Stat
          label={dict.library.exerciseDuration.replace("{{min}}", "·")}
          value={data.minimumDuration != null ? fmt(t.duration, { min: data.minimumDuration }) : "—"}
        />
        <Stat
          label={t.equipment}
          value={data.equipment.length > 0 ? data.equipment.join(", ") : t.noEquipment}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <h2 className="font-display label-md uppercase text-accent-dark">{t.description}</h2>
        <p className="mt-2 whitespace-pre-line font-sans text-body-m text-accent-dark">
          {data.description?.trim() ? data.description : t.noDescription}
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-accent-dark/10 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display label-md uppercase text-accent-dark">{t.skillsLabel}</h2>
          {isCombo && (
            <span className="inline-flex items-center rounded-full bg-glyph-gold/20 px-2 py-0.5 font-display label-xs uppercase text-accent-dark">
              {t.combo}
            </span>
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.allSkills.map((s) => (
            <li
              key={s.id}
              className={`inline-flex items-center rounded-full border px-3 py-1 font-sans text-body-xs ${
                s.id === data.primarySkill?.id
                  ? "border-glyph-gold/50 bg-glyph-gold/15 text-accent-dark"
                  : "border-accent-dark/15 bg-cream text-accent-dark/80"
              }`}
            >
              {s.name}
              {s.ageGroup && (
                <span className="ms-2 font-display label-xs uppercase text-warm-shadow">
                  {s.ageGroup}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-accent-dark/10 bg-white p-4 shadow-sm">
      <p className="font-display label-xs uppercase text-warm-shadow">{label}</p>
      <p className="mt-1 font-sans text-body-m text-accent-dark">{value}</p>
    </div>
  );
}
