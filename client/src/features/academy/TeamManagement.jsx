import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { AGE_GROUPS } from '../../constants';
import useTeams from './hooks/useTeams';
import usePlayerRoster from './hooks/usePlayerRoster';

export default function TeamManagement() {
  const { activeOrg } = useAuth();
  const { teams, loading, createTeam, deleteTeam, getTeamMembers, addPlayer, removePlayer } =
    useTeams(activeOrg?.id);
  const { players: allPlayers } = usePlayerRoster(activeOrg?.id);

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAgeGroup, setNewAgeGroup] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);

  // Selected team detail
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addPlayerId, setAddPlayerId] = useState('');

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  useEffect(() => {
    if (!selectedTeamId) return;
    setMembersLoading(true);
    getTeamMembers(selectedTeamId).then((members) => {
      setTeamMembers(members);
      setMembersLoading(false);
    });
  }, [selectedTeamId, teams]);

  // Players not yet in the selected team
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
    if (!confirm('Delete this team? Players will not be removed from the organization.')) return;
    try {
      await deleteTeam(teamId);
      if (selectedTeamId === teamId) {
        setSelectedTeamId(null);
        setTeamMembers([]);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddPlayer = async () => {
    if (!addPlayerId || !selectedTeamId) return;
    try {
      await addPlayer(selectedTeamId, addPlayerId);
      setAddPlayerId('');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      await removePlayer(selectedTeamId, playerId);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Teams</h1>
        <p style={subtitleStyle}>
          Organize players into teams for {activeOrg?.name}
        </p>
      </div>

      {/* Create Team */}
      <div style={sectionStyle}>
        {!showCreate ? (
          <button onClick={() => setShowCreate(true)} style={createBtnStyle}>
            + Create New Team
          </button>
        ) : (
          <div style={createCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>New Team</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Team name"
                style={{ ...inputStyle, flex: '1 1 200px' }}
                autoFocus
              />
              <select
                value={newAgeGroup}
                onChange={(e) => setNewAgeGroup(e.target.value)}
                style={{ ...inputStyle, flex: '0 0 120px' }}
              >
                <option value="">Age Group</option>
                {AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
              <button type="submit" disabled={creating || !newName.trim()} style={primaryBtnStyle}>
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} style={cancelBtnStyle}>
                Cancel
              </button>
            </form>
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
          </div>
        )}
      </div>

      {/* Team grid + detail */}
      <div style={mainGridStyle}>
        {/* Team list */}
        <div style={teamListStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={spinnerStyle} />
              <p style={{ marginTop: 16, color: '#71717a' }}>Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ color: '#71717a', fontSize: 14 }}>
                No teams yet. Create one to organize your players.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeamId(team.id)}
                  style={{
                    ...teamCardStyle,
                    ...(selectedTeamId === team.id ? teamCardActiveStyle : {}),
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={teamNameStyle}>{team.name}</p>
                    <p style={teamMetaStyle}>
                      {team.age_group || 'All ages'} &middot; {team.player_count} player{team.player_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(team.id); }}
                    style={deleteIconStyle}
                    title="Delete team"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team detail panel */}
        <div style={detailPanelStyle}>
          {!selectedTeam ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#71717a' }}>
              <p style={{ fontSize: 14 }}>Select a team to manage its players</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>{selectedTeam.name}</h2>
                <p style={{ fontSize: 13, color: '#71717a', margin: 0 }}>
                  {selectedTeam.age_group || 'All ages'} &middot; {selectedTeam.player_count} player{selectedTeam.player_count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Add player */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <select
                  value={addPlayerId}
                  onChange={(e) => setAddPlayerId(e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                >
                  <option value="">Add a player...</option>
                  {availablePlayers.map((p) => (
                    <option key={p.player_id} value={p.player_id}>
                      {p.display_name} ({p.age_group || 'no age'})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddPlayer}
                  disabled={!addPlayerId}
                  style={primaryBtnStyle}
                >
                  Add
                </button>
              </div>

              {/* Members list */}
              {membersLoading ? (
                <p style={{ color: '#71717a', fontSize: 13 }}>Loading members...</p>
              ) : teamMembers.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: 13 }}>
                  No players in this team yet. Use the dropdown above to add players.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teamMembers.map((m) => (
                    <div key={m.id} style={memberRowStyle}>
                      <div style={memberAvatarStyle}>
                        {(m.display_name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>{m.display_name || 'Unknown'}</p>
                        <p style={{ fontSize: 11, color: '#71717a', margin: 0 }}>
                          {m.age_group || 'No age'} &middot; Level {m.current_level} &middot; {m.total_xp?.toLocaleString()} XP
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(m.id)}
                        style={removeBtnStyle}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const headerStyle = { maxWidth: 1200, margin: '0 auto 20px' };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '0 0 4px' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: 0 };

const sectionStyle = { maxWidth: 1200, margin: '0 auto 20px' };

const createBtnStyle = {
  padding: '10px 20px',
  background: 'rgba(59, 130, 246, 0.12)',
  border: '1px solid rgba(59, 130, 246, 0.25)',
  borderRadius: 10,
  color: '#60a5fa',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const createCardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 12,
  padding: 16,
};

const inputStyle = {
  padding: '9px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 13,
  outline: 'none',
};

const primaryBtnStyle = {
  padding: '9px 16px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 13,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const cancelBtnStyle = {
  padding: '9px 16px',
  background: 'transparent',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#9ca3af',
  fontSize: 13,
  cursor: 'pointer',
};

const mainGridStyle = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: 16,
};

const teamListStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14,
  padding: 12,
  minHeight: 300,
};

const teamCardStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  transition: 'background 0.15s',
  background: 'transparent',
};

const teamCardActiveStyle = {
  background: 'rgba(59, 130, 246, 0.1)',
  border: '1px solid rgba(59, 130, 246, 0.2)',
};

const teamNameStyle = { fontSize: 14, fontWeight: 600, margin: 0 };
const teamMetaStyle = { fontSize: 12, color: '#71717a', margin: 0 };

const deleteIconStyle = {
  background: 'none',
  border: 'none',
  color: '#71717a',
  cursor: 'pointer',
  padding: 6,
  borderRadius: 6,
  display: 'flex',
  alignItems: 'center',
  opacity: 0.6,
};

const detailPanelStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 14,
  padding: 20,
  minHeight: 300,
};

const memberRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 8,
};

const memberAvatarStyle = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: 'rgba(59, 130, 246, 0.15)',
  color: '#60a5fa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  flexShrink: 0,
};

const removeBtnStyle = {
  padding: '4px 10px',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 6,
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
};

const spinnerStyle = {
  width: 40,
  height: 40,
  border: '3px solid #27272a',
  borderTopColor: '#E63946',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
  margin: '0 auto',
};
