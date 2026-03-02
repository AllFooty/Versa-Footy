import React from 'react';
import { motion } from 'framer-motion';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const TermsOfServicePage = () => {
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
                  Terms of Service
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
                  Welcome to Versa Footy. These Terms of Service ("Terms") govern your access to and use of the Versa Footy platform, including our website at versafooty.com and our web application (collectively, the "Service"), operated by Versa Footy ("we," "us," or "our"), part of the All4Footy Family.
                </p>
                <p style={paragraphStyle}>
                  By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not use the Service. If you are a parent or legal guardian creating an account on behalf of a child under 18, you agree to these Terms on behalf of your child.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>1. Eligibility</h2>
                <p style={paragraphStyle}>
                  Versa Footy is designed for youth soccer players ages 5–14 and their parents or legal guardians. Users under the age of 18 must have consent from a parent or legal guardian to use the Service. By creating an account for a minor, you represent that you are the child's parent or legal guardian and consent to their use of the Service under your supervision.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>2. Account Registration</h2>
                <p style={paragraphStyle}>
                  To access certain features of the Service, you must create an account using a valid email address. We use a one-time password (OTP) system sent to your email for authentication—no traditional passwords are required.
                </p>
                <p style={paragraphStyle}>
                  You are responsible for:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Providing accurate and complete registration information</li>
                  <li style={listItemStyle}>Maintaining the security of your email account and any session access</li>
                  <li style={listItemStyle}>All activity that occurs under your account</li>
                </ul>
                <p style={paragraphStyle}>
                  You must notify us immediately at info@versafooty.com if you believe your account has been compromised.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>3. Use of the Service</h2>
                <h3 style={subHeadingStyle}>3.1 Permitted Use</h3>
                <p style={paragraphStyle}>
                  Versa Footy provides AI-powered soccer training programs, including personalized exercises, skill tracking, progress monitoring, and gamification features such as XP, levels, streaks, and achievements. The Service is intended for personal, non-commercial use only.
                </p>
                <h3 style={subHeadingStyle}>3.2 Prohibited Conduct</h3>
                <p style={paragraphStyle}>
                  You agree not to:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Use the Service for any unlawful purpose or in violation of these Terms</li>
                  <li style={listItemStyle}>Attempt to gain unauthorized access to the Service, other accounts, or our systems</li>
                  <li style={listItemStyle}>Reverse engineer, decompile, or disassemble any part of the Service</li>
                  <li style={listItemStyle}>Copy, reproduce, distribute, or create derivative works from our training content, including exercise descriptions, skill progressions, and training methodologies</li>
                  <li style={listItemStyle}>Use automated scripts, bots, or scrapers to access the Service</li>
                  <li style={listItemStyle}>Interfere with or disrupt the integrity or performance of the Service</li>
                  <li style={listItemStyle}>Misrepresent your identity or age group information</li>
                </ul>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>4. Training Content</h2>
                <p style={paragraphStyle}>
                  Our training library contains over 1,000 exercises covering 100+ technical soccer skills. This content is provided for informational and training purposes only.
                </p>
                <h3 style={subHeadingStyle}>4.1 Not Medical or Professional Advice</h3>
                <p style={paragraphStyle}>
                  The training programs provided by Versa Footy are not a substitute for professional coaching, medical advice, or physical therapy. You should consult a qualified healthcare provider before beginning any new exercise program. Parents and guardians should supervise young players during training sessions and ensure exercises are performed safely and in an appropriate environment.
                </p>
                <h3 style={subHeadingStyle}>4.2 Assumption of Risk</h3>
                <p style={paragraphStyle}>
                  Physical activity carries inherent risks of injury. By using the Service, you acknowledge and accept these risks. You (or if applicable, your parent or guardian) are solely responsible for determining whether any exercise or training program is appropriate for the user's age, fitness level, and physical condition.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>5. Intellectual Property</h2>
                <p style={paragraphStyle}>
                  All content, features, and functionality of the Service—including but not limited to text, graphics, logos, icons, images, exercise descriptions, training methodologies, skill progression systems, AI algorithms, and software—are the exclusive property of Versa Footy and are protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p style={paragraphStyle}>
                  We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for personal, non-commercial purposes in accordance with these Terms.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>6. User Data and Progress</h2>
                <p style={paragraphStyle}>
                  When you use the Service, we collect and store data related to your training activity, including exercise completions, self-ratings, skill progress, XP, achievements, and session history. This data is used to personalize your training experience and track your development.
                </p>
                <p style={paragraphStyle}>
                  You retain ownership of the personal information you provide. Our use of your data is governed by our <a href="/privacy-policy" style={{ color: 'var(--accent-color, #6366f1)', textDecoration: 'underline' }}>Privacy Policy</a>, which is incorporated into these Terms by reference.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>7. Availability and Modifications</h2>
                <p style={paragraphStyle}>
                  We strive to keep the Service available at all times but do not guarantee uninterrupted access. We may modify, suspend, or discontinue any part of the Service at any time without prior notice. We reserve the right to update the training library, adjust gamification mechanics, and modify features as we continue to improve the platform.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>8. Termination</h2>
                <p style={paragraphStyle}>
                  We may suspend or terminate your access to the Service at any time, with or without cause, and with or without notice. You may stop using the Service at any time. Upon termination, your right to use the Service will immediately cease.
                </p>
                <p style={paragraphStyle}>
                  If you wish to delete your account, please contact us at info@versafooty.com. Upon account deletion, your personal data will be removed in accordance with our Privacy Policy.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>9. Disclaimers</h2>
                <p style={paragraphStyle}>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p style={paragraphStyle}>
                  We do not warrant that the Service will be error-free, uninterrupted, or secure, or that any defects will be corrected. We do not guarantee any specific results from the use of the training programs.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>10. Limitation of Liability</h2>
                <p style={paragraphStyle}>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, VERSA FOOTY AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, PERSONAL INJURY, OR PROPERTY DAMAGE ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>11. Indemnification</h2>
                <p style={paragraphStyle}>
                  You agree to indemnify, defend, and hold harmless Versa Footy and its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising out of or related to your use of the Service, your violation of these Terms, or your violation of any rights of another party.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>12. Changes to These Terms</h2>
                <p style={paragraphStyle}>
                  We may update these Terms from time to time. When we make changes, we will update the "Last updated" date at the top of this page. Your continued use of the Service after any changes constitutes your acceptance of the revised Terms. We encourage you to review these Terms periodically.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>13. Governing Law</h2>
                <p style={paragraphStyle}>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Versa Footy operates, without regard to conflict of law principles.
                </p>
              </div>

              <div style={sectionStyle}>
                <h2 style={headingStyle}>14. Contact Us</h2>
                <p style={paragraphStyle}>
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <ul style={listStyle}>
                  <li style={listItemStyle}>Email: info@versafooty.com</li>
                  <li style={listItemStyle}>Website: versafooty.com</li>
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
