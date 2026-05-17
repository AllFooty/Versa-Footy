"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../_lib/auth/AuthProvider";
import { supabase } from "../../_lib/supabase";
import { Button } from "../../_components/primitives/Button";
import { Input } from "../../_components/primitives/Input";
import { Field } from "../../_components/primitives/Field";
import { Spinner } from "../../_components/primitives/Spinner";
import { toast } from "../../_components/primitives/Toast";
import type { ProductDict } from "../../_dictionaries/product";
import type { Locale } from "../../_dictionaries";

type InvitePreview = {
  id: string;
  organization_id: string;
  role: string;
  team_id: string | null;
  team_name: string | null;
  organizations: {
    name: string;
    type: string;
    logo_url?: string | null;
    description?: string | null;
  };
  already_member: boolean;
  requires_email_match: boolean;
};

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

async function lookupInviteCode(
  code: string,
): Promise<{ invitation: InvitePreview | null; error: string | null }> {
  const { data, error } = await supabase.rpc("lookup_invite_code", {
    p_code: code,
  });
  if (error) return { invitation: null, error: error.message };
  if (!data) return { invitation: null, error: "invalid" };
  return {
    invitation: {
      id: data.invitation_id,
      organization_id: data.organization_id,
      role: data.role,
      team_id: data.team_id,
      team_name: data.team_name,
      organizations: {
        name: data.organization_name,
        type: data.organization_type,
        logo_url: data.organization_logo_url,
        description: data.organization_description,
      },
      already_member: data.already_member,
      requires_email_match: data.requires_email_match,
    },
    error: null,
  };
}

async function acceptInvitation(
  inviteCode: string,
): Promise<{ already_member?: boolean } | null> {
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_invite_code: inviteCode,
  });
  if (error) throw error;
  return data;
}

export function JoinView({ dict, lang }: { dict: ProductDict; lang: Locale }) {
  const t = dict.join;
  const router = useRouter();
  const search = useSearchParams();
  const { isAuthenticated, loading, refreshOrganizations, organizations } =
    useAuth();

  const code = (search?.get("code") ?? "").trim().toUpperCase();

  const [invitation, setInvitation] = useState<InvitePreview | null>(null);
  const [lookupLoading, setLookupLoading] = useState(!!code);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Redirect to login if not authenticated; preserve full join URL in next=.
  useEffect(() => {
    if (loading || isAuthenticated) return;
    const target = code ? `/${lang}/join?code=${code}` : `/${lang}/join`;
    router.replace(`/${lang}/login?next=${encodeURIComponent(target)}`);
  }, [loading, isAuthenticated, code, lang, router]);

  // Look up the invite code when present.
  useEffect(() => {
    if (!code || !isAuthenticated) return;
    let cancelled = false;
    setLookupLoading(true);
    setLookupError(null);
    lookupInviteCode(code).then(({ invitation: inv, error }) => {
      if (cancelled) return;
      if (error || !inv) {
        setLookupError(t.invalidOrExpired);
      } else {
        setInvitation(inv);
        if (inv.already_member) setAlreadyMember(true);
      }
      setLookupLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [code, isAuthenticated, t.invalidOrExpired]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualCode.trim().toUpperCase();
    if (trimmed.length < 6) return;
    setManualSubmitting(true);
    router.push(`/${lang}/join?code=${trimmed}`);
  };

  const handleAccept = async () => {
    if (!invitation) return;
    setAccepting(true);
    try {
      const prevOrgIds = new Set(organizations.map((o) => o.id));
      const result = await acceptInvitation(code);
      await refreshOrganizations();
      const serverAlready = result?.already_member === true;
      if (serverAlready || prevOrgIds.has(invitation.organization_id)) {
        setAlreadyMember(true);
      }
      setAccepted(true);
      setTimeout(() => {
        const isCoachRole = ["coach", "admin", "owner"].includes(invitation.role);
        router.push(isCoachRole ? `/${lang}/academy` : `/${lang}/home`);
      }, 2000);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    } finally {
      setAccepting(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-6 py-16 md:py-20">
      <header className="text-center">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
      </header>

      <div className="mt-6 rounded-3xl border border-accent-dark/10 bg-white p-8 md:p-10">
        {lookupLoading ? (
          <div role="status" aria-live="polite" className="py-6 text-center">
            <Spinner />
            <p className="mt-4 font-sans text-body-s text-warm-shadow">
              {t.lookingUpInvite}
            </p>
          </div>
        ) : !code ? (
          <ManualEntry
            value={manualCode}
            onChange={setManualCode}
            onSubmit={handleManualSubmit}
            submitting={manualSubmitting}
            lang={lang}
            t={t}
          />
        ) : lookupError ? (
          <Result
            tone="error"
            title={t.invalidInvite}
            description={lookupError}
            primary={{
              label: t.tryAnotherCode,
              onClick: () => router.push(`/${lang}/join`),
            }}
            secondary={{
              label: t.goHome,
              href: `/${lang}/home`,
            }}
          />
        ) : accepted ? (
          <Result
            tone="success"
            title={alreadyMember ? t.alreadyMember : t.youreIn}
            description={
              alreadyMember
                ? fmt(t.alreadyMemberDesc, {
                    orgName: invitation?.organizations.name ?? "",
                  })
                : fmt(t.joinedAs, {
                    orgName: invitation?.organizations.name ?? "",
                    role: invitation?.role ?? "",
                  })
            }
          />
        ) : alreadyMember && invitation ? (
          <Result
            tone="success"
            title={t.alreadyMember}
            description={fmt(t.alreadyMemberDesc, {
              orgName: invitation.organizations.name,
            })}
            primary={{
              label: t.alreadyMemberCta,
              onClick: () => router.push(`/${lang}/academy`),
            }}
          />
        ) : invitation ? (
          <InvitePrompt
            invitation={invitation}
            onAccept={handleAccept}
            onDecline={() => router.push(`/${lang}/home`)}
            accepting={accepting}
            t={t}
          />
        ) : null}
      </div>
    </div>
  );
}

type JoinT = ProductDict["join"];

function ManualEntry({
  value,
  onChange,
  onSubmit,
  submitting,
  lang,
  t,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  lang: Locale;
  t: JoinT;
}) {
  return (
    <>
      <IconCircle tone="info" symbol="#" />
      <h1 className="mt-5 text-center font-display font-black uppercase leading-[1.05] tracking-[-0.015em] text-[clamp(22px,3vw,28px)] text-accent-dark">
        {t.enterCodeTitle}
      </h1>
      <p className="mt-3 text-center font-sans text-body-s text-accent-dark/70">
        {t.enterCodeDesc}
      </p>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field label="" htmlFor="invite-code">
          <Input
            id="invite-code"
            type="text"
            value={value}
            onChange={(e) =>
              onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
            }
            placeholder={t.codePlaceholder}
            aria-label={t.enterCodeTitle}
            maxLength={12}
            autoFocus
            autoComplete="off"
            className="text-center font-mono text-[20px] tracking-[0.15em]"
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={value.trim().length < 6 || submitting}
        >
          {t.continue}
        </Button>
        <Link
          href={`/${lang}/home`}
          className="text-center font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
        >
          {t.goHome}
        </Link>
      </form>
    </>
  );
}

function InvitePrompt({
  invitation,
  onAccept,
  onDecline,
  accepting,
  t,
}: {
  invitation: InvitePreview;
  onAccept: () => void;
  onDecline: () => void;
  accepting: boolean;
  t: JoinT;
}) {
  return (
    <>
      <IconCircle tone="info" symbol="★" />
      <h1 className="mt-5 text-center font-display font-black uppercase leading-[1.05] tracking-[-0.015em] text-[clamp(22px,3vw,28px)] text-accent-dark">
        {t.youveBeenInvited}
      </h1>
      <div className="mt-6 rounded-2xl bg-warm-shadow/5 p-5 text-center">
        {invitation.organizations.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invitation.organizations.logo_url}
            alt={invitation.organizations.name}
            className="mx-auto mb-2 h-12 w-12 rounded-xl object-cover"
          />
        ) : null}
        <p className="font-display uppercase label-md font-bold text-accent-dark">
          {invitation.organizations.name}
        </p>
        <p className="mt-1 font-sans text-body-xs uppercase tracking-wide text-warm-shadow">
          {invitation.organizations.type}
        </p>
        {invitation.organizations.description ? (
          <p className="mt-3 font-sans text-body-s leading-relaxed text-accent-dark/70">
            {invitation.organizations.description}
          </p>
        ) : null}
      </div>
      <p className="mt-4 text-center font-sans text-body-s text-accent-dark/70">
        {fmt(t.joiningAs, { role: invitation.role })}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={onAccept}
          disabled={accepting}
        >
          {accepting ? t.joining : t.acceptInvitation}
        </Button>
        <button
          type="button"
          onClick={onDecline}
          className="font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
        >
          {t.decline}
        </button>
      </div>
    </>
  );
}

function Result({
  tone,
  title,
  description,
  primary,
  secondary,
}: {
  tone: "success" | "error";
  title: string;
  description: string;
  primary?: { label: string; onClick: () => void };
  secondary?: { label: string; href: string };
}) {
  return (
    <div role="status" aria-live="polite" className="text-center">
      <IconCircle tone={tone} symbol={tone === "success" ? "✓" : "!"} />
      <h1 className="mt-5 font-display font-black uppercase leading-[1.05] tracking-[-0.015em] text-[clamp(22px,3vw,28px)] text-accent-dark">
        {title}
      </h1>
      <p className="mt-3 font-sans text-body-s text-accent-dark/70">
        {description}
      </p>
      {primary || secondary ? (
        <div className="mt-6 flex flex-col gap-3">
          {primary ? (
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={primary.onClick}
            >
              {primary.label}
            </Button>
          ) : null}
          {secondary ? (
            <Link
              href={secondary.href}
              className="font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
            >
              {secondary.label}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function IconCircle({
  tone,
  symbol,
}: {
  tone: "info" | "success" | "error";
  symbol: string;
}) {
  const classes =
    tone === "success"
      ? "bg-success/15 text-success border-success/30"
      : tone === "error"
        ? "bg-error/15 text-error border-error/30"
        : "bg-glyph-gold/15 text-accent-dark border-glyph-gold/40";
  return (
    <div
      aria-hidden
      className={`mx-auto grid h-14 w-14 place-items-center rounded-full border-2 font-display text-[22px] font-black ${classes}`}
    >
      {symbol}
    </div>
  );
}
