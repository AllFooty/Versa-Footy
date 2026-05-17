"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../../_lib/auth/AuthProvider";
import { supabase } from "../../../../_lib/supabase";
import { Button } from "../../../../_components/primitives/Button";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Field } from "../../../../_components/primitives/Field";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

const ORG_TYPES = ["academy", "school", "club", "federation", "ministry"] as const;
type OrgType = (typeof ORG_TYPES)[number];

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

export function CreateOrgView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.orgCreate;
  const router = useRouter();
  const { refreshOrganizations } = useAuth();

  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("academy");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const typeLabels: Record<OrgType, string> = {
    academy: t.typeAcademy,
    school: t.typeSchool,
    club: t.typeClub,
    federation: t.typeFederation,
    ministry: t.typeMinistry,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t.nameRequired);
      return;
    }
    setSubmitting(true);
    try {
      const { error: orgError } = await supabase.rpc("create_organization", {
        p_name: trimmed,
        p_type: type,
        p_region: region.trim() || null,
        p_city: city.trim() || null,
      });
      if (orgError) throw orgError;
      await refreshOrganizations();
      setSuccess(true);
      setTimeout(() => router.push(`/${lang}/academy`), 800);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-6 py-16 md:py-24">
        <div
          role="status"
          aria-live="polite"
          className="rounded-3xl border border-success/30 bg-success/5 p-10 text-center"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-success/15">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-success"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="mt-6 font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(24px,4vw,36px)] text-accent-dark">
            {t.successTitle}
          </h1>
          <p className="mt-3 font-sans text-body-m text-accent-dark/70">
            {fmt(t.successBody, { name: name.trim() })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[640px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/home`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">
          ←
        </span>
        {t.backToHome}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(32px,5vw,48px)] text-accent-dark">
          {t.title}
        </h1>
        <p className="mt-3 font-sans text-body-m text-accent-dark/70">
          {t.subtitle}
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-10 flex flex-col gap-5 rounded-3xl border border-accent-dark/10 bg-white p-7 md:p-9"
      >
        <Field label={t.nameLabel} htmlFor="org-name" error={nameError}>
          <Input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
            required
            autoFocus
            invalid={!!nameError}
            disabled={submitting}
          />
        </Field>

        <Field label={t.typeLabel} htmlFor="org-type">
          <Select
            id="org-type"
            value={type}
            onChange={(e) => setType(e.target.value as OrgType)}
            disabled={submitting}
          >
            {ORG_TYPES.map((orgType) => (
              <option key={orgType} value={orgType}>
                {typeLabels[orgType]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label={t.regionLabel} htmlFor="org-region">
            <Input
              id="org-region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder={t.regionPlaceholder}
              disabled={submitting}
            />
          </Field>

          <Field label={t.cityLabel} htmlFor="org-city">
            <Input
              id="org-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.cityPlaceholder}
              disabled={submitting}
            />
          </Field>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting || !name.trim()}
          className="mt-2"
        >
          {submitting ? t.creating : t.createButton}
        </Button>
      </form>
    </div>
  );
}
