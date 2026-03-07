import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import HeaderLanding from './components/HeaderLanding';
import FooterLanding from './components/FooterLanding';
import All4FootyFamilyBar from './components/All4FootyFamilyBar';
import styles from './styles/LandingPage.module.css';
import './styles/landing-globals.css';

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="blue" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const AboutPage = () => {
  const { t } = useTranslation();

  const coreValues = [
    { value: t('about.integrity'), description: t('about.integrityText'), icon: '\u{1F517}' },
    { value: t('about.excellence'), description: t('about.excellenceText'), icon: '\u2B50' },
    { value: t('about.innovation'), description: t('about.innovationText'), icon: '\u{1F680}' },
  ];

  const leaders = [
    {
      name: t('about.leader1Name'),
      role: t('about.leader1Role'),
      image: '/images/team/mubdu-alali.jpg',
      bio: t('about.leader1Bio'),
      linkedin: 'https://www.linkedin.com/in/mubdualali/',
    },
    {
      name: t('about.leader2Name'),
      role: t('about.leader2Role'),
      image: '/images/team/hussain-bin-ahmad.jpg',
      bio: t('about.leader2Bio'),
      linkedin: 'https://www.linkedin.com/in/hussainbahmed/',
    },
  ];

  return (
    <>
      <All4FootyFamilyBar />
      <div className={`${styles.aboutPage} min-h-screen flex flex-col relative overflow-hidden`}>
        <HeaderLanding />

      <main className={`${styles.mainContent} flex-grow`}>
        <section className={`${styles.heroSection} py-20 text-center`}>
          <div className="container mx-auto px-4">
            <h1 className={`${styles.heroTitle} mb-6 font-bold`}>
              {t('about.heroTitle')} <span className={styles.specialHighlightText}>{t('about.heroTitleHighlight')}</span>
            </h1>
            <div className="flex justify-center items-center mb-8">
              <img src="/images/Versa Footy Icon.png" alt={t('common.appName')} width={150} height={150} />
            </div>
            <p className={`${styles.heroSubtitle} max-w-3xl mx-auto`}>
              {t('about.heroSubtitle')}
            </p>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>{t('about.ourStory')}</h2>
            <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
              <p className={styles.featureDescription}>
                {t('about.ourStoryText')}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>{t('about.missionVision')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
                <h3 className={`${styles.stepTitle} mb-4 font-bold`}>{t('about.ourMission')}</h3>
                <p className={styles.stepDescription}>
                  {t('about.ourMissionText')}
                </p>
              </div>
              <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
                <h3 className={`${styles.stepTitle} mb-4 font-bold`}>{t('about.ourVision')}</h3>
                <p className={styles.stepDescription}>
                  {t('about.ourVisionText')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.featuresSection} py-16 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>{t('about.coreValues')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {coreValues.map((item) => (
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
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>{t('about.bhag')}</h2>
            <div className={`${styles.featureCard} p-8 rounded-lg shadow-lg`}>
              <p className={`${styles.stepDescription} text-lg font-semibold`}>
                {t('about.bhagText')}
              </p>
            </div>
          </div>
        </section>

        <section className={`${styles.testimonialsSection} py-16 bg-gray-50 text-center`}>
          <div className="container mx-auto px-4">
            <h2 className={`${styles.sectionTitle} mb-12 font-bold`}>{t('about.leadership')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {leaders.map((leader) => (
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
            <h2 className={`${styles.sectionTitle} text-white mb-8 font-bold`}>{t('about.joinMission')}</h2>
            <p className={`${styles.heroSubtitle} text-white mb-8 max-w-2xl mx-auto`}>
              {t('about.joinMissionText')}
            </p>
            <Link href="/login">
              <a className={`${styles.button} px-8 py-3 rounded-full text-lg font-semibold inline-block`}>{t('about.getStarted')}</a>
            </Link>
          </div>
        </section>
      </main>

      <FooterLanding />
      </div>
    </>
  );
};

export default AboutPage;
