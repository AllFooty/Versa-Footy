import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import WengerQuote from './components/WengerQuote';
import VideoPlayer from './components/VideoPlayer';
import SignUpModal from './components/SignUpModal';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { scrollY } = useScroll();
  const { t } = useTranslation();

  const featuresData = [
    {
      title: t('landing.features.feature1Title'),
      description: t('landing.features.feature1Description'),
      bulletPoints: [
        t('landing.features.feature1Bullet1'),
        t('landing.features.feature1Bullet2'),
        t('landing.features.feature1Bullet3'),
      ],
      imageSrc: '/images/mockups/ai_personalization.png',
      icon: '\u{1F916}',
    },
    {
      title: t('landing.features.feature2Title'),
      description: t('landing.features.feature2Description'),
      bulletPoints: [
        t('landing.features.feature2Bullet1'),
        t('landing.features.feature2Bullet2'),
        t('landing.features.feature2Bullet3'),
      ],
      imageSrc: '/images/mockups/skill_development.png',
      icon: '\u{1F4DA}',
    },
    {
      title: t('landing.features.feature3Title'),
      description: t('landing.features.feature3Description'),
      bulletPoints: [
        t('landing.features.feature3Bullet1'),
        t('landing.features.feature3Bullet2'),
        t('landing.features.feature3Bullet3'),
      ],
      imageSrc: '/images/mockups/progress_tracking.png',
      icon: '\u{1F4CA}',
    },
    {
      title: t('landing.features.feature4Title'),
      description: t('landing.features.feature4Description'),
      bulletPoints: [
        t('landing.features.feature4Bullet1'),
        t('landing.features.feature4Bullet2'),
        t('landing.features.feature4Bullet3'),
      ],
      imageSrc: '/images/mockups/flexible_training.png',
      icon: '\u26A1',
    },
    {
      title: t('landing.features.feature5Title'),
      description: t('landing.features.feature5Description'),
      bulletPoints: [
        t('landing.features.feature5Bullet1'),
        t('landing.features.feature5Bullet2'),
        t('landing.features.feature5Bullet3'),
      ],
      imageSrc: '/images/mockups/science_backed.png',
      icon: '\u{1F393}',
    },
  ];

  const howItWorksSteps = [
    {
      step: 1,
      title: t('landing.howItWorks.step1Title'),
      icon: '\u{1F3AF}',
      description: t('landing.howItWorks.step1Description'),
      color: '#ff4b4b',
    },
    {
      step: 2,
      title: t('landing.howItWorks.step2Title'),
      icon: '\u26BD',
      description: t('landing.howItWorks.step2Description'),
      color: '#6366f1',
    },
    {
      step: 3,
      title: t('landing.howItWorks.step3Title'),
      icon: '\u{1F4CA}',
      description: t('landing.howItWorks.step3Description'),
      color: '#22c55e',
    },
    {
      step: 4,
      title: t('landing.howItWorks.step4Title'),
      icon: '\u2B50',
      description: t('landing.howItWorks.step4Description'),
      color: '#ffd166',
    },
  ];

  const whyVersaFootyData = [
    {
      title: t('landing.whyVersaFooty.card1Title'),
      problem: t('landing.whyVersaFooty.card1Problem'),
      solution: t('landing.whyVersaFooty.card1Solution'),
      icon: '\u{1F309}',
      borderColor: '#6366f1',
    },
    {
      title: t('landing.whyVersaFooty.card2Title'),
      problem: t('landing.whyVersaFooty.card2Problem'),
      solution: t('landing.whyVersaFooty.card2Solution'),
      icon: '\u23F1\uFE0F',
      borderColor: '#22c55e',
    },
    {
      title: t('landing.whyVersaFooty.card3Title'),
      problem: t('landing.whyVersaFooty.card3Problem'),
      solution: t('landing.whyVersaFooty.card3Solution'),
      icon: '\u{1F4FA}',
      borderColor: '#8b5cf6',
    },
    {
      title: t('landing.whyVersaFooty.card4Title'),
      problem: t('landing.whyVersaFooty.card4Problem'),
      solution: t('landing.whyVersaFooty.card4Solution'),
      icon: '\u{1F468}\u200D\u{1F467}\u200D\u{1F466}',
      borderColor: '#f59e0b',
    },
  ];

  const testimonials = [
    {
      quote: t('landing.testimonials.quote1'),
      author: t('landing.testimonials.author1'),
      avatar: '/images/avatars/alex-dad.jpg',
    },
    {
      quote: t('landing.testimonials.quote2'),
      author: t('landing.testimonials.author2'),
      avatar: '/images/avatars/sarah-mom.jpg',
    },
    {
      quote: t('landing.testimonials.quote3'),
      author: t('landing.testimonials.author3'),
      avatar: '/images/avatars/emma-mom.jpg',
    },
  ];

  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.95]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  // Common container style
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
          {/* Hero Section */}
          <motion.section
            className={styles.heroSection}
            style={{ opacity: heroOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ ...containerStyle, padding: '0 24px' }}>
              <div className={styles.heroContent}>
                {/* Left side - Text content */}
                <motion.div
                  className={styles.heroTextContent}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <div className={styles.tagline}>
                    <span>{'\u{1F680}'}</span>
                    <span>{t('landing.hero.tagline')}</span>
                  </div>
                  <h1 className={styles.heroTitle}>
                    {t('landing.hero.title')}{' '}
                    <span className={styles.specialHighlightText}>{t('landing.hero.titleHighlight')}</span>
                  </h1>
                  <p className={styles.heroSubtitle}>
                    {t('landing.hero.subtitle')}
                  </p>
                  <p className={styles.heroSubtitle} style={{ marginTop: '16px', fontSize: '18px', fontWeight: '600', color: '#ffd166' }}>
                    {t('landing.hero.statsLine')}
                  </p>

                  {/* App Store Buttons */}
                  <div style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                      style={{
                        display: 'inline-block',
                        width: '160px',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img
                        src="/images/download/Download_on_the_App_Store_Badge.svg.png"
                        alt={t('landing.hero.appStoreAlt')}
                        style={{ width: '160px', height: 'auto', display: 'block' }}
                      />
                    </a>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                      style={{
                        display: 'inline-block',
                        width: '160px',
                        transition: 'transform 0.3s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <img
                        src="/images/download/Download_on_the_Google_Play_Badge.svg.png"
                        alt={t('landing.hero.playStoreAlt')}
                        style={{ width: '160px', height: 'auto', display: 'block' }}
                      />
                    </a>
                  </div>
                </motion.div>

                {/* Right side - App Mockups */}
                <motion.div
                  className={styles.heroMockups}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <div className={styles.appMockupsContainer}>
                    <img
                      src="/images/mockups/Versa_Footy_Mockup_1.png"
                      alt={t('landing.hero.mockupAlt')}
                      className={`${styles.appMockup} ${styles.mockup1}`}
                    />
                    <img
                      src="/images/mockups/Versa_Footy_Mockup_2.png"
                      alt={t('landing.hero.mockupAlt')}
                      className={`${styles.appMockup} ${styles.mockup2}`}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Wenger Quote */}
          <WengerQuote />

          {/* How It Works Section */}
          <motion.section
            id="how-it-works"
            className={styles.howItWorksSection}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerChildren}
          >
            <div style={containerStyle}>
              <motion.div style={{ textAlign: 'center', marginBottom: '64px' }} variants={fadeInUp}>
                <h2 className={styles.sectionTitle}>{t('landing.howItWorks.sectionTitle')}</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  {t('landing.howItWorks.sectionSubtitle')}
                </p>
              </motion.div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '24px',
              }}>
                {howItWorksSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={fadeInUp}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      padding: '32px 24px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        backgroundColor: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '36px',
                        marginBottom: '20px',
                        boxShadow: `0 8px 24px ${item.color}40`,
                      }}
                    >
                      {item.icon}
                    </div>
                    <span
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    >
                      {item.step}
                    </span>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Video Showcase Section */}
          <section className={styles.videoShowcase}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center', marginBottom: '48px' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 style={{
                  fontSize: '36px',
                  fontWeight: '800',
                  color: 'white',
                  marginBottom: '16px',
                }}>
                  {t('landing.videoShowcase.sectionTitle')}
                </h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', maxWidth: '640px', margin: '0 auto' }}>
                  {t('landing.videoShowcase.sectionSubtitle')}
                </p>
              </motion.div>
              <motion.div
                style={{
                  width: '100%',
                  maxWidth: '900px',
                  margin: '0 auto',
                  aspectRatio: '16/9',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <VideoPlayer videoId="your-video-id" />
              </motion.div>
            </div>
          </section>

          {/* Why Versa Footy Section */}
          <section id="why-versa-footy" className={styles.whyVersaFootySection}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center', marginBottom: '64px' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className={styles.sectionTitle}>{t('landing.whyVersaFooty.sectionTitle')}</h2>
                <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                  {t('landing.whyVersaFooty.sectionSubtitle')}
                </p>
              </motion.div>

              <div className={styles.whyVersaFootyGrid}>
                {whyVersaFootyData.map((item, index) => (
                  <motion.div
                    key={index}
                    className={styles.whyVersaFootyCard}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '28px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderLeftWidth: '4px',
                      borderLeftColor: item.borderColor,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                      <span
                        style={{
                          fontSize: '32px',
                          padding: '12px',
                          borderRadius: '14px',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          boxShadow: `0 8px 24px ${item.borderColor}30`,
                          flexShrink: 0,
                          lineHeight: 1,
                        }}
                      >
                        {item.icon}
                      </span>
                      <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                        {item.title}
                      </h3>
                    </div>
                    <p style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.5)',
                      lineHeight: '1.6',
                      margin: '0 0 12px 0',
                    }}>
                      {item.problem}
                    </p>
                    <div style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.85)',
                      lineHeight: '1.6',
                      margin: 0,
                      backgroundColor: `${item.borderColor}12`,
                      borderRadius: '10px',
                      padding: '10px 14px',
                      borderLeft: `3px solid ${item.borderColor}`,
                    }}>
                      <span style={{ fontWeight: '700', color: item.borderColor }}>{t('common.versaFooty')}</span>
                      {' '}{item.solution}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className={styles.featuresSection}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center', marginBottom: '64px' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className={styles.sectionTitle}>{t('landing.features.sectionTitle')}</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  {t('landing.features.sectionSubtitle')}
                </p>
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
                {featuresData.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.7 }}
                    style={{
                      display: 'flex',
                      flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                      alignItems: 'center',
                      gap: '48px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1', minWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '40px' }}>{feature.icon}</span>
                        <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#ffd166' }}>{feature.title}</h3>
                      </div>
                      <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.8)', marginBottom: '24px' }}>{feature.description}</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {feature.bulletPoints.map((point) => (
                          <li
                            key={point}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '12px',
                              marginBottom: '12px',
                              color: 'rgba(255,255,255,0.85)',
                              fontSize: '16px',
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: 'rgba(34, 197, 94, 0.2)',
                              color: '#22c55e',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '2px',
                            }}>
                              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                      >
                        <img
                          src={feature.imageSrc}
                          alt={feature.title}
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className={styles.testimonialsSection}>
            <div style={containerStyle}>
              <motion.div
                style={{ textAlign: 'center', marginBottom: '64px' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h2 className={styles.sectionTitle}>{t('landing.testimonials.sectionTitle')}</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  {t('landing.testimonials.sectionSubtitle')}
                </p>
              </motion.div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
              }}>
                {testimonials.map((testimonial, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -6 }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '20px',
                      padding: '28px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <svg style={{ width: '40px', height: '40px', color: '#ff6b6b', marginBottom: '16px' }} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p style={{
                      fontSize: '16px',
                      color: 'rgba(255,255,255,0.9)',
                      fontStyle: 'italic',
                      lineHeight: '1.7',
                      flex: '1',
                      marginBottom: '20px',
                    }}>
                      "{testimonial.quote}"
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.author}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <p style={{ fontWeight: '600', color: '#ffd166' }}>— {testimonial.author}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <div className={styles.sectionDivider} />

          {/* FAQ CTA Section */}
          <section className={styles.faqSection} id="faq">
            <div style={{ ...containerStyle, textAlign: 'center', padding: '80px 24px' }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>{t('landing.faqCta.sectionTitle')}</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', maxWidth: '640px', margin: '0 auto 32px' }}>
                  {t('landing.faqCta.sectionSubtitle')}
                </p>
                <Link href="/faq">
                  <a className={styles.button}>{t('landing.faqCta.viewFaqButton')}</a>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div style={{ ...containerStyle, textAlign: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                {t('landing.cta.title')}
              </h2>
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '40px', maxWidth: '640px', margin: '0 auto 40px' }}>
                {t('landing.cta.subtitle')}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                  style={{
                    display: 'inline-block',
                    width: '180px',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img
                    src="/images/download/Download_on_the_App_Store_Badge.svg.png"
                    alt={t('landing.hero.appStoreAlt')}
                    style={{ width: '180px', height: 'auto', display: 'block' }}
                  />
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setIsModalOpen(true); }}
                  style={{
                    display: 'inline-block',
                    width: '180px',
                    transition: 'transform 0.3s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <img
                    src="/images/download/Download_on_the_Google_Play_Badge.svg.png"
                    alt={t('landing.hero.playStoreAlt')}
                    style={{ width: '180px', height: 'auto', display: 'block' }}
                  />
                </a>
              </div>
            </div>
          </section>

          {/* Early Access Section */}
          <section className={styles.earlyAccessSection} id="early-access">
            <div style={{ ...containerStyle, textAlign: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                  {t('landing.earlyAccess.title')}
                </h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
                  {t('landing.earlyAccess.subtitle')}
                </p>
                <button className={styles.button} onClick={() => setIsModalOpen(true)}>
                  {t('landing.earlyAccess.joinButton')}
                </button>
              </motion.div>
            </div>
          </section>
        </main>

        <FooterLanding />
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SignUpModal onClose={() => setIsModalOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
