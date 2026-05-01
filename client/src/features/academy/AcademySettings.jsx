import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import ConfirmModal from '../../components/modals/ConfirmModal';

const ROLE_OPTIONS = ['owner', 'admin', 'coach', 'player', 'parent'];

export default function AcademySettings() {
  const { t } = useTranslation();
  const { activeOrg, refreshOrganizations } = useAuth();

  const ROLE_LABELS = {
    owner: t('academy.settings.roleOwner'),
    admin: t('academy.settings.roleAdmin'),
    coach: t('academy.settings.roleCoach'),
    player: t('academy.settings.rolePlayer'),
    parent: t('academy.settings.roleParent'),
  };

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
  const [memberError, setMemberError] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);

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
      setSaveMsg({ type: 'success', text: t('academy.settings.orgUpdated') });
      refreshOrganizations();
    }
    setSaving(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    setMemberError(null);
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      setMemberError(error.message);
    } else {
      fetchMembers();
    }
  };

  const requestRemoveMember = (memberId, memberName) => {
    setMemberError(null);
    setPendingRemoval({ memberId, memberName });
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemoval) return;
    const { memberId } = pendingRemoval;
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      setMemberError(error.message);
    } else {
      fetchMembers();
    }
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t('academy.settings.title')}</h1>
        <p style={subtitleStyle}>{t('academy.settings.subtitle')}</p>
      </div>

      {/* Organization Info */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>{t('academy.settings.orgDetailsTitle')}</h2>
          <form onSubmit={handleSaveOrg}>
            <div style={fieldStyle}>
              <label style={labelStyle}>{t('academy.settings.nameLabel')}</label>
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
                <label style={labelStyle}>{t('academy.settings.typeLabel')}</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                  <option value="academy">{t('academy.createOrg.typeAcademy')}</option>
                  <option value="school">{t('academy.createOrg.typeSchool')}</option>
                  <option value="club">{t('academy.createOrg.typeClub')}</option>
                  <option value="federation">{t('academy.createOrg.typeFederation')}</option>
                  <option value="ministry">{t('academy.createOrg.typeMinistry')}</option>
                </select>
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>{t('academy.settings.regionLabel')}</label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder={t('academy.settings.regionPlaceholder')}
                  style={inputStyle}
                />
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>{t('academy.settings.cityLabel')}</label>
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
              {saving ? t('academy.settings.saving') : t('academy.settings.saveChanges')}
            </button>
          </form>
        </div>
      </div>

      {/* Members */}
      <div style={sectionStyle}>
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>{t('academy.settings.membersTitle')}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: '0 0 16px' }}>
            {t('academy.settings.memberCount', { count: members.length })}
          </p>

          {membersLoading ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 13 }}>{t('academy.settings.loadingMembers')}</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {members.map((m) => (
                <div key={m.id} style={memberRowStyle}>
                  <div style={avatarStyle}>
                    {(m.full_name || m.email || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>
                      {m.full_name || t('common.unknown')}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
                      {m.email || m.user_id.slice(0, 8)}
                    </p>
                  </div>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    style={roleSelectStyle}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => requestRemoveMember(m.id, m.full_name)}
                      style={removeBtnStyle}
                    >
                      {t('common.remove')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {memberError && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            insetInlineEnd: 16,
            bottom: 16,
            maxWidth: 360,
            background: 'var(--color-red-soft)',
            border: '1px solid var(--color-red-soft-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
            color: '#fca5a5',
            fontSize: 13,
            zIndex: 100,
          }}
        >
          <button
            type="button"
            onClick={() => setMemberError(null)}
            aria-label={t('common.close', { defaultValue: 'Close' })}
            style={{
              float: 'inline-end',
              background: 'transparent',
              border: 'none',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 0 0 8px',
            }}
          >×</button>
          {memberError}
        </div>
      )}

      <ConfirmModal
        isOpen={pendingRemoval != null}
        title={t('academy.settings.removeConfirmTitle', { defaultValue: 'Remove member?' })}
        message={t('academy.settings.removeConfirm', {
          name: pendingRemoval?.memberName || t('common.unknown'),
        })}
        confirmLabel={t('common.remove')}
        confirmDanger
        onConfirm={handleConfirmRemove}
        onClose={() => setPendingRemoval(null)}
      />
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const containerStyle = {
  minHeight: '100vh',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  padding: '32px',
};

const headerStyle = { maxWidth: 900, margin: '0 auto 24px' };
const titleStyle = { fontSize: 28, fontWeight: 700, margin: '0 0 4px' };
const subtitleStyle = { fontSize: 14, color: 'var(--text-muted)', margin: 0 };

const sectionStyle = { maxWidth: 900, margin: '0 auto 20px' };

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'var(--radius-2xl)',
  padding: 24,
};

const cardTitleStyle = { fontSize: 18, fontWeight: 600, margin: '0 0 16px' };

const fieldStyle = { marginBottom: 16 };
const rowStyle = { display: 'flex', gap: 12, flexWrap: 'wrap' };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 };
const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

const primaryBtnStyle = {
  padding: '12px 24px',
  background: 'var(--gradient-brand)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
};

const memberRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.03)',
  borderRadius: 'var(--radius-md)',
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
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-primary)',
  fontSize: 12,
};

const removeBtnStyle = {
  padding: '5px 10px',
  background: 'rgba(239, 68, 68, 0.12)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  borderRadius: 'var(--radius-sm)',
  color: '#ef4444',
  fontSize: 11,
  fontWeight: 500,
  cursor: 'pointer',
};
