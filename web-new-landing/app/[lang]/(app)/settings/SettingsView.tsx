"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../_lib/auth/AuthProvider";
import { Button } from "../../../_components/primitives/Button";
import { Input } from "../../../_components/primitives/Input";
import { Field } from "../../../_components/primitives/Field";
import { ConfirmDialog } from "../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../_components/primitives/Toast";
import type { ProductDict } from "../../../_dictionaries/product";
import type { Locale } from "../../../_dictionaries";

const COOLDOWN_DAYS = 7;

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function getInitials(name: string, email: string | undefined): string {
  if (name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "U";
}

export function SettingsView({ dict, lang }: { dict: ProductDict; lang: Locale }) {
  const t = dict.settings;
  const router = useRouter();
  const { user, profile, updateProfile, deleteAccount, profileLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile?.full_name && typeof profile.full_name === "string") {
      setFullName(profile.full_name);
    }
  }, [profile?.full_name]);

  const lastEditRaw = (profile as { updated_at?: string } | null)?.updated_at;
  const lastEdit = lastEditRaw ? new Date(lastEditRaw) : null;
  const daysSinceEdit = lastEdit
    ? (Date.now() - lastEdit.getTime()) / 86_400_000
    : Infinity;
  const hasSetNameBefore = !!profile?.full_name;
  const canEdit = !hasSetNameBefore || daysSinceEdit >= COOLDOWN_DAYS;
  const daysUntilEdit = canEdit ? 0 : Math.ceil(COOLDOWN_DAYS - daysSinceEdit);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    if (!fullName.trim()) {
      setNameError(t.enterNameError);
      return;
    }
    if (!canEdit) {
      setNameError(fmt(t.editCooldownLocked, { days: daysUntilEdit }));
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      toast.success(t.profileSaved);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      router.replace(`/${lang}`);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 py-12 md:px-10 md:py-16">
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

      <section className="mt-10 rounded-3xl border border-accent-dark/10 bg-white p-7 md:p-9">
        <h2 className="font-display uppercase label-md font-bold text-accent-dark">
          {t.profileInfo}
        </h2>

        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-warm-shadow/5 p-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-glyph-gold to-shadow-plumage font-display text-[18px] font-black text-accent-dark">
            {getInitials(fullName, user?.email ?? undefined)}
          </div>
          <div className="min-w-0">
            <div className="truncate font-display uppercase label-md font-bold text-accent-dark">
              {fullName || t.yourName}
            </div>
            <div className="truncate font-sans text-body-s text-warm-shadow">
              {user?.email}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="mt-6 flex flex-col gap-5">
          <Field
            label={t.fullNameLabel}
            htmlFor="fullName"
            error={nameError}
            hint={!canEdit ? fmt(t.editCooldownLocked, { days: daysUntilEdit }) : undefined}
          >
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              disabled={!canEdit || saving}
              autoComplete="name"
              invalid={!!nameError}
            />
          </Field>

          <Field label={t.emailLabel} htmlFor="email" hint={t.emailCannotChange}>
            <Input
              id="email"
              type="email"
              value={user?.email ?? ""}
              disabled
              readOnly
            />
          </Field>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving || profileLoading || !canEdit}
          >
            {saving ? t.saving : t.saveChanges}
          </Button>
        </form>
      </section>

      <section className="mt-10 rounded-3xl border border-error/30 bg-error/5 p-7 md:p-9">
        <h2 className="font-display uppercase label-md font-bold text-error">
          {t.dangerZone}
        </h2>
        <p className="mt-3 font-sans text-body-s text-accent-dark/70">
          {t.deleteAccountWarning}
        </p>
        <div className="mt-5">
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            {deleting ? t.deleting : t.deleteAccountButton}
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t.deleteConfirmTitle}
        description={t.deleteConfirmDescription}
        confirmLabel={t.deleteConfirmButton}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={handleDelete}
        onCancel={() => !deleting && setShowDeleteConfirm(false)}
      />
    </div>
  );
}
