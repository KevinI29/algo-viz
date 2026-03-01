/**
 * algo.viz — Error Screen
 * =========================
 * Displays errors with user-friendly messaging and a retry button.
 */

type ErrorScreenProps = {
  message: string
  onReset: () => void
}

/**
 * Translate developer-facing error messages to user-friendly ones.
 */
function friendlyMessage(raw: string): { title: string; detail: string } {
  if (raw.includes('timed out')) {
    return {
      title: 'Taking too long',
      detail: 'The AI is taking longer than expected. Try again or try a simpler concept.',
    }
  }
  if (raw.includes('validation') || raw.includes('invalid')) {
    return {
      title: 'Couldn\'t visualize that',
      detail: 'The AI generated something we couldn\'t render. Try rephrasing or pick a different concept.',
    }
  }
  if (raw.includes('JSON') || raw.includes('parse')) {
    return {
      title: 'Unexpected response',
      detail: 'The AI returned an unexpected format. This sometimes happens — try again.',
    }
  }
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('Network')) {
    return {
      title: 'Connection issue',
      detail: 'Couldn\'t reach the server. Make sure the backend is running.',
    }
  }
  return {
    title: 'Something went wrong',
    detail: raw,
  }
}

export function ErrorScreen({ message, onReset }: ErrorScreenProps) {
  const { title, detail } = friendlyMessage(message)

  return (
    <div className="fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 1,
    }}>
      <div style={{
        padding: '24px 32px', borderRadius: 12,
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        maxWidth: 480, textAlign: 'center',
      }}>
        <p style={{
          fontSize: 15, fontWeight: 700, color: '#fca5a5',
          fontFamily: 'Syne, sans-serif', marginBottom: 8,
        }}>
          {title}
        </p>
        <p style={{
          fontSize: 12, color: 'var(--text2)',
          fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7,
        }}>
          {detail}
        </p>
      </div>
      <button onClick={onReset} className="nav-btn">← Try again</button>
    </div>
  )
}
