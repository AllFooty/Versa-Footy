import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQSection = () => {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqItems = [
    {
      question: 'Is Versa Footy suitable for beginners?',
      answer:
        "Yes, our app is designed for players of all skill levels, from beginners to advanced. Our algorithm considers each player's current skill level for various technical skills and adapts the training program accordingly, ensuring exercises are neither too easy nor too challenging.",
    },
    {
      question: 'How much time should my kid spend training each week?',
      answer:
        "Versa Footy adapts to your kid's available training time. The app allows you to set the session duration, and it will optimize the training plan accordingly. We recommend consistent practice for optimal skill development, but we recommend the following individual training times based on age:\n\nAges U-6 to U-7: ~90 minutes per week\nAges U-8 to U-11: ~135 minutes per week\nAges U-12 to U-14: ~180 minutes per week\n\nYou can spread this time across several shorter sessions throughout the week. The app will help you plan these sessions based on your kid's schedule.",
    },
    {
      question: 'Can Versa Footy replace team training?',
      answer:
        "No, Versa Footy is designed to complement team training, not replace it. Our app focuses on individual technical skills, providing personalized instruction that supplements traditional team-based coaching. This combination helps create well-rounded players with strong individual skills.",
    },
    {
      question: "How does Versa Footy track my kid's progress?",
      answer:
        "Versa Footy uses a comprehensive progress tracking system. After each session, your kid can input performance metrics for each exercise. The app then updates skill levels based on this data, using predefined performance thresholds. You'll be able to see improvements or declines per technical skill and for each foot.",
    },
    {
      question: "Is the training safe for young kids?",
      answer:
        "Yes, our training programs are designed with safety in mind. The app considers your kid's age and developmental stage, ensuring that all exercises are age-appropriate. The warm-up and cool-down portions of each session are also tailored to your kid's age group.",
    },
    {
      question: 'What equipment does my kid need to use for your training?',
      answer:
        'The app tailors exercises based on the equipment you have available. At a minimum, your kid will need a soccer ball and a small space to practice. You can input the available equipment, and the app will select compatible exercises for your kid\'s training sessions.',
    },
    {
      question: "How does Versa Footy's AI personalization work?",
      answer:
        "Our AI looks at several things to create a personal training plan:\n\n- Your kid's age and stage of development\n- Their skill levels for different soccer techniques, for each foot\n- Which foot is stronger and which is weaker\n- How much time they have to train\n- What equipment they have\n- Important periods for developing certain technical skills at their age\n\nThe AI then makes a training plan that works on areas where your kid needs to improve, while also keeping up their strengths.",
    },
    {
      question: 'Can Versa Footy help with weak foot development?',
      answer:
        'Yes! Versa Footy pays special attention to developing both feet. The app figures out which foot is weaker and gives it more practice time. Sometimes, up to 70% of the training can focus on the weaker foot to help it catch up.',
    },
    {
      question: "How does Versa Footy ensure my kid's development is versatile?",
      answer:
        "Versa Footy works on many different soccer skills that are right for your kid's age. It checks how good your kid is at each skill and plans training time based on what they need to work on most. This way, your kid improves in all areas, not just one or two.",
    },
    {
      question: 'Can Versa Footy adapt as my kid improves?',
      answer:
        "Yes, Versa Footy keeps changing as your kid gets better. After each training session, the app updates your kid's skill levels. Then, it adjusts future training plans, adding new, harder exercises when your kid is ready and mixing things up to keep it interesting.",
    },
    {
      question: 'How can parents or coaches be involved in the training process?',
      answer:
        "Parents and coaches can help by:\n\n- Making sure the information entered after training is accurate\n- Looking at the progress reports from the app\n- Encouraging regular use of the app\n- Providing more equipment if possible, to allow for more varied training\n- Practicing the skills learned from Versa Footy during team practice or casual play\n\nRemember, accurate inputs lead to better personalized training, bringing your kid closer to pro soccer.",
    },
    {
      question: "How is Versa Footy's AI based on science?",
      answer:
        "Versa Footy combines scientific knowledge with AI technology. The scientific part comes from research on how kids develop soccer skills at different ages. This forms the foundation of our training programs. The AI part then takes this scientific base and personalizes it for each kid. It looks at things like the kid's progress, how often they train, and which skills they're struggling with. This combination means each kid gets a scientifically-sound training program that's uniquely tailored to them.",
    },
  ];

  return (
    <div style={{ maxWidth: '768px', margin: '0 auto' }}>
      {faqItems.map((item, index) => (
        <motion.div 
          key={`faq-${index}`} 
          style={{ marginBottom: '16px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05 }}
        >
          <button
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '20px 24px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: openFAQ === index ? '16px 16px 0 0' : '16px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => toggleFAQ(index)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                color: '#ffffff',
                margin: 0,
              }}>
                {item.question}
              </h3>
              <svg
                style={{
                  width: '24px',
                  height: '24px',
                  color: '#6366f1',
                  transition: 'transform 0.3s ease',
                  transform: openFAQ === index ? 'rotate(180deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </button>
          <AnimatePresence>
            {openFAQ === index && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  padding: '20px 24px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '0 0 16px 16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderTop: 'none',
                }}>
                  <p style={{
                    fontSize: '16px',
                    lineHeight: '1.7',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}>
                    {item.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

export default FAQSection;

