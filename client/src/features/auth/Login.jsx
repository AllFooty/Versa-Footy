import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

const containerStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
  color: '#e5e7eb',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  padding: '32px',
};

const cardStyle = {
  width: '100%',
  maxWidth: 420,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '32px',
  boxShadow: '0 24px 70px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(10px)',
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  color: '#cbd5e1',
  fontWeight: 600,
  fontSize: 14,
};

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.03)',
  color: '#e5e7eb',
  fontSize: 16,
  marginBottom: 16,
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const otpInputStyle = {
  ...inputStyle,
  textAlign: 'center',
  fontSize: 24,
  letterSpacing: '0.5em',
  fontWeight: 600,
};

const buttonStyle = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(135deg, #2563eb, #22d3ee)',
  color: '#0b1020',
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
  boxShadow: '0 16px 40px rgba(34,211,238,0.35)',
  marginTop: 8,
  transition: 'transform 0.2s, box-shadow 0.2s',
};

const buttonDisabledStyle = {
  ...buttonStyle,
  opacity: 0.6,
  cursor: 'not-allowed',
  boxShadow: 'none',
};

const secondaryButtonStyle = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'transparent',
  color: '#94a3b8',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  marginTop: 12,
};

const errorStyle = {
  background: 'rgba(220, 38, 38, 0.15)',
  border: '1px solid rgba(220, 38, 38, 0.3)',
  borderRadius: 8,
  padding: '12px 14px',
  marginBottom: 16,
  color: '#fca5a5',
  fontSize: 14,
};

const successStyle = {
  background: 'rgba(34, 197, 94, 0.15)',
  border: '1px solid rgba(34, 197, 94, 0.3)',
  borderRadius: 8,
  padding: '12px 14px',
  marginBottom: 16,
  color: '#86efac',
  fontSize: 14,
};

const noteStyle = {
  fontSize: 14,
  color: '#94a3b8',
  marginTop: 16,
  lineHeight: 1.6,
  textAlign: 'center',
};

export default function Login() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('email'); // 'email', 'otp', or 'success'

  // Dev login state
  const [devPassword, setDevPassword] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resendTimerRef.current) clearInterval(resendTimerRef.current);
    };
  }, []);

  // Redirect if already authenticated
  // Send to /academy — AcademyProtectedRoute will redirect to /org/create if no org exists
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const timer = setTimeout(() => {
        setLocation('/home');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // If authenticated, show loading/redirect state
  if (isAuthenticated) {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ color: '#f1f5f9', fontSize: 20, margin: '0 0 8px 0' }}>
              {t('auth.successMessage')}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
              {t('common.redirecting')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (!email.trim()) {
      setError(t('errors.enterEmail'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('errors.invalidEmail'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(t('auth.checkEmailMessage'));
        setStep('otp');
      }
    } catch (err) {
      setError(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otpCode.trim()) {
      setError(t('errors.enterOtp'));
      return;
    }

    if (otpCode.length !== 6) {
      setError(t('errors.enterOtp6Digit'));
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.session) {
        // Show success state - the useEffect will handle redirect
        // when isAuthenticated updates
        setStep('success');
        setMessage(`${t('auth.successMessage')} ${t('common.redirecting')}`);
        // Don't set loading to false - keep showing loading state until redirect
      }
    } catch (err) {
      setError(t('errors.generic'));
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setOtpCode('');
    setError('');
    setMessage('');
  };

  const handleResendCode = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(t('auth.newCodeSentMessage'));
        setResendCooldown(30);
        resendTimerRef.current = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(resendTimerRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setError(t('errors.resendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: devPassword,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data.session) {
        setStep('success');
        setMessage(`${t('auth.successMessage')} ${t('common.redirecting')}`);
      }
    } catch (err) {
      setError(t('errors.generic'));
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {step !== 'success' && (
          <>
            <p style={{ 
              textTransform: 'uppercase', 
              letterSpacing: '0.25em', 
              fontSize: 11, 
              margin: 0, 
              color: '#64748b' 
            }}>
              {step === 'email' ? t('auth.signInLabel') : t('auth.verifyLabel')}
            </p>
            
            <h1 style={{ margin: '8px 0 8px 0', fontSize: 24, color: '#f1f5f9' }}>
              {step === 'email' ? t('auth.welcomeTitle') : t('auth.enterCodeTitle')}
            </h1>
            
            <p style={{ 
              color: '#94a3b8', 
              fontSize: 14, 
              marginBottom: 24, 
              lineHeight: 1.5 
            }}>
              {step === 'email'
                ? t('auth.emailPrompt')
                : t('auth.otpPrompt', { email })
              }
            </p>
          </>
        )}

        {error && <div style={errorStyle}>{error}</div>}
        {message && step !== 'success' && <div style={successStyle}>{message}</div>}

        {step === 'success' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p style={{ color: '#86efac', fontSize: 15, margin: 0, fontWeight: 500 }}>
              {t('auth.successMessage')}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 14, margin: '8px 0 0 0' }}>
              {t('common.redirecting')}
            </p>
          </div>
        ) : step === 'email' ? (
          <form onSubmit={handleSendOtp}>
            <label style={labelStyle} htmlFor="email">
              {t('auth.emailLabel')}
            </label>
            <input
              style={inputStyle}
              id="email"
              name="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              autoFocus
            />

            <button 
              style={loading ? buttonDisabledStyle : buttonStyle} 
              type="submit"
              disabled={loading}
            >
              {loading ? t('auth.sendingCodeButton') : t('auth.sendCodeButton')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <label style={labelStyle} htmlFor="otp">
              {t('auth.otpLabel')}
            </label>
            <input
              style={otpInputStyle}
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              placeholder={t('auth.otpPlaceholder')}
              value={otpCode}
              onChange={(e) => {
                // Only allow digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(value);
              }}
              disabled={loading}
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
            />

            <button 
              style={loading ? buttonDisabledStyle : buttonStyle} 
              type="submit"
              disabled={loading}
            >
              {loading ? t('auth.verifyingButton') : t('auth.signInButton')}
            </button>

            <button
              type="button"
              style={loading || resendCooldown > 0 ? { ...secondaryButtonStyle, opacity: 0.5, cursor: 'not-allowed' } : secondaryButtonStyle}
              onClick={handleResendCode}
              disabled={loading || resendCooldown > 0}
            >
              {resendCooldown > 0 ? t('auth.resendCooldown', { seconds: resendCooldown }) : t('auth.resendCodeButton')}
            </button>

            <button 
              type="button"
              style={{ ...secondaryButtonStyle, border: 'none', marginTop: 8 }}
              onClick={handleBackToEmail}
              disabled={loading}
            >
              {t('auth.useDifferentEmail')}
            </button>
          </form>
        )}

        {step !== 'success' && !import.meta.env.PROD && (
          <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
            <button
              type="button"
              onClick={() => setShowDevLogin(!showDevLogin)}
              style={{
                background: 'none', border: 'none', color: '#f97316',
                fontSize: 12, cursor: 'pointer', fontWeight: 600,
                letterSpacing: '0.05em', width: '100%', textAlign: 'center',
              }}
            >
              {showDevLogin ? `▾ ${t('auth.devLoginHide')}` : `▸ ${t('auth.devLoginShow')}`}
            </button>
            {showDevLogin && (
              <form onSubmit={handleDevLogin} style={{ marginTop: 12 }}>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="demo+liam@versafooty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <input
                  style={inputStyle}
                  type="password"
                  placeholder={t('auth.devPasswordPlaceholder')}
                  value={devPassword}
                  onChange={(e) => setDevPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  style={loading ? buttonDisabledStyle : { ...buttonStyle, background: 'linear-gradient(135deg, #f97316, #eab308)' }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? t('auth.devSigningIn') : t('auth.devSignInButton')}
                </button>
              </form>
            )}
          </div>
        )}

        {step !== 'success' && (
          <p style={noteStyle}>
            <Link href="/" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              {t('auth.backToHome')}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
