import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const ORG_TYPES = ['academy', 'school', 'club', 'federation', 'ministry'];

export default function CreateOrganization() {
  const { t } = useTranslation();
  const { user, refreshOrganizations } = useAuth();
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [type, setType] = useState('academy');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
      const { data: org, error: orgError } = await supabase.rpc('create_organization', {
        p_name: name.trim(),
        p_type: type,
        p_region: region.trim() || null,
        p_city: city.trim() || null,
      });

      if (orgError) throw orgError;

      // Refresh org list in context and navigate to dashboard
      await refreshOrganizations();
      navigate('/academy');
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>{t('academy.createOrg.title')}</h1>
        <p style={subtitleStyle}>
          {t('academy.createOrg.subtitle')}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>{t('academy.createOrg.nameLabel')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('academy.createOrg.namePlaceholder')}
              style={inputStyle}
              required
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('academy.createOrg.typeLabel')}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
              {ORG_TYPES.map((orgType) => (
                <option key={orgType} value={orgType}>
                  {ORG_TYPE_LABELS[orgType]}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('academy.createOrg.regionLabel')}</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder={t('academy.createOrg.regionPlaceholder')}
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>{t('academy.createOrg.cityLabel')}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('academy.createOrg.cityPlaceholder')}
              style={inputStyle}
            />
          </div>

          {error && <p style={errorStyle}>{error}</p>}

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
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e4e4e7',
  padding: 32,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.6)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
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
  color: '#9ca3af',
  margin: '0 0 24px',
};

const fieldStyle = {
  marginBottom: 16,
};

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#9ca3af',
  marginBottom: 6,
};

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

const errorStyle = {
  color: '#ef4444',
  fontSize: 13,
  marginBottom: 12,
};

const buttonStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 600,
  fontSize: 14,
  border: 'none',
  borderRadius: 10,
  cursor: 'pointer',
  marginTop: 8,
};
