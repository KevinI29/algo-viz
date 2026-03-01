/**
 * algo.viz — Idle Screen
 * ========================
 * Landing state with hero text and suggestion chips.
 */

import { SUGGESTIONS } from './types'

type IdleScreenProps = {
  onGenerate: (concept: string) => void
}

export function IdleScreen({ onGenerate }: IdleScreenProps) {
  return (
    <div className="fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '28px',
      position: 'relative', zIndex: 1,
    }}>
      {/* Center glow */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <h2 style={{
          fontSize: 42, fontWeight: 800, letterSpacing: '-0.03em',
          fontFamily: 'Syne, sans-serif',
          background: 'linear-gradient(135deg, #e2d9f3 0%, #9d6bff 50%, #c084fc 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 12,
        }}>
          What do you want to learn?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text3)', fontFamily: 'JetBrains Mono, monospace' }}>
          Type any algorithm or concept — we'll animate it step by step
        </p>
      </div>

      {/* Suggestion chips */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap',
        justifyContent: 'center', maxWidth: 600, zIndex: 1,
      }}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="chip" onClick={() => onGenerate(s)}>{s}</button>
        ))}
      </div>
    </div>
  )
}
