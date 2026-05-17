"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../../../../_lib/auth/AuthProvider";
import {
  useInvitations,
  type Invitation,
  type InvitationRole,
} from "../../../../_lib/academy/useInvitations";
import { Button } from "../../../../_components/primitives/Button";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Field } from "../../../../_components/primitives/Field";
import { Skeleton } from "../../../../_components/primitives/Skeleton";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type T = ProductDict["invitations"];

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

type TabKey = "email" | "code" | "all";

export function InvitationsView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.invitations;
  const { activeOrg } = useAuth();
  const {
    invitations,
    loading,
    inviteByEmail,
    inviteByCode,
    revokeInvitation,
  } = useInvitations(activeOrg?.id);

  const [tab, setTab] = useState<TabKey>("email");

  return (
    <div className="mx-auto w-full max-w-[920px] px-6 py-12 md:px-10 md:py-16">
      <Link
        href={`/${lang}/academy`}
        className="inline-flex items-center gap-2 font-sans text-body-s text-warm-shadow transition-colors hover:text-accent-dark"
      >
        <span aria-hidden className="rtl:rotate-180">
          ←
        </span>
        {t.backToDashboard}
      </Link>

      <header className="mt-6">
        <p className="font-display uppercase label-xs text-glyph-gold/80">
          {t.eyebrow}
        </p>
        <h1 className="mt-2 font-display font-black uppercase leading-[1.02] tracking-[-0.015em] text-[clamp(28px,4.5vw,44px)] text-accent-dark">
          {activeOrg?.name ? fmt(t.title, { orgName: activeOrg.name }) : t.titleFallback}
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-body-m text-accent-dark/70">
          {t.subtitle}
        </p>
      </header>

      <div className="mt-8 inline-flex gap-1 rounded-full bg-warm-shadow/10 p-1">
        <TabButton active={tab === "email"} onClick={() => setTab("email")}>
          {t.tabEmail}
        </TabButton>
        <TabButton active={tab === "code"} onClick={() => setTab("code")}>
          {t.tabCode}
        </TabButton>
        <TabButton active={tab === "all"} onClick={() => setTab("all")}>
          {t.tabAll}
          {invitations.length > 0 ? (
            <span className="ms-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-glyph-gold/20 px-1.5 font-display label-xs text-accent-dark">
              {invitations.length}
            </span>
          ) : null}
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "email" ? (
          <EmailInviteTab
            t={t}
            commonError={dict.common.genericError}
            inviteByEmail={inviteByEmail}
          />
        ) : tab === "code" ? (
          <CodeInviteTab
            t={t}
            commonError={dict.common.genericError}
            inviteByCode={inviteByCode}
            lang={lang}
          />
        ) : (
          <InvitationsListTab
            t={t}
            commonError={dict.common.genericError}
            invitations={invitations}
            loading={loading}
            onRevoke={revokeInvitation}
            lang={lang}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-4 py-1.5 font-display uppercase label-xs transition-colors ${
        active
          ? "bg-white text-accent-dark shadow-[0_4px_18px_-10px_rgba(36,23,15,0.5)]"
          : "text-warm-shadow hover:text-accent-dark"
      }`}
    >
      {children}
    </button>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-accent-dark/10 bg-white p-7 md:p-9">
      {children}
    </div>
  );
}

const ROLES: { value: InvitationRole; key: "rolePlayer" | "roleCoach" | "roleParent" }[] = [
  { value: "player", key: "rolePlayer" },
  { value: "coach", key: "roleCoach" },
  { value: "parent", key: "roleParent" },
];

function EmailInviteTab({
  t,
  commonError,
  inviteByEmail,
}: {
  t: T;
  commonError: string;
  inviteByEmail: (args: {
    email: string;
    role: InvitationRole;
  }) => Promise<unknown>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InvitationRole>("player");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await inviteByEmail({ email: trimmed, role });
      toast.success(fmt(t.invitationSentTo, { email: trimmed }));
      setEmail("");
    } catch (err) {
      toast.error((err as Error).message || commonError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2 className="font-display uppercase label-md font-bold text-accent-dark">
        {t.emailInviteTitle}
      </h2>
      <p className="mt-2 font-sans text-body-s text-accent-dark/70">
        {t.emailInviteDescription}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        <Field label={t.emailLabel} htmlFor="invite-email">
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.emailPlaceholder}
            disabled={submitting}
            required
          />
        </Field>
        <Field label={t.roleLabel} htmlFor="invite-role">
          <Select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as InvitationRole)}
            disabled={submitting}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {t[r.key]}
              </option>
            ))}
          </Select>
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={submitting || !email.trim()}
        >
          {submitting ? t.sending : t.sendInvitation}
        </Button>
      </form>
    </Card>
  );
}

function CodeInviteTab({
  t,
  commonError,
  inviteByCode,
  lang,
}: {
  t: T;
  commonError: string;
  inviteByCode: (args: { role: InvitationRole }) => Promise<Invitation>;
  lang: Locale;
}) {
  const [role, setRole] = useState<InvitationRole>("player");
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const handleGenerate = async () => {
    setSubmitting(true);
    setGeneratedCode(null);
    try {
      const inv = await inviteByCode({ role });
      setGeneratedCode(inv.invite_code ?? null);
    } catch (err) {
      toast.error((err as Error).message || commonError);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string, which: "code" | "link") => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const joinUrl =
    generatedCode && typeof window !== "undefined"
      ? `${window.location.origin}/${lang}/join?code=${generatedCode}`
      : null;

  return (
    <Card>
      <h2 className="font-display uppercase label-md font-bold text-accent-dark">
        {t.codeInviteTitle}
      </h2>
      <p className="mt-2 font-sans text-body-s text-accent-dark/70">
        {t.codeInviteDescription}
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <Field label={t.roleForInvitees} htmlFor="code-role">
          <Select
            id="code-role"
            value={role}
            onChange={(e) => setRole(e.target.value as InvitationRole)}
            disabled={submitting}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {t[r.key]}
              </option>
            ))}
          </Select>
        </Field>

        {!generatedCode ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleGenerate}
            disabled={submitting}
          >
            {submitting ? t.generating : t.generateInviteCode}
          </Button>
        ) : (
          <div className="rounded-2xl bg-warm-shadow/5 p-5">
            <div className="flex items-center gap-3 rounded-xl bg-white p-3">
              <span className="flex-1 truncate font-mono text-[22px] font-bold tracking-[0.15em] text-accent-dark">
                {generatedCode}
              </span>
              <button
                type="button"
                onClick={() => copy(generatedCode, "code")}
                className="rounded-full bg-glyph-gold/20 px-3 py-1.5 font-display uppercase label-xs text-accent-dark transition-colors hover:bg-glyph-gold/30"
              >
                {copied === "code" ? t.copied : t.copy}
              </button>
            </div>

            {joinUrl ? (
              <div className="mt-4">
                <p className="mb-1 font-display uppercase label-xs text-warm-shadow">
                  {t.shareLink}
                </p>
                <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                  <span className="flex-1 truncate font-sans text-body-s text-accent-dark/80">
                    {joinUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(joinUrl, "link")}
                    className="rounded-full bg-glyph-gold/20 px-3 py-1.5 font-display uppercase label-xs text-accent-dark transition-colors hover:bg-glyph-gold/30"
                  >
                    {copied === "link" ? t.copied : t.copy}
                  </button>
                </div>
              </div>
            ) : null}

            <p className="mt-4 font-sans text-body-xs text-warm-shadow">
              {t.expiresIn30Days}
            </p>
            <button
              type="button"
              onClick={() => {
                setGeneratedCode(null);
                setCopied(null);
              }}
              className="mt-3 font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
            >
              {t.generateAnother}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function InvitationsListTab({
  t,
  commonError,
  invitations,
  loading,
  onRevoke,
  lang,
}: {
  t: T;
  commonError: string;
  invitations: Invitation[];
  loading: boolean;
  onRevoke: (id: string) => Promise<void>;
  lang: Locale;
}) {
  const [revoking, setRevoking] = useState<string | null>(null);
  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      await onRevoke(id);
    } catch (err) {
      toast.error((err as Error).message || commonError);
    } finally {
      setRevoking(null);
    }
  };

  if (loading && invitations.length === 0) {
    return (
      <Card>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </Card>
    );
  }
  if (invitations.length === 0) {
    return (
      <Card>
        <p className="py-6 text-center font-sans text-body-m text-accent-dark/70">
          {t.noInvitationsYet}
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="font-display uppercase label-md font-bold text-accent-dark">
        {t.allInvitationsTitle}
      </h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-body-s">
          <thead>
            <tr className="text-start">
              <Th>{t.columnRecipient}</Th>
              <Th>{t.columnRole}</Th>
              <Th>{t.columnStatus}</Th>
              <Th>{t.columnCreated}</Th>
              <Th>{t.columnAction}</Th>
            </tr>
          </thead>
          <tbody>
            {invitations.map((inv) => (
              <tr
                key={inv.id}
                className="border-t border-accent-dark/5 align-middle"
              >
                <Td>
                  {inv.email ?? (
                    <span className="font-mono text-body-s">
                      {fmt(t.codePrefix, { code: inv.invite_code ?? "" })}
                    </span>
                  )}
                </Td>
                <Td>
                  <RoleBadge role={inv.role} t={t} />
                </Td>
                <Td>
                  <StatusBadge status={inv.status} t={t} />
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-accent-dark/70">
                    {new Date(inv.created_at).toLocaleDateString(lang)}
                  </span>
                </Td>
                <Td>
                  {inv.status === "pending" ? (
                    <button
                      type="button"
                      onClick={() => handleRevoke(inv.id)}
                      disabled={revoking === inv.id}
                      className="rounded-full border border-error/30 bg-error/10 px-3 py-1 font-display uppercase label-xs text-error transition-colors hover:bg-error/15 disabled:opacity-50"
                    >
                      {revoking === inv.id ? t.revoking : t.revoke}
                    </button>
                  ) : null}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-3 py-2 text-start font-display uppercase label-xs text-warm-shadow">
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-3 py-3">{children}</td>;
}

function RoleBadge({ role, t }: { role: string; t: T }) {
  const label =
    role === "coach"
      ? t.roleCoach
      : role === "parent"
        ? t.roleParent
        : role === "player"
          ? t.rolePlayer
          : role;
  const tone =
    role === "coach"
      ? "bg-shadow-plumage/15 text-shadow-plumage"
      : role === "parent"
        ? "bg-glyph-gold/20 text-accent-dark"
        : "bg-deep-teal/15 text-deep-teal";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display uppercase label-xs ${tone}`}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status, t }: { status: string; t: T }) {
  const label =
    status === "pending"
      ? t.status.pending
      : status === "accepted"
        ? t.status.accepted
        : status === "revoked"
          ? t.status.revoked
          : status === "expired"
            ? t.status.expired
            : status;
  const tone =
    status === "pending"
      ? "bg-glyph-gold/20 text-accent-dark"
      : status === "accepted"
        ? "bg-success/15 text-success"
        : status === "revoked"
          ? "bg-error/15 text-error"
          : "bg-warm-shadow/15 text-warm-shadow";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-display uppercase label-xs ${tone}`}
    >
      {label}
    </span>
  );
}
