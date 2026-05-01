import React from 'react';
import { withTranslation } from 'react-i18next';

/**
 * Error Boundary component to catch React rendering errors
 * Prevents blank white screens by showing a fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    const { t } = this.props;
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app-gradient)',
            color: '#e5e7eb',
            fontFamily: 'var(--font-sans)',
            padding: 24,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: 400,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-2xl)',
              padding: 32,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
              {t('errors.somethingWentWrong')}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {t('errors.errorDescription')}
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'var(--gradient-brand)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {t('errors.refreshPage')}
            </button>
            {import.meta.env.DEV && this.state.error && (
              <pre
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 12,
                  textAlign: 'left',
                  overflow: 'auto',
                  color: '#f87171',
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default withTranslation()(ErrorBoundary);
