/**
 * Study AI — Header
 * ==================
 * Minimal header with "Study AI" branding.
 * Shows search bar only during idle/loading states.
 */

import { useState, useRef, useEffect } from 'react'
import type { EngineSnapshot } from './types'

type HeaderProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  onGenerate: (concept: string) => void
  onReset: () => void
  isLoading: boolean
  isAnimating: boolean
  showNewButton: boolean
  engineState: EngineSnapshot | null
  concept: string | null
}

export function Header({
  searchValue, onSearchChange, onGenerate, onReset,
  isLoading, isAnimating, showNewButton, engineState, concept,
}: HeaderProps) {
  const [inputFocused, setInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter') onGenerate(searchValue)
  }

  const showSearch = !isAnimating;

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '16px 28px', flexShrink: 0, position: 'relative', zIndex: 10,
    }}>
      {/* Logo */}
      <button onClick={onReset} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'baseline', gap: '6px', padding: 0,
      }}>
        <span style={{
          fontSize: 20, fontWeight: 600, color: 'var(--text2)',
          fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em',
        }}>
          Study
        </span>
        <span style={{
          fontSize: 20, fontWeight: 800, color: '#ffffff',
          fontFamily: 'Syne, sans-serif', letterSpacing: '-0.01em',
        }}>
          AI
        </span>
      </button>

      <div style={{ flex: 1 }} />

      {/* Inline search during non-animation states */}
      {showSearch && (
        <div style={{
          maxWidth: 420, display: 'flex', gap: '8px',
          background: 'rgba(18, 14, 32, 0.8)',
          border: `1px solid ${inputFocused ? 'var(--purple)' : 'var(--border)'}`,
          borderRadius: 24, padding: '3px 3px 3px 16px',
          transition: 'all 0.2s',
          boxShadow: inputFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
        }}>
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search concepts…"
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            disabled={isLoading}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: 'var(--text)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
              padding: '6px 0', minWidth: 180,
            }}
          />
          <button
            className="explain-btn"
            onClick={() => onGenerate(searchValue)}
            disabled={isLoading}
            style={{ borderRadius: 20, padding: '8px 18px', fontSize: 12 }}
          >
            {isLoading ? '···' : 'Go →'}
          </button>
        </div>
      )}

      {/* Back button during animation */}
      {showNewButton && (
        <button onClick={onReset} className="nav-btn" style={{
          fontSize: 12, padding: '6px 16px', borderRadius: 20,
        }}>
          ← New topic
        </button>
      )}

      {/* Step badge */}
      {isAnimating && engineState && !engineState.isFirstStep && (
        <div className="header-badge" style={{
          padding: '5px 14px', borderRadius: 20,
          background: 'rgba(115,218,202,0.08)',
          border: '1px solid rgba(115,218,202,0.2)',
          fontSize: 11, color: 'var(--teal2)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {engineState.currentStepIndex} / {engineState.totalSteps}
        </div>
      )}
    </header>
  )
}