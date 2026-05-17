"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../../_lib/auth/AuthProvider";
import { supabase } from "../../../../_lib/supabase";
import { Button } from "../../../../_components/primitives/Button";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Field } from "../../../../_components/primitives/Field";
import { Skeleton } from "../../../../_components/primitives/Skeleton";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type T = ProductDict["academySettings"];

const ORG_TYPES = ["academy", "school", "club", "federation", "ministry"] as const;
type OrgType = (typeof ORG_TYPES)[number];

const ROLES = ["owner", "admin", "coach", "player", "parent"] as const;
type Role = (typeof ROLES)[number];

type Member = {
  id: string;
  user_id: string;
  role: Role | string;
  joined_at: string;
  full_name: string | null;
  email: string | null;
};

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function initial(name: string | null, email: string | null): string {
  const src = name?.trim() || email?.trim() || "?";
  return src.charAt(0).toUpperCase() || "?";
}

export function AcademySettingsView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.academySettings;
  const orgCreateT = dict.orgCreate;
  const { activeOrg, refreshOrganizations } = useAuth();

  const [name, setName] = useState("");
  const [type, setType] = useState<OrgType>("academy");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [removing, setRemoving] = useState(false);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrg?.id) return;
    let cancelled = false;
    supabase
      .from("organizations")
      .select("name, type, region, city")
      .eq("id", activeOrg.id)
      .single()
      .then(({ data }) => {
        if (cancelled || !data) return;
        setName((data.name as string) || "");
        setType(((data.type as OrgType) || "academy") as OrgType);
        setRegion((data.region as string) || "");
        setCity((data.city as string) || "");
      });
    return () => {
      cancelled = true;
    };
  }, [activeOrg?.id]);

  const fetchMembers = useCallback(async () => {
    if (!activeOrg?.id) return;
    setMembersLoading(true);
    const { data } = await supabase
      .from("organization_members")
      .select("id, user_id, role, joined_at")
      .eq("organization_id", activeOrg.id)
      .order("role");
    if (!data?.length) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }
    const userIds = (data as { user_id: string }[]).map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    const profileMap: Record<
      string,
      { full_name: string | null; email: string | null }
    > = {};
    (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });
    setMembers(
      (data as Omit<Member, "full_name" | "email">[]).map((m) => ({
        ...m,
        full_name: profileMap[m.user_id]?.full_name ?? null,
        email: profileMap[m.user_id]?.email ?? null,
      })),
    );
    setMembersLoading(false);
  }, [activeOrg?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg?.id || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        type,
        region: region.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", activeOrg.id);
    if (error) {
      toast.error(error.message || dict.common.genericError);
    } else {
      toast.success(t.orgUpdated);
      await refreshOrganizations();
    }
    setSaving(false);
  };

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    setUpdatingRoleId(memberId);
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("id", memberId);
    if (error) {
      toast.error(error.message || dict.common.genericError);
    } else {
      await fetchMembers();
    }
    setUpdatingRoleId(null);
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemoval) return;
    setRemoving(true);
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("id", pendingRemoval.id);
    if (error) {
      toast.error(error.message || dict.common.genericError);
    } else {
      await fetchMembers();
    }
    setRemoving(false);
    setPendingRemoval(null);
  };

  const roleLabels: Record<Role, string> = {
    owner: t.roleOwner,
    admin: t.roleAdmin,
    coach: t.roleCoach,
    player: t.rolePlayer,
    parent: t.roleParent,
  };

  const orgTypeLabels: Record<OrgType, string> = {
    academy: orgCreateT.typeAcademy,
    school: orgCreateT.typeSchool,
    club: orgCreateT.typeClub,
    federation: orgCreateT.typeFederation,
    ministry: orgCreateT.typeMinistry,
  };

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
          {t.title}
        </h1>
        <p className="mt-3 max-w-2xl font-sans text-body-m text-accent-dark/70">
          {t.subtitle}
        </p>
      </header>

      <section className="mt-10 rounded-3xl border border-accent-dark/10 bg-white p-7 md:p-9">
        <h2 className="font-display uppercase label-md font-bold text-accent-dark">
          {t.orgDetailsTitle}
        </h2>
        <form onSubmit={handleSaveOrg} className="mt-6 flex flex-col gap-5">
          <Field label={t.nameLabel} htmlFor="org-name">
            <Input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={saving}
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Field label={t.typeLabel} htmlFor="org-type">
              <Select
                id="org-type"
                value={type}
                onChange={(e) => setType(e.target.value as OrgType)}
                disabled={saving}
              >
                {ORG_TYPES.map((ot) => (
                  <option key={ot} value={ot}>
                    {orgTypeLabels[ot]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.regionLabel} htmlFor="org-region">
              <Input
                id="org-region"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t.regionPlaceholder}
                disabled={saving}
              />
            </Field>
            <Field label={t.cityLabel} htmlFor="org-city">
              <Input
                id="org-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={saving}
              />
            </Field>
          </div>
          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={saving || !name.trim()}
            >
              {saving ? t.saving : t.saveChanges}
            </Button>
          </div>
        </form>
      </section>

      <section className="mt-8 rounded-3xl border border-accent-dark/10 bg-white p-7 md:p-9">
        <h2 className="font-display uppercase label-md font-bold text-accent-dark">
          {t.membersTitle}
        </h2>
        <p className="mt-1 font-sans text-body-s text-warm-shadow">
          {members.length === 1
            ? t.memberCountOne
            : fmt(t.memberCountOther, { count: members.length })}
        </p>

        <div className="mt-6">
          {membersLoading && members.length === 0 ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : members.length === 0 ? (
            <p className="py-6 text-center font-sans text-body-s text-accent-dark/70">
              {t.noMembers}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl bg-warm-shadow/5 p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-glyph-gold/25 font-display label-sm font-bold text-accent-dark">
                    {initial(m.full_name, m.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display uppercase label-sm font-bold text-accent-dark">
                      {m.full_name || t.unknownMember}
                    </p>
                    <p className="mt-0.5 truncate font-sans text-body-xs text-warm-shadow">
                      {m.email || m.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="w-[140px]">
                    <Select
                      value={m.role}
                      onChange={(e) =>
                        handleRoleChange(m.id, e.target.value as Role)
                      }
                      disabled={updatingRoleId === m.id}
                      aria-label={t.membersTitle}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {roleLabels[r]}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {m.role !== "owner" ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPendingRemoval({
                          id: m.id,
                          name: m.full_name || t.removeConfirmNameFallback,
                        })
                      }
                      className="rounded-full border border-error/30 bg-error/10 px-3 py-1 font-display uppercase label-xs text-error transition-colors hover:bg-error/15"
                    >
                      {t.removeMember}
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={pendingRemoval != null}
        title={t.removeConfirmTitle}
        description={fmt(t.removeConfirmDescription, {
          name: pendingRemoval?.name ?? t.removeConfirmNameFallback,
        })}
        confirmLabel={removing ? t.removingMember : t.removeConfirmButton}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={handleConfirmRemove}
        onCancel={() => !removing && setPendingRemoval(null)}
      />
    </div>
  );
}
