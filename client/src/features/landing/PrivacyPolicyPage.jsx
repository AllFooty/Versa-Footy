import React from 'react';
import { motion } from 'framer-motion';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const PrivacyPolicyPage = () => {
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
                  Privacy Policy
                </h1>
                <p className={styles.heroSubtitle} style={{ margin: '0 auto', textAlign: 'center' }}>
                  Last updated: March 2, 2026
                </p>
              </motion.div>
            </div>
          </section>

          <section style={{ padding: '40px 0 80px' }}>
            <div style={containerStyle}>

              <div style={sectionStyle}>
                <p style={paragraphStyle}>
                  Versa Footy ("we," "us," or "our"), part of the All4Footy Family, is committed to protecting your privacy and the privacy of your children. This Privacy Policy explains how we collect, use, store, and protect information when you use our website at versafooty.com and our web application (collectively, the "Service").
                </p>
                <p style={paragraphStyle}>
                  Because our platform is designed for youth soccer players ages 5–14, we take children's privacy especially seriously. We encourage parents and legal guardians to read this policy carefully and to supervise their child's use of the Service.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>1. Information We Collect</h2>

                <h3 style={subHeadingStyle}>1.1 Account Information</h3>
                <p style={paragraphStyle}>
                  When you create an account, we collect:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}><strong>Email address</strong> — used for authentication via one-time password (OTP) login</li>
                  <li style={listItemStyle}><strong>Full name</strong> — optionally provided for your profile</li>
                </ul>

                <h3 style={subHeadingStyle}>1.2 Player Profile Information</h3>
                <p style={paragraphStyle}>
                  To personalize the training experience, we collect:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}><strong>Age group</strong> — used to tailor exercises and skill progressions to the appropriate developmental stage</li>
                </ul>

                <h3 style={subHeadingStyle}>1.3 Training and Activity Data</h3>
                <p style={paragraphStyle}>
                  As you use the Service, we automatically collect data about your training activity, including:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Training sessions (type, start time, completion time, status)</li>
                  <li style={listItemStyle}>Exercise completions and self-ratings (1–5 scale)</li>
                  <li style={listItemStyle}>Skill progress and mastery levels</li>
                  <li style={listItemStyle}>XP earned, current level, and achievements unlocked</li>
                  <li style={listItemStyle}>Daily activity metrics (exercises completed, practice minutes)</li>
                  <li style={listItemStyle}>Streak data (current streak, longest streak)</li>
                </ul>

                <h3 style={subHeadingStyle}>1.4 Technical Data</h3>
                <p style={paragraphStyle}>
                  We may collect basic technical data necessary to operate the Service, such as session tokens stored in your browser's local storage. We do not use third-party analytics, advertising trackers, or cookies for marketing purposes.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>2. How We Use Your Information</h2>
                <p style={paragraphStyle}>
                  We use the information we collect for the following purposes:
                </p>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Purpose</th>
                      <th style={thStyle}>Data Used</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={tdStyle}>Account authentication</td>
                      <td style={tdStyle}>Email address</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>Personalizing training programs</td>
                      <td style={tdStyle}>Age group, skill progress, exercise history</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>Tracking progress and achievements</td>
                      <td style={tdStyle}>Training data, XP, levels, streaks</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>Improving the Service</td>
                      <td style={tdStyle}>Aggregated, anonymized usage patterns</td>
                    </tr>
                    <tr>
                      <td style={tdStyle}>Communicating with you</td>
                      <td style={tdStyle}>Email address (service-related messages only)</td>
                    </tr>
                  </tbody>
                </table>
                <p style={paragraphStyle}>
                  We do not sell, rent, or share your personal information with third parties for their marketing purposes.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>3. Children's Privacy</h2>
                <p style={paragraphStyle}>
                  Versa Footy is committed to protecting the privacy of children. Our platform is intended for use by children ages 5–14 under the supervision of a parent or legal guardian.
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>We require parental consent for accounts created for children under 13, in compliance with the Children's Online Privacy Protection Act (COPPA).</li>
                  <li style={listItemStyle}>We collect only the minimum information necessary to provide the training experience.</li>
                  <li style={listItemStyle}>We do not display targeted advertising to any users, including children.</li>
                  <li style={listItemStyle}>We do not collect precise geolocation data.</li>
                  <li style={listItemStyle}>Parents and guardians may review, update, or request deletion of their child's data at any time by contacting us at info@versafooty.com.</li>
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>4. Data Storage and Security</h2>
                <h3 style={subHeadingStyle}>4.1 Where We Store Your Data</h3>
                <p style={paragraphStyle}>
                  Your data is stored securely using Supabase, our backend infrastructure provider. Supabase provides a PostgreSQL database with built-in security features including row-level security (RLS) policies, ensuring that users can only access their own data.
                </p>

                <h3 style={subHeadingStyle}>4.2 How We Protect Your Data</h3>
                <p style={paragraphStyle}>
                  We implement appropriate technical and organizational measures to protect your personal information, including:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Passwordless authentication via email OTP, eliminating risks associated with stored passwords</li>
                  <li style={listItemStyle}>Row-level security policies on all database tables, ensuring data isolation between users</li>
                  <li style={listItemStyle}>Encrypted data transmission using HTTPS</li>
                  <li style={listItemStyle}>Privacy-conscious session storage with fallback mechanisms for browsers with strict privacy settings</li>
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>5. Third-Party Services</h2>
                <p style={paragraphStyle}>
                  We use the following third-party service to operate the platform:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>
                    <strong>Supabase</strong> — provides our database, authentication, and backend infrastructure. Supabase processes data on our behalf and is bound by their own privacy commitments. You can review the <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color, #6366f1)', textDecoration: 'underline' }}>Supabase Privacy Policy</a> for more information.
                  </li>
                </ul>
                <p style={paragraphStyle}>
                  We do not use third-party analytics services, advertising networks, or social media tracking pixels.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>6. Data Retention</h2>
                <p style={paragraphStyle}>
                  We retain your personal information for as long as your account is active or as needed to provide the Service. Training and progress data is retained to maintain your historical performance records and enable the AI-powered personalization features.
                </p>
                <p style={paragraphStyle}>
                  If you request account deletion, we will remove your personal data within a reasonable timeframe. Some aggregated, anonymized data may be retained for service improvement purposes, but this data cannot be used to identify you.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>7. Your Rights</h2>
                <p style={paragraphStyle}>
                  Depending on your jurisdiction, you may have the following rights regarding your personal data:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}><strong>Access</strong> — request a copy of the personal data we hold about you</li>
                  <li style={listItemStyle}><strong>Correction</strong> — request that we correct inaccurate or incomplete data</li>
                  <li style={listItemStyle}><strong>Deletion</strong> — request that we delete your personal data</li>
                  <li style={listItemStyle}><strong>Data Portability</strong> — request your data in a structured, commonly used format</li>
                  <li style={listItemStyle}><strong>Withdraw Consent</strong> — withdraw consent for processing where applicable</li>
                </ul>
                <p style={paragraphStyle}>
                  To exercise any of these rights, please contact us at info@versafooty.com. We will respond to your request within 30 days.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>8. International Users</h2>
                <p style={paragraphStyle}>
                  If you access the Service from outside the country where our servers are located, your information may be transferred across international borders. By using the Service, you consent to the transfer and processing of your information in accordance with this Privacy Policy.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>9. Changes to This Policy</h2>
                <p style={paragraphStyle}>
                  We may update this Privacy Policy from time to time. When we make changes, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically. Your continued use of the Service after any changes constitutes your acceptance of the updated policy.
                </p>
                <p style={paragraphStyle}>
                  For material changes that affect how we handle children's data, we will make reasonable efforts to notify parents or guardians directly via email.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>10. Contact Us</h2>
                <p style={paragraphStyle}>
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Email: info@versafooty.com</li>
                  <li style={listItemStyle}>Website: versafooty.com</li>
                </ul>
                <p style={paragraphStyle}>
                  For questions specifically about your child's data, please include "Children's Privacy" in your email subject line.
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
