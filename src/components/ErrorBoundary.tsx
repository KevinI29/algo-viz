/**
 * algo.viz — Error Boundary
 * ==========================
 * Catches rendering errors anywhere in the component tree
 * and shows a recovery UI instead of a white screen.
 *
 * React Error Boundaries must be class components — this is
 * the only class component in the project.
 */

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Caught rendering error:', error);
    console.error('[ErrorBoundary] Component stack:', info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100vh', background: '#1a1b26', color: '#c0caf5',
          fontFamily: "'JetBrains Mono', monospace", gap: '16px',
          padding: '24px',
        }}>
          <div style={{
            padding: '24px 32px', borderRadius: 12,
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            maxWidth: 520, textAlign: 'center',
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fca5a5', marginBottom: 12,
              fontFamily: "'Syne', sans-serif",
            }}>
              Something went wrong
            </p>
            <p style={{ fontSize: 12, color: '#a9b1d6', lineHeight: 1.7, marginBottom: 8 }}>
              A rendering error occurred. This usually means the AI generated
              an unexpected format. Try a different concept or click below to reset.
            </p>
            <p style={{ fontSize: 11, color: '#565f89', lineHeight: 1.5 }}>
              {this.state.error?.message}
            </p>
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: '9px 22px',
              background: 'rgba(26, 20, 46, 0.9)',
              color: '#a9b1d6',
              border: '1px solid rgba(65, 72, 104, 0.65)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ← Reset & try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}