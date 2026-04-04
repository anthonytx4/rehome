import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#ef4444' }}>Something went wrong.</h1>
          <p>The application crashed unexpectedly. Please try refreshing the page.</p>
          <pre style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'inline-block', marginTop: '20px', fontSize: '0.8rem', textAlign: 'left' }}>
            {this.state.error?.toString()}
          </pre>
          <div style={{ marginTop: '24px' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
