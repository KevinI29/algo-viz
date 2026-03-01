/**
 * algo.viz — Header
 * ==================
 * Persistent top bar with logo, search input, and animation state badges.
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

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: '16px',
      padding: '14px 24px', flexShrink: 0, position: 'relative', zIndex: 10,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(6, 4, 15, 0.8)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Logo */}
      <button onClick={onReset} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '6px', padding: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(124,58,237,0.4)',
          fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif',
        }}>A</div>
        <span style={{
          fontSize: 15, fontWeight: 800, color: 'var(--text)',
          fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
        }}>
          algo<span style={{ color: 'var(--purple2)' }}>.</span>viz
        </span>
      </button>

      {/* Search bar */}
      <div style={{
        flex: 1, maxWidth: 560, display: 'flex', gap: '8px',
        background: 'rgba(18, 14, 32, 0.9)',
        border: `1px solid ${inputFocused ? 'var(--purple)' : 'var(--border)'}`,
        borderRadius: 10, padding: '3px 3px 3px 14px',
        transition: 'all 0.2s',
        boxShadow: inputFocused ? '0 0 0 3px rgba(124,58,237,0.12)' : 'none',
      }}>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Ask anything… Binary Search, Heaps, BFS, Recursion"
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          disabled={isLoading}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
            padding: '7px 0',
          }}
        />
        <button
          className="explain-btn"
          onClick={() => onGenerate(searchValue)}
          disabled={isLoading}
        >
          {isLoading ? '···' : 'Explain →'}
        </button>
      </div>

      {/* Step counter */}
      {isAnimating && engineState && (
        <div style={{
          padding: '5px 12px', borderRadius: 20,
          background: 'rgba(124,58,237,0.1)',
          border: '1px solid rgba(124,58,237,0.25)',
          fontSize: 11, color: 'var(--purple3)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {engineState.isFirstStep ? 'ready' : `${engineState.currentStepIndex} / ${engineState.totalSteps}`}
        </div>
      )}

      {/* Concept badge */}
      {isAnimating && concept && (
        <div style={{
          padding: '5px 12px', borderRadius: 20,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          fontSize: 11, color: 'var(--teal2)',
          fontFamily: 'JetBrains Mono, monospace',
          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {concept}
        </div>
      )}

      {/* New button */}
      {showNewButton && (
        <button onClick={onReset} className="nav-btn" style={{ fontSize: 11, padding: '5px 14px' }}>
          ← New
        </button>
      )}
    </header>
  )
}
