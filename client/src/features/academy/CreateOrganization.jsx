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
      const { error: orgError } = await supabase.rpc('create_organization', {
        p_name: name.trim(),
        p_type: type,
        p_region: region.trim() || null,
        p_city: city.trim() || null,
      });

      if (orgError) throw orgError;

      await refreshOrganizations();
      navigate('/academy');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-shell__card">
        <h1 className="auth-shell__title">{t('academy.createOrg.title')}</h1>
        <p className="auth-shell__desc">{t('academy.createOrg.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="org-name">
              {t('academy.createOrg.nameLabel')}
            </label>
            <input
              id="org-name"
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('academy.createOrg.namePlaceholder')}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label className="field-label" htmlFor="org-type">
              {t('academy.createOrg.typeLabel')}
            </label>
            <select
              id="org-type"
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {ORG_TYPES.map((orgType) => (
                <option key={orgType} value={orgType}>
                  {ORG_TYPE_LABELS[orgType]}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label className="field-label" htmlFor="org-region">
                {t('academy.createOrg.regionLabel')}
              </label>
              <input
                id="org-region"
                className="input"
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder={t('academy.createOrg.regionPlaceholder')}
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="org-city">
                {t('academy.createOrg.cityLabel')}
              </label>
              <input
                id="org-city"
                className="input"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('academy.createOrg.cityPlaceholder')}
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="alert alert--danger">{error}</div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !name.trim()}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                {t('academy.createOrg.creating')}
              </>
            ) : (
              t('academy.createOrg.createButton')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
