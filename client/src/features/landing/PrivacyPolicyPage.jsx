import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const PrivacyPolicyPage = () => {
  const { t } = useTranslation();

  const containerStyle = {
    maxWidth: '880px',
    margin: '0 auto',
    padding: '0 24px',
  };

  const sectionStyle = {
    marginBottom: '40px',
  };

  const headingStyle = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary, #e5e7eb)',
    marginBottom: '16px',
  };

  const subHeadingStyle = {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary, #e5e7eb)',
    marginBottom: '12px',
    marginTop: '24px',
  };

  const paragraphStyle = {
    fontSize: '1rem',
    lineHeight: 1.75,
    color: 'var(--text-secondary, #9ca3af)',
    marginBottom: '16px',
  };

  const listStyle = {
    fontSize: '1rem',
    lineHeight: 1.75,
    color: 'var(--text-secondary, #9ca3af)',
    marginBottom: '16px',
    paddingLeft: '24px',
    listStyleType: 'disc',
  };

  const listItemStyle = {
    marginBottom: '8px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
    fontSize: '0.95rem',
  };

  const thStyle = {
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    color: 'var(--text-primary, #e5e7eb)',
    fontWeight: 600,
  };

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    color: 'var(--text-secondary, #9ca3af)',
    verticalAlign: 'top',
  };

  const tableHeaders = t('privacyPolicy.section2TableHeaders', { returnObjects: true }) || [];
  const tableRows = t('privacyPolicy.section2TableRows', { returnObjects: true }) || [];

  return (
    <>
      <All4FootyFamilyBar />
      <div className={styles.landingPage}>
        <HeaderLanding />

        <main>
          <section className={styles.heroSection} style={{ padding: '60px 0 40px' }}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className={styles.heroTitle} style={{ marginBottom: '16px' }}>
                  {t('privacyPolicy.pageTitle')}
                </h1>
                <p className={styles.heroSubtitle} style={{ margin: '0 auto', textAlign: 'center' }}>
                  {t('privacyPolicy.lastUpdated')}
                </p>
              </motion.div>
            </div>
          </section>

          <section style={{ padding: '40px 0 80px' }}>
            <div style={containerStyle}>

              <div style={sectionStyle}>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.introParagraph1')}
                </p>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.introParagraph2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section1Title')}</h2>

                <h3 style={subHeadingStyle}>{t('privacyPolicy.section1Sub1Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section1Sub1Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section1Sub1List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>

                <h3 style={subHeadingStyle}>{t('privacyPolicy.section1Sub2Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section1Sub2Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section1Sub2List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>

                <h3 style={subHeadingStyle}>{t('privacyPolicy.section1Sub3Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section1Sub3Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section1Sub3List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>{item}</li>
                  ))}
                </ul>

                <h3 style={subHeadingStyle}>{t('privacyPolicy.section1Sub4Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section1Sub4Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section2Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section2Text')}
                </p>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {tableHeaders.map((header, i) => (
                        <th key={i} style={thStyle}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} style={tdStyle}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section2NoSell')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section3Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section3Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section3List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section4Title')}</h2>
                <h3 style={subHeadingStyle}>{t('privacyPolicy.section4Sub1Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section4Sub1Text')}
                </p>

                <h3 style={subHeadingStyle}>{t('privacyPolicy.section4Sub2Title')}</h3>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section4Sub2Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section4Sub2List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section5Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section5Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section5List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>
                      {item}
                      {i === 0 && (
                        <>
                          {' '}<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #6366f1)', textDecoration: 'underline' }}>
                            Supabase Privacy Policy
                          </a>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section5NoTrackers')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section6Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section6Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section6Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section7Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section7Text')}
                </p>
                <ul style={listStyle}>
                  {(t('privacyPolicy.section7List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section7ContactText')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section8Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section8Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section9Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section9Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section9Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('privacyPolicy.section10Title')}</h2>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section10Text')}
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>{t('privacyPolicy.section10Email')}</li>
                  <li style={listItemStyle}>{t('privacyPolicy.section10Website')}</li>
                </ul>
                <p style={paragraphStyle}>
                  {t('privacyPolicy.section10ChildrenNote')}
                </p>
              </div>

            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
};

export default PrivacyPolicyPage;
