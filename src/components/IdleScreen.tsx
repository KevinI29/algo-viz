/**
 * Study AI — Idle Screen
 * ========================
 * "What are we learning today?" with centered search bar
 * and suggestion chips below.
 */

import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'Binary Search', 'Bubble Sort', 'Reverse a Linked List',
  'Stack push & pop', 'BFS on a graph', 'Quick Sort',
  'Merge Sort', 'Two Sum',
]

const CATEGORIES = ['Code', 'Math', 'DSA', 'Systems']

type IdleScreenProps = {
  onGenerate: (concept: string) => void
}

export function IdleScreen({ onGenerate }: IdleScreenProps) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter' && value.trim()) onGenerate(value.trim())
  }

  return (
    <div className="fade-in" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '32px', zIndex: 1, padding: '0 24px',
      marginTop: '-60px', // visually center against full height
    }}>
      {/* Heading */}
      <h1 style={{
        fontSize: 32, fontWeight: 600, color: '#e2e8f0',
        fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
        textAlign: 'center',
      }}>
        What are we learning today<span style={{ color: 'var(--teal)' }}>?</span>
      </h1>

      {/* Search bar */}
      <div style={{
        width: '100%', maxWidth: 600, display: 'flex', gap: '0',
        background: 'rgba(30, 28, 42, 0.9)',
        border: `1.5px solid ${focused ? 'rgba(115,218,202,0.4)' : 'rgba(65,72,104,0.4)'}`,
        borderRadius: 28, padding: '4px 6px 4px 22px',
        transition: 'all 0.25s',
        boxShadow: focused ? '0 0 0 4px rgba(115,218,202,0.08)' : '0 2px 20px rgba(0,0,0,0.2)',
      }}>
        <input
          ref={inputRef}
          placeholder="Type any algorithm or concept — we'll animate it step by step"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
            padding: '12px 0',
          }}
        />
        <button
          className="explain-btn"
          onClick={() => value.trim() && onGenerate(value.trim())}
          style={{ borderRadius: 22, padding: '10px 24px', fontSize: 13 }}
        >
          Explain →
        </button>
      </div>

      {/* Category chips */}
      <div style={{
        display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center',
      }}>
        {CATEGORIES.map(cat => (
          <button key={cat} className="category-chip">
            {cat}
          </button>
        ))}
      </div>

      {/* Suggestion chips */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 600,
      }}>
        {SUGGESTIONS.map(s => (
          <button key={s} className="chip" onClick={() => onGenerate(s)}>
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}