import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1a1a1a',
          color: 'white',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ color: '#ef4444' }}>❌ Application Error</h1>
          <p>Something went wrong while loading the application.</p>
          
          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', color: '#60a5fa' }}>Error Details</summary>
            <pre style={{ 
              background: '#000', 
              padding: '10px', 
              borderRadius: '4px',
              marginTop: '10px',
              overflow: 'auto'
            }}>
              {this.state.error?.stack}
            </pre>
          </details>

          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
