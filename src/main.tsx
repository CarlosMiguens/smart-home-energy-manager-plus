import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '32px 20px',
            color: '#f8f9fa',
            backgroundColor: '#081c15',
            minHeight: '100vh',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', background: '#11281f', padding: '30px', borderRadius: '16px', border: '1px solid rgba(116, 198, 157, 0.2)' }}>
            <h2 style={{ color: '#52b788', marginBottom: '12px', fontSize: '1.4rem' }}>
              Smart Home Energy Manager Plus
            </h2>
            <p style={{ color: '#c9d6cf', marginBottom: '16px', fontSize: '0.95rem' }}>
              Ocorreu uma instabilidade ao inicializar a interface local.
            </p>
            <pre
              style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.8rem',
                color: '#f87171',
                textAlign: 'left',
                maxHeight: '180px',
              }}
            >
              {this.state.error?.toString()}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                backgroundColor: '#2d6a4f',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
