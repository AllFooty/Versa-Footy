import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="blue" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const AboutPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.aboutPage} min-h-screen flex flex-col relative overflow-hidden`}>
      <HeaderLanding />

      <main className={`${styles.mainContent} flex-grow`}>
        <section className={`${styles.heroSection} py-20 text-center`}>
          <div className="container mx-auto px-4">
            <h1 className={`${styles.heroTitle} mb-6 font-bold`}>
              About <span className={styles.specialHighlightText}>Versa Footy</span>
            </h1>
            <div className="flex justify-center items-center mb-8">
              <img src="/images/Versa Footy Icon.png" alt="Versa Footy Logo" width={150} height={150} />
            </div>
            <p className={`${styles.heroSubtitle} max-w-3xl mx-auto`}>
              Empowering the Next Generation of Soccer Stars with AI-Driven Soccer Training
            </p>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>Our Story</h2>
            <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
              <p className={styles.featureDescription}>
                Founded in 2024, Versa Footy was born from a shared passion for soccer and a vision to revolutionize youth soccer training. We believe every young
                athlete deserves access to top level training, no matter where they live. Our team came together with a single goal: to create the ultimate soccer
                training solution for youth players that bridges the gap between talent and opportunity. The result? An AI-powered app that delivers pro-level,
                personalized training to young players, putting them on a track to have a real chance to become pro soccer players.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>Our Mission &amp; Vision</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
                <h3 className={`${styles.stepTitle} mb-4 font-bold`}>Our Mission</h3>
                <p className={styles.stepDescription}>
                  At Versa Footy, our mission is to redefine youth soccer training through innovative AI technology. We aim to give every young player access to
                  high-quality training once reserved for elite academies. By combining smart algorithms with sports science, we empower kids aged 5-14 to master
                  the game and unlock their full potential.
                </p>
              </div>
              <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
                <h3 className={`${styles.stepTitle} mb-4 font-bold`}>Our Vision</h3>
                <p className={styles.stepDescription}>
                  We envision a world where aspiring soccer stars can access personalized, pro-level training that grows with them. Our platform offers over 1,000
                  unique drills, focusing on 100 essential technical skills. With Versa Footy, young athletes are not just training; they are building confidence,
                  nurturing their passion, and setting themselves on a path to success.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { value: 'Integrity', description: 'We uphold the highest standards of integrity in our technology, our training methods.', icon: '🔗' },
                { value: 'Excellence', description: 'We strive for excellence in everything we do, from our AI algorithms to our training programs.', icon: '⭐' },
                { value: 'Innovation', description: 'We embrace continuous innovation, leveraging technology and science to revolutionize youth soccer training.', icon: '🚀' },
              ].map((item) => (
                <div key={item.value} className={`${styles.featureCard} p-6 rounded-lg shadow-lg`}>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl mb-4">{item.icon}</span>
                    <h3 className={`${styles.stepTitle} mb-2 font-bold`}>{item.value}</h3>
                  </div>
                  <p className={styles.stepDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 bg-gray-100 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>Our Big Hairy Audacious Goal (BHAG)</h2>
            <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
              <p className={`${styles.stepDescription} text-lg font-semibold`}>
                By 2034, Versa Footy aims to have transformed the lives of over 1 million young soccer players worldwide. We strive to ensure that at least 1,000 of
                these players sign professional contracts before the age of 19, revolutionizing the global soccer talent pipeline and democratizing access to
                elite-level training.
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.testimonialsSection} py-16 bg-gray-50 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>Meet Our Leadership</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {[
                {
                  name: 'Mubdu Alali',
                  role: 'Co-founder | CEO',
                  image: '/images/team/mubdu-alali.jpg',
                  bio: 'A visionary entrepreneur and Top 30 Under 30 Innovator, he brings extensive experience in sports technology and startup development to Versa Footy. His passion for social entrepreneurship and youth development drives the company and its mission to empower young athletes through AI-powered training.',
                  linkedin: 'https://www.linkedin.com/in/mubdualali/',
                },
                {
                  name: 'Hussain Bin Ahmed',
                  role: 'Co-founder | COO',
                  image: '/images/team/hussain-bin-ahmad.jpg',
                  bio: 'Hussain combines his expertise as a physiotherapist with his experience as a media content creator to drive Versa Footy, its operations and content strategy. His background in sports training and rehabilitation informs the company and its science-based methodology for holistic athlete development.',
                  linkedin: 'https://www.linkedin.com/in/hussainbahmed/',
                },
              ].map((leader) => (
                <motion.div
                  key={leader.name}
                  className={`${styles.testimonialCard} p-8 rounded-lg shadow-lg flex flex-col items-center text-center bg-white`}
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-6 relative">
                    <img
                      src={leader.image}
                      alt={`${leader.name}, ${leader.role}`}
                      width={180}
                      height={180}
                      className="rounded-full border-4 border-[var(--accent-color)] shadow-lg"
                    />
                    <div className="absolute bottom-0 right-0 bg-[var(--accent-color)] rounded-full p-2">
                      <a
                        href={leader.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-gray-200 transition-colors duration-300"
                        title={`${leader.name}'s LinkedIn profile`}
                      >
                        <LinkedInIcon />
                      </a>
                    </div>
                  </div>
                  <div>
                    <h3 className={`${styles.testimonialAuthor} text-2xl mb-2 font-bold`}>{leader.name}</h3>
                    <p className={`${styles.testimonialText} text-lg mb-4 text-gray-600`}>{leader.role}</p>
                    <p className={`${styles.stepDescription} mb-4`}>{leader.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.ctaSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} text-white mb-8 font-bold`}>Join Our Mission</h2>
            <p className={`${styles.heroSubtitle} text-white mb-8 max-w-2xl mx-auto`}>
              Be part of the revolution in youth soccer training. Download Versa Footy today and start your journey towards soccer excellence.
            </p>
            <Link href="/#early-access">
              <a className={`${styles.button} px-8 py-3 rounded-full text-lg font-semibold inline-block`}>Get Early Access</a>
            </Link>
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  );
};

export default AboutPage;

