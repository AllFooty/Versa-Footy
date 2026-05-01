import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const ORG_TYPES = ['academy', 'school', 'club', 'federation', 'ministry'];

export default function CreateOrganization() {
  const { t } = useTranslation();
  const { refreshOrganizations } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [type, setType] = useState('academy');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const ORG_TYPE_LABELS = {
    academy: t('academy.createOrg.typeAcademy'),
    school: t('academy.createOrg.typeSchool'),
    club: t('academy.createOrg.typeClub'),
    federation: t('academy.createOrg.typeFederation'),
    ministry: t('academy.createOrg.typeMinistry'),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Create organization + add owner atomically via RPC
      const { error: orgError } = await supabase.rpc('create_organization', {
        p_name: name.trim(),
        p_type: type,
        p_region: region.trim() || null,
        p_city: city.trim() || null,
      });

      if (orgError) throw orgError;

      await refreshOrganizations();
      setSuccess(true);
      // Brief acknowledgement before handoff to the dashboard
      setTimeout(() => navigate('/academy'), 800);
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle} role="status" aria-live="polite">
          <div style={successIconWrapStyle} aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ ...titleStyle, textAlign: 'center' }}>
            {t('academy.createOrg.successTitle')}
          </h1>
          <p style={{ ...subtitleStyle, textAlign: 'center', margin: 0 }}>
            {t('academy.createOrg.successBody', { name: name.trim() })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>{t('academy.createOrg.title')}</h1>
        <p style={subtitleStyle}>
          {t('academy.createOrg.subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="org-name">{t('academy.createOrg.nameLabel')}</label>
            <input
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('academy.createOrg.namePlaceholder')}
              style={inputStyle}
              required
              autoFocus
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="org-type">{t('academy.createOrg.typeLabel')}</label>
            <select id="org-type" value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              {ORG_TYPES.map((orgType) => (
                <option key={orgType} value={orgType}>
                  {ORG_TYPE_LABELS[orgType]}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="org-region">{t('academy.createOrg.regionLabel')}</label>
            <input
              id="org-region"
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder={t('academy.createOrg.regionPlaceholder')}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle} htmlFor="org-city">{t('academy.createOrg.cityLabel')}</label>
            <input
              id="org-city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('academy.createOrg.cityPlaceholder')}
              style={inputStyle}
            />
          </div>

          {error && <p role="alert" style={errorStyle}>{error}</p>}

          <button type="submit" disabled={submitting || !name.trim()} style={buttonStyle}>
            {submitting ? t('academy.createOrg.creating') : t('academy.createOrg.createButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg-app-gradient)',
  color: 'var(--text-primary)',
  padding: 32,
  fontFamily: 'var(--font-sans)',
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 'var(--radius-2xl)',
  padding: 32,
  maxWidth: 480,
  width: '100%',
  boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(12px)',
};

const titleStyle = {
  fontSize: 24,
  fontWeight: 700,
  margin: '0 0 8px',
};

const subtitleStyle = {
  fontSize: 14,
  color: 'var(--text-muted)',
  margin: '0 0 24px',
};

const fieldStyle = {
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--text-muted)',
  marginBottom: 6,
};

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

const errorStyle = {
  color: '#ef4444',
  fontSize: 13,
  marginBottom: 12,
};

const buttonStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--gradient-brand)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  borderRadius: 'var(--radius-lg)',
  cursor: 'pointer',
  marginTop: 8,
};

const successIconWrapStyle = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'rgba(34, 197, 94, 0.15)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px',
};
