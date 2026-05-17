"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../_lib/auth/AuthProvider";
import { useTeams, type TeamMember } from "../../../../_lib/academy/useTeams";
import { usePlayerRoster } from "../../../../_lib/academy/usePlayerRoster";
import { AGE_GROUPS } from "../../../../_lib/academy/constants";
import { Button } from "../../../../_components/primitives/Button";
import { Input } from "../../../../_components/primitives/Input";
import { Select } from "../../../../_components/primitives/Select";
import { Skeleton } from "../../../../_components/primitives/Skeleton";
import { ConfirmDialog } from "../../../../_components/primitives/ConfirmDialog";
import { toast } from "../../../../_components/primitives/Toast";
import type { ProductDict } from "../../../../_dictionaries/product";
import type { Locale } from "../../../../_dictionaries";

type T = ProductDict["teams"];

function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
}

function playerCountText(t: T, count: number): string {
  return count === 1
    ? t.playerCountOne
    : fmt(t.playerCountOther, { count });
}

function initial(name: string | null): string {
  if (!name) return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

export function TeamsView({
  dict,
  lang,
}: {
  dict: ProductDict;
  lang: Locale;
}) {
  const t = dict.teams;
  const { activeOrg } = useAuth();
  const {
    teams,
    loading,
    createTeam,
    deleteTeam,
    getTeamMembers,
    addPlayer,
    removePlayer,
  } = useTeams(activeOrg?.id);
  const { allPlayers } = usePlayerRoster(activeOrg?.id);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAgeGroup, setNewAgeGroup] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addPlayerId, setAddPlayerId] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const selectedTeam = teams.find((tm) => tm.id === selectedTeamId);

  useEffect(() => {
    if (!selectedTeamId) {
      setTeamMembers([]);
      return;
    }
    let cancelled = false;
    setMembersLoading(true);
    getTeamMembers(selectedTeamId).then((members) => {
      if (cancelled) return;
      setTeamMembers(members);
      setMembersLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // teams in deps so player_count refreshes after add/remove also reload members
  }, [selectedTeamId, teams, getTeamMembers]);

  const memberIds = new Set(teamMembers.map((m) => m.id));
  const availablePlayers = allPlayers.filter((p) => !memberIds.has(p.player_id));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      await createTeam({ name: trimmed, age_group: newAgeGroup || null });
      setNewName("");
      setNewAgeGroup("");
      setShowCreate(false);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    } finally {
      setCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await deleteTeam(confirmDeleteId);
      if (selectedTeamId === confirmDeleteId) {
        setSelectedTeamId(null);
      }
      setConfirmDeleteId(null);
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPlayer = async () => {
    if (!addPlayerId || !selectedTeamId) return;
    try {
      await addPlayer(selectedTeamId, addPlayerId);
      const members = await getTeamMembers(selectedTeamId);
      setTeamMembers(members);
      setAddPlayerId("");
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!selectedTeamId) return;
    setRemovingId(playerId);
    try {
      await removePlayer(selectedTeamId, playerId);
      setTeamMembers((prev) => prev.filter((m) => m.id !== playerId));
    } catch (err) {
      toast.error((err as Error).message || dict.common.genericError);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10 md:py-16">
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
          {activeOrg?.name ? fmt(t.subtitle, { orgName: activeOrg.name }) : t.subtitleFallback}
        </p>
      </header>

      <section className="mt-8">
        {!showCreate ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setShowCreate(true)}
          >
            {t.createNewTeam}
          </Button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="rounded-3xl border border-accent-dark/10 bg-white p-5 md:p-6"
          >
            <h2 className="font-display uppercase label-md font-bold text-accent-dark">
              {t.newTeam}
            </h2>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t.teamNamePlaceholder}
                  disabled={creating}
                  autoFocus
                  required
                />
              </div>
              <div className="w-[160px]">
                <Select
                  value={newAgeGroup}
                  onChange={(e) => setNewAgeGroup(e.target.value)}
                  disabled={creating}
                  aria-label={t.ageGroupLabel}
                >
                  <option value="">{t.ageGroupAny}</option>
                  {AGE_GROUPS.map((ag) => (
                    <option key={ag} value={ag}>
                      {ag}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={creating || !newName.trim()}
              >
                {creating ? t.creating : t.createButton}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                  setNewAgeGroup("");
                }}
                className="font-sans text-body-s text-warm-shadow underline-offset-4 transition-colors hover:text-accent-dark hover:underline"
              >
                {t.cancelButton}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-accent-dark/10 bg-white p-4">
          {loading && teams.length === 0 ? (
            <div className="flex flex-col gap-2 p-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : teams.length === 0 ? (
            <p className="px-3 py-10 text-center font-sans text-body-m text-accent-dark/70">
              {t.noTeamsYet}
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {teams.map((team) => {
                const active = team.id === selectedTeamId;
                return (
                  <li key={team.id}>
                    <div
                      className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 transition-colors ${
                        active
                          ? "border-glyph-gold/50 bg-glyph-gold/10"
                          : "border-transparent hover:border-accent-dark/10 hover:bg-warm-shadow/5"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTeamId(team.id)}
                        className="min-w-0 flex-1 text-start"
                      >
                        <p className="truncate font-display uppercase label-sm font-bold text-accent-dark">
                          {team.name}
                        </p>
                        <p className="mt-0.5 truncate font-sans text-body-xs text-warm-shadow">
                          {team.age_group || t.allAges} ·{" "}
                          {playerCountText(t, team.player_count)}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(team.id);
                        }}
                        aria-label={t.deleteTeamTooltip}
                        title={t.deleteTeamTooltip}
                        className="rounded-full p-2 text-warm-shadow opacity-60 transition-all hover:bg-error/10 hover:text-error hover:opacity-100"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          aria-hidden
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-accent-dark/10 bg-white p-6 md:p-8">
          {!selectedTeam ? (
            <p className="py-10 text-center font-sans text-body-m text-accent-dark/70">
              {t.selectTeamPrompt}
            </p>
          ) : (
            <>
              <div>
                <h2 className="font-display uppercase label-lg font-black text-accent-dark">
                  {selectedTeam.name}
                </h2>
                <p className="mt-1 font-sans text-body-s text-warm-shadow">
                  {selectedTeam.age_group || t.allAges} ·{" "}
                  {playerCountText(t, selectedTeam.player_count)}
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <Select
                    value={addPlayerId}
                    onChange={(e) => setAddPlayerId(e.target.value)}
                    aria-label={t.addPlayerPlaceholder}
                    disabled={availablePlayers.length === 0}
                  >
                    <option value="">
                      {availablePlayers.length === 0
                        ? t.noAvailablePlayers
                        : t.addPlayerPlaceholder}
                    </option>
                    {availablePlayers.map((p) => (
                      <option key={p.player_id} value={p.player_id}>
                        {p.display_name || dict.common.appName} (
                        {p.age_group || t.noAge})
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAddPlayer}
                  disabled={!addPlayerId}
                >
                  {t.addButton}
                </Button>
              </div>

              <div className="mt-6">
                {membersLoading ? (
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="py-6 text-center font-sans text-body-s text-accent-dark/70">
                    {t.noPlayersInTeam}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {teamMembers.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 rounded-2xl bg-warm-shadow/5 p-3"
                      >
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-glyph-gold/25 font-display label-sm font-bold text-accent-dark">
                          {initial(m.display_name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display uppercase label-sm font-bold text-accent-dark">
                            {m.display_name || dict.common.appName}
                          </p>
                          <p className="mt-0.5 truncate font-sans text-body-xs text-warm-shadow">
                            {m.age_group || t.noAge} ·{" "}
                            {fmt(t.levelAbbrev, { level: m.current_level })} ·{" "}
                            {(m.total_xp ?? 0).toLocaleString(lang)} {t.xpSuffix}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(m.id)}
                          disabled={removingId === m.id}
                          className="rounded-full border border-error/30 bg-error/10 px-3 py-1 font-display uppercase label-xs text-error transition-colors hover:bg-error/15 disabled:opacity-50"
                        >
                          {removingId === m.id ? t.removing : t.removeButton}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={confirmDeleteId != null}
        title={t.deleteConfirmTitle}
        description={t.deleteConfirmDescription}
        confirmLabel={t.deleteConfirmButton}
        cancelLabel={dict.common.cancel}
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setConfirmDeleteId(null)}
      />
    </div>
  );
}
