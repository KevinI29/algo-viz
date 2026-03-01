/**
 * algo.viz — Loading Screen
 * ===========================
 * Spinner with the concept name being generated.
 */

type LoadingScreenProps = {
  concept: string
}

export function LoadingScreen({ concept }: LoadingScreenProps) {
  return (
    <div className="fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px', zIndex: 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2.5px solid rgba(124,58,237,0.2)',
        borderTop: '2.5px solid #9d6bff',
        animation: 'spin 0.75s linear infinite',
      }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 13, color: 'var(--text2)',
          fontFamily: 'JetBrains Mono, monospace', marginBottom: 4,
        }}>
          Generating animation for
        </p>
        <p style={{
          fontSize: 16, fontWeight: 700, color: 'var(--purple3)',
          fontFamily: 'Syne, sans-serif',
        }}>
          "{concept}"
        </p>
      </div>
    </div>
  )
}
