import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary Caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          margin: '40px auto',
          maxWidth: '800px',
          background: 'rgba(20, 20, 20, 0.95)',
          color: '#ff6b6b',
          borderRadius: '12px',
          fontFamily: 'monospace',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 99999,
          position: 'relative'
        }}>
          <h2 style={{ borderBottom: '1px solid #ff6b6b', paddingBottom: '10px', marginTop: 0 }}>
            Application Crash Detected
          </h2>
          <p style={{ color: '#fff' }}>The application encountered an unexpected error while rendering this page.</p>
          <div style={{ background: '#000', padding: '20px', borderRadius: '8px', overflowX: 'auto', marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffb8b8' }}>{this.state.error && this.state.error.toString()}</h4>
            <pre style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#a5b4fc' }}>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard'}
            style={{
              marginTop: '30px',
              padding: '12px 24px',
              background: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
