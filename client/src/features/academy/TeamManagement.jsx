import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useConfirm } from '../../components/ConfirmProvider';
import { AGE_GROUPS } from '../../constants';
import useTeams from './hooks/useTeams';
import usePlayerRoster from './hooks/usePlayerRoster';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

export default function TeamManagement() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { activeOrg } = useAuth();
  const { teams, loading, createTeam, deleteTeam, getTeamMembers, addPlayer, removePlayer } =
    useTeams(activeOrg?.id);
  const { players: allPlayers } = usePlayerRoster(activeOrg?.id);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addPlayerId, setAddPlayerId] = useState('');

  const selectedTeam = teams.find((tm) => tm.id === selectedTeamId);

  useEffect(() => {
    if (!selectedTeamId) return;
    setMembersLoading(true);
    getTeamMembers(selectedTeamId).then((members) => {
      setTeamMembers(members);
      setMembersLoading(false);
    });
  }, [selectedTeamId, teams]);

  const memberIds = new Set(teamMembers.map((m) => m.id));
  const availablePlayers = allPlayers.filter((p) => !memberIds.has(p.player_id));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createTeam({ name: newName.trim(), age_group: newAgeGroup || null });
      setNewName('');
      setNewAgeGroup('');
      setShowCreate(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (teamId) => {
    const ok = await confirm({
      title: t('academy.teams.deleteTitle'),
      message: t('academy.teams.deleteConfirm'),
      confirmLabel: t('academy.teams.deleteAction'),
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteTeam(teamId);
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
        setTeamMembers([]);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAddPlayer = async () => {
    if (!addPlayerId || !selectedTeamId) return;
    try {
      await addPlayer(selectedTeamId, addPlayerId);
      setAddPlayerId('');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      await removePlayer(selectedTeamId, playerId);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getPlayerCountText = (count) => count !== 1
    ? t('academy.teams.playerCountPlural', { count })
    : t('academy.teams.playerCount', { count });

  return (
    <PageContainer width="default">
      <PageHeader
        backLink={<BackLink href="/academy">{t('nav.dashboard')}</BackLink>}
        title={t('academy.teams.title')}
        subtitle={t('academy.teams.subtitle', { orgName: activeOrg?.name })}
        actions={!showCreate && (
          <button type="button" className="action-chip" onClick={() => setShowCreate(true)}>
            <Plus size={14} aria-hidden="true" />
            {t('academy.teams.createNewTeam')}
          </button>
        )}
      />

      {/* Inline create form */}
      {showCreate && (
        <section className="card" style={{ marginBottom: 20 }}>
          <h3 className="section__title" style={{ marginBottom: 12 }}>
            {t('academy.teams.newTeam')}
          </h3>
          <form onSubmit={handleCreate} className="toolbar" style={{ marginBottom: 0 }}>
            <input
              type="text"
              className="input toolbar__search"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('academy.teams.teamNamePlaceholder')}
              aria-label={t('academy.teams.teamNamePlaceholder')}
              autoFocus
            />
            <select
              className="select toolbar__select"
              value={newAgeGroup}
              onChange={(e) => setNewAgeGroup(e.target.value)}
              aria-label={t('academy.teams.ageGroupLabel')}
            >
              <option value="">{t('academy.teams.ageGroupLabel')}</option>
              {AGE_GROUPS.map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary" disabled={creating || !newName.trim()}>
              {creating ? t('academy.teams.creating') : t('academy.teams.createButton')}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>
              {t('academy.teams.cancelButton')}
            </button>
          </form>
          {error && <div role="alert" className="alert alert--danger" style={{ marginTop: 12, marginBottom: 0 }}>{error}</div>}
        </section>
      )}

      {/* Team grid + detail */}
      <div className="teams-grid">
        {/* Team list */}
        <div className="card teams-grid__list">
          {loading ? (
            <div className="empty-compact">
              <span className="spinner spinner--lg" aria-hidden="true" />
              <p className="empty-compact__msg" style={{ marginTop: 12 }}>
                {t('academy.teams.loadingTeams')}
              </p>
            </div>
          ) : teams.length === 0 ? (
            <div className="empty-compact">
              <p className="empty-compact__msg">{t('academy.teams.noTeamsYet')}</p>
            </div>
          ) : (
            <div className="list-rows">
              {teams.map((team) => {
                const isActive = selectedTeamId === team.id;
                return (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => setSelectedTeamId(team.id)}
                    className={`team-card${isActive ? ' team-card--active' : ''}`}
                  >
                    <div className="list-row__main">
                      <p className="list-row__name">{team.name}</p>
                      <p className="list-row__sub">
                        {team.age_group || t('academy.teams.allAges')} &middot; {getPlayerCountText(team.player_count)}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-icon btn-icon--danger"
                      onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                      title={t('academy.teams.deleteTeamTooltip')}
                      aria-label={t('academy.teams.deleteTeamTooltip')}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Team detail panel */}
        <div className="card teams-grid__detail">
          {!selectedTeam ? (
            <div className="empty-compact">
              <p className="empty-compact__msg">{t('academy.teams.selectTeamPrompt')}</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <h2 className="section__title" style={{ fontSize: 18 }}>{selectedTeam.name}</h2>
                <p className="section__desc" style={{ marginBottom: 0 }}>
                  {selectedTeam.age_group || t('academy.teams.allAges')} &middot; {getPlayerCountText(selectedTeam.player_count)}
                </p>
              </div>

              <div className="toolbar" style={{ marginBottom: 16 }}>
                <select
                  className="select toolbar__search"
                  value={addPlayerId}
                  onChange={(e) => setAddPlayerId(e.target.value)}
                  aria-label={t('academy.teams.addPlayerPlaceholder')}
                >
                  <option value="">{t('academy.teams.addPlayerPlaceholder')}</option>
                  {availablePlayers.map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.display_name} ({p.age_group || t('common.noAge')})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAddPlayer}
                  disabled={!addPlayerId}
                >
                  <Plus size={14} aria-hidden="true" />
                  {t('academy.teams.addButton')}
                </button>
              </div>

              {membersLoading ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  {t('academy.teams.loadingMembers')}
                </p>
              ) : teamMembers.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
                  {t('academy.teams.noPlayersInTeam')}
                </p>
              ) : (
                <div className="list-rows">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="member-row">
                      <span className="list-row__avatar">
                        {(m.display_name || '?')[0].toUpperCase()}
                      </span>
                      <div className="list-row__main">
                        <p className="list-row__name">{m.display_name || t('common.unknown')}</p>
                        <p className="list-row__sub">
                          {m.age_group || t('common.noAge')} &middot; {t('common.level')} {m.current_level} &middot; {m.total_xp?.toLocaleString()} {t('common.xp')}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary member-row__remove"
                        onClick={() => handleRemovePlayer(m.id)}
                      >
                        {t('academy.teams.removeButton')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
