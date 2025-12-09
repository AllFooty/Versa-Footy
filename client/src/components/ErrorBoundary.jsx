import React from 'react';

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
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at 10% 20%, #0b1020, #050910 60%, #02060f)',
            color: '#e5e7eb',
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            padding: 24,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              maxWidth: 400,
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24, lineHeight: 1.6 }}>
              The app encountered an error. This can happen due to network issues or browser settings.
              Please try refreshing the page.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 8,
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

export default ErrorBoundary;
