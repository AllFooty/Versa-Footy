import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import FAQSection from './components/FAQSection';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const FaqPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Common container style (same as landing page)
  const containerStyle = {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
  };

  return (
    <>
      <All4FootyFamilyBar />
      <div className={styles.landingPage}>
        <HeaderLanding />

        <main>
          {/* Hero Section for FAQ */}
          <section className={styles.heroSection} style={{ padding: '60px 0 40px' }}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className={styles.heroTitle} style={{ marginBottom: '16px' }}>
                  Frequently Asked Questions
                </h1>
                <p className={styles.heroSubtitle} style={{ margin: '0 auto', textAlign: 'center' }}>
                  Find answers to common questions about Versa Footy and how it can help your kid excel in soccer.
                </p>
              </motion.div>
            </div>
          </section>

          {/* FAQ Content Section */}
          <section className={styles.faqSection} style={{ padding: '60px 0 80px' }}>
            <div style={containerStyle}>
              {isLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '256px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    border: '3px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '3px solid #6366f1',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                </div>
              ) : (
                <FAQSection />
              )}
            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
};

export default FaqPage;

