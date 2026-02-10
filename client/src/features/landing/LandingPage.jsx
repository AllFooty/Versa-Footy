import React, { useState } from 'react';
import { Link } from 'wouter';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import WengerQuote from './components/WengerQuote';
import VideoPlayer from './components/VideoPlayer';
import SignUpModal from './components/SignUpModal';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const featuresData = [
  {
    title: 'AI-Powered Personalization',
    description: "Our AI tailors every session to your kid's needs:",
    bulletPoints: [
      'Smart skill assessments with instant adjustments',
      'Dynamic training that evolves with progress',
      'Personalized feedback and recommendations',
    ],
    imageSrc: '/images/mockups/ai_personalization.png',
    icon: '🤖',
  },
  {
    title: 'Comprehensive Training Library',
    description: 'Access a complete development program:',
    bulletPoints: [
      '1,000+ exercises for ages 5-14',
      'Both-feet training methodology',
      'Progressive drills across 100 technical skills',
    ],
    imageSrc: '/images/mockups/skill_development.png',
    icon: '📚',
  },
  {
    title: 'Smart Progress Tracking',
    description: 'Monitor development with precision:',
    bulletPoints: [
      'Real-time performance analytics',
      'Clear progress visualization',
      'Achievement milestones and badges',
    ],
    imageSrc: '/images/mockups/progress_tracking.png',
    icon: '📊',
  },
  {
    title: 'Flexible Training System',
    description: 'Train anywhere, anytime:',
    bulletPoints: [
      'Quick, adaptable practice sessions',
      'Minimal equipment requirements',
      'Fun, engaging exercises that prevent burnout',
    ],
    imageSrc: '/images/mockups/flexible_training.png',
    icon: '⚡',
  },
  {
    title: 'Expert-Backed Methods',
    description: 'Training rooted in sports science:',
    bulletPoints: [
      'Age-appropriate development focus',
      'Pro coach-designed curriculum',
      'Research-based training methods',
    ],
    imageSrc: '/images/mockups/science_backed.png',
    icon: '🎓',
  },
];

const howItWorksSteps = [
  {
    step: 1,
    title: 'Pick Your Level',
    icon: '🎯',
    description: 'Tell us your age. We build a personalized roadmap showing which skills to master and when, based on proven youth development science.',
    color: '#ff4b4b',
  },
  {
    step: 2,
    title: 'Train Daily',
    icon: '⚽',
    description: 'Sessions tailored from 1000+ exercises focus on what your kid needs: recently neglected skills and age-critical techniques.',
    color: '#6366f1',
  },
  {
    step: 3,
    title: 'Rate & Track',
    icon: '📊',
    description: 'Rate each exercise. Our AI tracks progress, calculates mastery levels, and recommends what to work on next.',
    color: '#22c55e',
  },
  {
    step: 4,
    title: 'Level Up',
    icon: '⭐',
    description: 'Every session earns XP. Better performance earns more. Daily streaks multiply rewards. It feels like a game with real on-pitch results.',
    color: '#ffd166',
  },
];

const whyVersaFootyData = [
  {
    title: 'Club training alone isn\'t enough',
    problem: '2–3 hours a week covers tactics and scrimmages — not the technical reps that matter.',
    solution: 'gives your kid daily structured training — the same approach the world\'s best young players use.',
    icon: '🌉',
    borderColor: '#6366f1',
  },
  {
    title: 'The window is real and closing',
    problem: 'Fine motor skill development peaks in childhood. Miss it, and biology works against you.',
    solution: 'delivers age-targeted training that builds the right skills at the right time.',
    icon: '⏱️',
    borderColor: '#22c55e',
  },
  {
    title: 'Your kid doesn\'t need another YouTube playlist',
    problem: 'YouTube has drills. It doesn\'t have structure, progression, or memory.',
    solution: 'adapts every session to what your kid has mastered, avoided, or needs next.',
    icon: '📺',
    borderColor: '#8b5cf6',
  },
  {
    title: 'Parents aren\'t coaches',
    problem: 'You want to help but don\'t know what to teach or when.',
    solution: 'is the expert in your pocket — you encourage, it instructs.',
    icon: '👨‍👧‍👦',
    borderColor: '#f59e0b',
  },
];

const testimonials = [
  {
    quote:
      'Versa Footy helped my son improve his weak foot skills significantly in just three months! [Sample Testimonial]',
    author: 'Happy Parent',
    avatar: '/images/avatars/alex-dad.jpg',
  },
  {
    quote:
      'The personalized training helped my daughter make it to the regional team. It is like having a private coach available 24/7. [This is placeholder content]',
    author: 'Satisfied Parent',
    avatar: '/images/avatars/sarah-mom.jpg',
  },
  {
    quote:
      "I love how my kid can train anytime, anywhere. It fits perfectly with our busy family schedule. [Real testimonials coming soon!]",
    author: 'Busy Parent',
    avatar: '/images/avatars/emma-mom.jpg',
  },
];

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { scrollY } = useScroll();

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
                    <span>🚀</span>
                    <span>Don't Miss Out! Join First!</span>
                  </div>
                  <h1 className={styles.heroTitle}>
                    Help Your Kid Build Pro Skills with{' '}
                    <span className={styles.specialHighlightText}>Science-Based AI Training</span>
                  </h1>
                  <p className={styles.heroSubtitle}>
                    Technical ability is made, not born, and the window to develop it closes sooner than you think. Our app gives kids aged 7–14 a science-based path to build it before it's too late.
                  </p>
                  <p className={styles.heroSubtitle} style={{ marginTop: '16px', fontSize: '18px', fontWeight: '600', color: '#ffd166' }}>
                    170+ skills. 10 categories. First touch to total mastery.
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
                        alt="Download on the App Store"
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
                        alt="Get it on Google Play"
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
                      alt="Versa Footy app"
                      className={`${styles.appMockup} ${styles.mockup1}`}
                    />
                    <img
                      src="/images/mockups/Versa_Footy_Mockup_2.png"
                      alt="Versa Footy app"
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
                <h2 className={styles.sectionTitle}>How It Works</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  Get started in minutes and watch your child's skills improve week after week
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
                  See Versa Footy in Action
                </h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', maxWidth: '640px', margin: '0 auto' }}>
                  Watch how Versa Footy is revolutionizing youth soccer training with AI-powered personalized programs.
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
                <h2 className={styles.sectionTitle}>Why Versa Footy?</h2>
                <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                  Closing the Gap in Youth Soccer Development
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
                      <span style={{ fontWeight: '700', color: item.borderColor }}>Versa Footy</span>
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
                <h2 className={styles.sectionTitle}>Powerful Features</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  Everything your child needs to develop professional-level skills
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
                <h2 className={styles.sectionTitle}>Success Stories</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', maxWidth: '640px', margin: '16px auto 0' }}>
                  Join thousands of parents who are helping their kids reach their full potential
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
                <h2 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Still Have Questions?</h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', maxWidth: '640px', margin: '0 auto 32px' }}>
                  Find answers to common questions about Versa Footy and how it can help your kid excel in soccer.
                </p>
                <Link href="/faq">
                  <a className={styles.button}>View FAQ</a>
                </Link>
              </motion.div>
            </div>
          </section>

          {/* CTA Section */}
          <section className={styles.ctaSection}>
            <div style={{ ...containerStyle, textAlign: 'center', padding: '80px 24px', position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: '36px', fontWeight: '800', color: 'white', marginBottom: '16px' }}>
                Ready to Give Your Kid a Competitive Edge?
              </h2>
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '40px', maxWidth: '640px', margin: '0 auto 40px' }}>
                Download the app and watch your kid's confidence and skills take off.
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
                    alt="Download on the App Store"
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
                    alt="Get it on Google Play"
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
                  Be the First to Know!
                </h2>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.9)', marginBottom: '32px' }}>
                  Join our waitlist to get exclusive early access and updates.
                </p>
                <button className={styles.button} onClick={() => setIsModalOpen(true)}>
                  Join the Waitlist
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
