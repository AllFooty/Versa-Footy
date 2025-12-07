import React from 'react';
import { motion } from 'framer-motion';

const WengerQuote = () => {
  return (
    <section className="wenger-quote-section">
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(ellipse at 15% 30%, rgba(99, 102, 241, 0.12) 0%, transparent 50%), radial-gradient(ellipse at 85% 70%, rgba(255, 209, 102, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      <div className="wenger-container">
        <motion.div
          className="wenger-flex-container"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
        >
          {/* Author Image */}
          <motion.div
            className="wenger-image-container"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="wenger-image-wrapper">
              <img
                src="/images/wenger.jpg"
                alt="Arsène Wenger"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </motion.div>

          {/* Quote Content */}
          <motion.blockquote
            className="wenger-quote-container"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Quote Icon */}
            <svg className="wenger-quote-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>

            {/* Quote Text */}
            <p className="wenger-quote-text">
              You build a player like you build a house. First comes the basement; the base of the
              player is the technique. You get that between seven and fourteen years of age.
              <span className="wenger-highlight">
                If you have no technical skill at fourteen, you can forget it; you can never be a
                football player.
              </span>
            </p>

            {/* Author Info */}
            <footer className="wenger-author-container">
              <div className="wenger-author-name">Arsène Wenger</div>
              <div className="wenger-author-title">
                Former Arsenal Manager & FIFA Chief of Global Football Development
              </div>
            </footer>
          </motion.blockquote>
        </motion.div>
      </div>

      {/* Responsive styles */}
      <style>{`
        .wenger-quote-section {
          background: linear-gradient(135deg, #1a2b47 0%, #0f172a 60%, #1e1b4b 100%);
          padding: 60px 24px;
          position: relative;
          overflow: hidden;
        }
        
        .wenger-container {
          max-width: 1100px;
          margin: 0 auto;
        }
        
        .wenger-flex-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }
        
        .wenger-image-container {
          position: relative;
          flex-shrink: 0;
        }
        
        .wenger-image-wrapper {
          width: 160px;
          height: 160px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          border: 3px solid rgba(255, 255, 255, 0.1);
        }
        
        .wenger-quote-container {
          text-align: center;
          flex: 1;
          margin: 0;
        }
        
        .wenger-quote-icon {
          width: 36px;
          height: 36px;
          color: rgba(255, 209, 102, 0.8);
          margin-bottom: 16px;
        }
        
        .wenger-quote-text {
          font-size: 18px;
          line-height: 1.7;
          color: rgba(255, 255, 255, 0.95);
          font-style: italic;
          font-weight: 400;
          margin: 0 0 16px 0;
        }
        
        .wenger-highlight {
          color: #ffd166;
          font-weight: 600;
          font-size: 19px;
          display: block;
          margin-top: 12px;
          text-shadow: 0 0 20px rgba(255, 209, 102, 0.3);
        }
        
        .wenger-author-container {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 2px solid rgba(255, 209, 102, 0.2);
          display: inline-block;
        }
        
        .wenger-author-name {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        
        .wenger-author-title {
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        @media (min-width: 768px) {
          .wenger-quote-section {
            padding: 60px 32px;
          }
          
          .wenger-flex-container {
            flex-direction: row;
            align-items: center;
            gap: 48px;
          }
          
          .wenger-image-wrapper {
            width: 180px;
            height: 180px;
          }
          
          .wenger-quote-container {
            text-align: left;
          }
          
          .wenger-quote-icon {
            width: 40px;
            height: 40px;
          }
          
          .wenger-quote-text {
            font-size: 20px;
          }
          
          .wenger-highlight {
            font-size: 21px;
          }
          
          .wenger-author-container {
            display: block;
          }
        }
        
        @media (min-width: 1024px) {
          .wenger-image-wrapper {
            width: 200px;
            height: 200px;
          }
          
          .wenger-quote-text {
            font-size: 22px;
            line-height: 1.8;
          }
          
          .wenger-highlight {
            font-size: 23px;
          }
        }
      `}</style>
    </section>
  );
};

export default WengerQuote;
