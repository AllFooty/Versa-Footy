import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Settings, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useConfirm } from '../../components/ConfirmProvider';
import { supabase } from '../../lib/supabase';
import { PageContainer, PageHeader, BackLink } from '../../components/Page';

const ROLE_OPTIONS = ['owner', 'admin', 'coach', 'player', 'parent'];

export default function AcademySettings() {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { activeOrg, refreshOrganizations } = useAuth();

  const ROLE_LABELS = {
    owner: t('academy.settings.roleOwner'),
    admin: t('academy.settings.roleAdmin'),
    coach: t('academy.settings.roleCoach'),
    player: t('academy.settings.rolePlayer'),
    parent: t('academy.settings.roleParent'),
  };

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

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
    const { error } = await supabase
      .from('organization_members')
      .update({ role: newRole })
      .eq('id', memberId);

    if (error) {
      toast.error(error.message);
    } else {
      fetchMembers();
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    const ok = await confirm({
      title: t('academy.settings.removeTitle'),
      message: t('academy.settings.removeConfirm', { name: memberName || t('common.unknown') }),
      confirmLabel: t('academy.settings.removeAction'),
      danger: true,
    });
    if (!ok) return;
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error(error.message);
    } else {
      fetchMembers();
    }
  };

  return (
    <PageContainer width="narrow">
      <PageHeader
        backLink={<BackLink href="/academy">{t('nav.dashboard')}</BackLink>}
        title={t('academy.settings.title')}
        subtitle={t('academy.settings.subtitle')}
      />

      {/* Organization details */}
      <section className="card card--lg">
        <div className="card-heading">
          <Settings size={20} aria-hidden="true" />
          <h2>{t('academy.settings.orgDetailsTitle')}</h2>
        </div>

        <form onSubmit={handleSaveOrg}>
          <div className="field">
            <label className="field-label" htmlFor="org-name">
              {t('academy.settings.nameLabel')}
            </label>
            <input
              id="org-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="org-type">
                {t('academy.settings.typeLabel')}
              </label>
              <select
                id="org-type"
                className="select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="academy">{t('academy.createOrg.typeAcademy')}</option>
                <option value="school">{t('academy.createOrg.typeSchool')}</option>
                <option value="club">{t('academy.createOrg.typeClub')}</option>
                <option value="federation">{t('academy.createOrg.typeFederation')}</option>
                <option value="ministry">{t('academy.createOrg.typeMinistry')}</option>
              </select>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="org-region">
                {t('academy.settings.regionLabel')}
              </label>
              <input
                id="org-region"
                className="input"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t('academy.settings.regionPlaceholder')}
              />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="org-city">
              {t('academy.settings.cityLabel')}
            </label>
            <input
              id="org-city"
              className="input"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {saveMsg && (
            <div
              role={saveMsg.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`alert alert--${saveMsg.type === 'error' ? 'danger' : 'success'}`}
            >
              {saveMsg.text}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
            {saving ? (
              <>
                <span className="spinner" aria-hidden="true" />
                {t('academy.settings.saving')}
              </>
            ) : (
              t('academy.settings.saveChanges')
            )}
          </button>
        </form>
      </section>

      {/* Members */}
      <section className="card card--lg" style={{ marginTop: 24 }}>
        <div className="card-heading">
          <Users size={20} aria-hidden="true" />
          <h2>{t('academy.settings.membersTitle')}</h2>
        </div>
        <p className="section__desc" style={{ marginBottom: 16 }}>
          {t('academy.settings.memberCount', { count: members.length })}
        </p>

        {membersLoading ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            {t('academy.settings.loadingMembers')}
          </p>
        ) : (
          <div className="list-rows">
            {members.map((m) => (
              <div key={m.id} className="member-row">
                <span className="list-row__avatar">
                  {(m.full_name || m.email || '?')[0].toUpperCase()}
                </span>
                <div className="list-row__main">
                  <p className="list-row__name">{m.full_name || t('common.unknown')}</p>
                  <p className="list-row__sub">{m.email || m.user_id.slice(0, 8)}</p>
                </div>
                <select
                  className="select member-row__role"
                  aria-label={t('academy.settings.changeRoleAria', { name: m.full_name || t('common.unknown') })}
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
                {m.role !== 'owner' && (
                  <button
                    type="button"
                    className="btn-secondary member-row__remove"
                    onClick={() => handleRemoveMember(m.id, m.full_name)}
                  >
                    {t('common.remove')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
