import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const TermsOfServicePage = () => {
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
                  {t('termsOfService.pageTitle')}
                </h1>
                <p className={styles.heroSubtitle} style={{ margin: '0 auto', textAlign: 'center' }}>
                  {t('termsOfService.lastUpdated')}
                </p>
              </motion.div>
            </div>
          </section>

          <section style={{ padding: '40px 0 80px' }}>
            <div style={containerStyle}>

              <div style={sectionStyle}>
                <p style={paragraphStyle}>
                  {t('termsOfService.introParagraph1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.introParagraph2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section1Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section1Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section2Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section2Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.section2Text2')}
                </p>
                <ul style={listStyle}>
                  {(t('termsOfService.section2List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>{item}</li>
                  ))}
                </ul>
                <p style={paragraphStyle}>
                  {t('termsOfService.section2Text3')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section3Title')}</h2>
                <h3 style={subHeadingStyle}>{t('termsOfService.section3Sub1Title')}</h3>
                <p style={paragraphStyle}>
                  {t('termsOfService.section3Sub1Text')}
                </p>
                <h3 style={subHeadingStyle}>{t('termsOfService.section3Sub2Title')}</h3>
                <p style={paragraphStyle}>
                  {t('termsOfService.section3Sub2Text')}
                </p>
                <ul style={listStyle}>
                  {(t('termsOfService.section3Sub2List', { returnObjects: true }) || []).map((item, i) => (
                    <li key={i} style={listItemStyle}>{item}</li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section4Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section4Text')}
                </p>
                <h3 style={subHeadingStyle}>{t('termsOfService.section4Sub1Title')}</h3>
                <p style={paragraphStyle}>
                  {t('termsOfService.section4Sub1Text')}
                </p>
                <h3 style={subHeadingStyle}>{t('termsOfService.section4Sub2Title')}</h3>
                <p style={paragraphStyle}>
                  {t('termsOfService.section4Sub2Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section5Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section5Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.section5Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section6Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section6Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.section6Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section7Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section7Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section8Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section8Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.section8Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section9Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section9Text1')}
                </p>
                <p style={paragraphStyle}>
                  {t('termsOfService.section9Text2')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section10Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section10Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section11Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section11Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section12Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section12Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section13Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section13Text')}
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>{t('termsOfService.section14Title')}</h2>
                <p style={paragraphStyle}>
                  {t('termsOfService.section14Text')}
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>{t('termsOfService.section14Email')}</li>
                  <li style={listItemStyle}>{t('termsOfService.section14Website')}</li>
                </ul>
              </div>

            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
};

export default TermsOfServicePage;
