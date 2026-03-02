import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';

const ROLE_OPTIONS = ['owner', 'admin', 'coach', 'player', 'parent'];

export default function AcademySettings() {
  const { activeOrg, refreshOrganizations } = useAuth();

  // Org info form
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  // Members
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Fetch full org record (activeOrg from RPC only has id/name/type/role)
  useEffect(() => {
    if (!activeOrg?.id) return;
    supabase
      .from('organizations')
      .select('name, type, region, city')
      .eq('id', activeOrg.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setName(data.name || '');
          setType(data.type || 'academy');
          setRegion(data.region || '');
          setCity(data.city || '');
        }
      });
  }, [activeOrg?.id]);

  const fetchMembers = useCallback(async () => {
    if (!activeOrg?.id) return;
    setMembersLoading(true);
    const { data } = await supabase
      .from('organization_members')
      .select('id, user_id, role, joined_at')
      .eq('organization_id', activeOrg.id)
      .order('role');

    if (data?.length) {
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const profileMap = {};
      (profiles || []).forEach((p) => { profileMap[p.id] = p; });

      setMembers(
        data.map((m) => ({
          ...m,
          full_name: profileMap[m.user_id]?.full_name || null,
          email: profileMap[m.user_id]?.email || null,
        }))
      );
    } else {
      setMembers([]);
    }
    setMembersLoading(false);
  }, [activeOrg?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleSaveOrg = async (e) => {
    e.preventDefault();
    if (!activeOrg?.id || !name.trim()) return;
    setSaving(true);
    setSaveMsg(null);

    const { error } = await supabase
      .from('organizations')
      .update({
        name: name.trim(),
        type,
        region: region.trim() || null,
        city: city.trim() || null,
      })
      .eq('id', activeOrg.id);

    if (error) {
      setSaveMsg({ type: 'error', text: error.message });
    } else {
      setSaveMsg({ type: 'success', text: 'Organization updated' });
      refreshOrganizations();
    }
    setSaving(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      alert(error.message);
    } else {
      fetchMembers();
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName || 'this member'} from the organization?`)) return;
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      alert(error.message);
    } else {
      fetchMembers();
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>Settings</h1>
        <p style={subtitleStyle}>Manage your organization</p>
      </div>

      {/* Organization Info */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Organization Details</h2>
          <form onSubmit={handleSaveOrg}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div style={rowStyle}>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                  <option value="academy">Academy</option>
                  <option value="school">School</option>
                  <option value="club">Club</option>
                  <option value="federation">Federation</option>
                  <option value="ministry">Ministry</option>
                </select>
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>Region</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g. Riyadh"
                  style={inputStyle}
                />
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            {saveMsg && (
              <p style={{ color: saveMsg.type === 'success' ? '#22c55e' : '#ef4444', fontSize: 13, marginBottom: 12 }}>
                {saveMsg.text}
              </p>
            )}

            <button type="submit" disabled={saving || !name.trim()} style={primaryBtnStyle}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>

      {/* Members */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Members</h2>
          <p style={{ fontSize: 13, color: '#71717a', margin: '0 0 16px' }}>
            {members.length} member{members.length !== 1 ? 's' : ''} in this organization
          </p>

          {membersLoading ? (
            <p style={{ color: '#71717a', fontSize: 13 }}>Loading members...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m) => (
                <div key={m.id} style={memberRowStyle}>
                  <div style={avatarStyle}>
                    {(m.full_name || m.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                      {m.full_name || 'Unknown'}
                    </p>
                    <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>
                      {m.email || m.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    style={roleSelectStyle}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(m.id, m.full_name)}
                      style={removeBtnStyle}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
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

const headerStyle = { maxWidth: 900, margin: '0 auto 24px' };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '0 0 4px' };
const subtitleStyle = { fontSize: 14, color: '#9ca3af', margin: 0 };

const sectionStyle = { maxWidth: 900, margin: '0 auto 20px' };

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 24,
};

const cardTitleStyle = { fontSize: 18, fontWeight: 600, margin: '0 0 16px' };

const fieldStyle = { marginBottom: 16 };
const rowStyle = { display: 'flex', gap: 12, flexWrap: 'wrap' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#9ca3af', marginBottom: 6 };
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#e4e4e7',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle = {
  padding: '12px 24px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
};

const memberRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 8,
};

const avatarStyle = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  background: 'rgba(59, 130, 246, 0.15)',
  color: '#60a5fa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  flexShrink: 0,
};

const roleSelectStyle = {
  padding: '5px 8px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 6,
  color: '#e4e4e7',
  fontSize: 12,
};

const removeBtnStyle = {
  padding: '5px 10px',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 6,
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
};
