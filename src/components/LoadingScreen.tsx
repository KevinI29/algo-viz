/**
 * algo.viz — Loading Screen
 * ===========================
 * Spinner with concept name and cycling tips to keep user engaged.
 */

import { useState, useEffect } from 'react'

const TIPS = [
  'Analyzing the algorithm structure…',
  'Generating step-by-step walkthrough…',
  'Building the visual scene…',
  'Crafting educational explanations…',
  'Synchronizing code highlights…',
]

type LoadingScreenProps = {
  concept: string
}

export function LoadingScreen({ concept }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '24px', zIndex: 1,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2.5px solid rgba(124,58,237,0.2)',
        borderTop: '2.5px solid #9d6bff',
        animation: 'spin 0.75s linear infinite',
      }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontSize: 16, fontWeight: 700, color: 'var(--purple3)',
          fontFamily: 'Syne, sans-serif', marginBottom: 8,
        }}>
          "{concept}"
        </p>
        <p key={tipIndex} className="fade-in" style={{
          fontSize: 12, color: 'var(--text3)',
          fontFamily: 'JetBrains Mono, monospace',
          minHeight: 18,
        }}>
          {TIPS[tipIndex]}
        </p>
      </div>
    </div>
  )
}