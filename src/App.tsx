/**
 * algo.viz — Main App
 * ====================
 * Handles three states:
 *   'idle'        — Search bar centered, no content yet
 *   'loading'     — Generating, spinner shown
 *   'animation'   — Three panel layout with animated visualization
 *   'explanation' — Full explanation panel
 *   'error'       — Error message with retry option
 */

import { useState, useRef } from 'react'
import { AnimationEngine } from './engine/engine'
import { SceneRenderer }   from './renderer/SceneRenderer'
import { generateConcept } from './api/api'
import type { IRDocument } from './ir/ir.types'

// =============================================================================
// TYPES
// =============================================================================

type AppState =
  | { status: 'idle' }
  | { status: 'loading'; concept: string }
  | { status: 'animation'; engine: AnimationEngine }
  | { status: 'explanation'; concept: string; text: string }
  | { status: 'error'; message: string }

// =============================================================================
// STYLES
// =============================================================================

const s: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0f0f0f', color: '#cdd6f4', fontFamily: 'monospace',
    overflow: 'hidden',
  },
  // Header
  header: {
    padding: '14px 24px', borderBottom: '1px solid #1e1e2e',
    display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0,
  },
  logo: { fontSize: '16px', fontWeight: '700', color: '#cdd6f4', margin: 0 },
  logoDot: { color: '#bd93f9' },

  // Search bar
  searchWrap: {
    display: 'flex', gap: '8px', flex: 1, maxWidth: '560px',
  },
  searchInput: {
    flex: 1, padding: '8px 14px', background: '#1e1e2e',
    border: '1px solid #313244', borderRadius: '8px',
    color: '#cdd6f4', fontSize: '13px', fontFamily: 'monospace',
    outline: 'none',
  },
  searchBtn: {
    padding: '8px 18px', background: '#bd93f9', color: '#0f0f0f',
    border: 'none', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '700', fontFamily: 'monospace',
    transition: 'opacity 0.2s',
  },

  // Idle state
  idle: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '16px',
  },
  idleTitle: {
    fontSize: '32px', fontWeight: '700', color: '#cdd6f4', margin: 0,
  },
  idleSubtitle: {
    fontSize: '14px', color: '#6272a4', margin: 0,
  },
  suggestions: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center',
    marginTop: '8px',
  },
  suggestion: {
    padding: '6px 14px', background: '#1e1e2e', border: '1px solid #313244',
    borderRadius: '20px', fontSize: '12px', color: '#bd93f9',
    cursor: 'pointer', transition: 'all 0.2s',
  },

  // Loading state
  loading: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '16px',
  },
  loadingText: { fontSize: '14px', color: '#6272a4', margin: 0 },
  spinner: {
    width: '32px', height: '32px', border: '3px solid #1e1e2e',
    borderTop: '3px solid #bd93f9', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  // Three panel layout
  panels: { display: 'flex', flex: 1, overflow: 'hidden' },
  codePanel: {
    width: '340px', minWidth: '280px', borderRight: '1px solid #1e1e2e',
    overflow: 'auto', padding: '20px 0', flexShrink: 0,
  },
  codePanelLabel: {
    fontSize: '10px', color: '#6272a4', textTransform: 'uppercase',
    letterSpacing: '0.1em', padding: '0 18px 10px',
  },
  codeLine: {
    display: 'block', padding: '2px 18px',
    fontSize: '12px', lineHeight: '1.85',
    transition: 'all 0.3s', whiteSpace: 'pre',
  },
  diagramPanel: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px', overflow: 'hidden',
  },
  explanationStrip: {
    borderTop: '1px solid #1e1e2e', padding: '16px 24px',
    display: 'flex', alignItems: 'center', gap: '16px',
    background: '#0d0d0d', minHeight: '84px', flexShrink: 0,
  },
  explanationText: {
    flex: 1, fontSize: '13px', color: '#cdd6f4',
    lineHeight: '1.7', margin: 0,
  },
  navBtn: {
    padding: '7px 18px', background: '#1e1e2e', color: '#cdd6f4',
    border: '1px solid #313244', borderRadius: '6px',
    cursor: 'pointer', fontSize: '12px', fontFamily: 'monospace',
    transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
  },
  stepBadge: {
    fontSize: '11px', color: '#6272a4', background: '#1e1e2e',
    padding: '3px 10px', borderRadius: '20px', border: '1px solid #313244',
    whiteSpace: 'nowrap', flexShrink: 0,
  },

  // Explanation panel
  explanationPanel: {
    flex: 1, overflow: 'auto', padding: '48px',
    display: 'flex', justifyContent: 'center',
  },
  explanationContent: {
    maxWidth: '680px', width: '100%',
  },
  explanationTitle: {
    fontSize: '22px', fontWeight: '700', color: '#cdd6f4',
    marginBottom: '24px',
  },
  explanationBody: {
    fontSize: '15px', color: '#cdd6f4', lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
  },

  // Error panel
  errorPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '12px',
  },
  errorText: { fontSize: '14px', color: '#ff5555', maxWidth: '480px', textAlign: 'center' },
}

// =============================================================================
// COMPONENT
// =============================================================================

const SUGGESTIONS = [
  'Binary Search',
  'Reverse a Linked List',
  'Bubble Sort',
  'Stack (push & pop)',
  'BFS on a graph',
  'Merge Sort',
]

export default function App() {
  const [appState, setAppState] = useState<AppState>({ status: 'idle' })
  const [engineState, setEngineState] = useState<ReturnType<AnimationEngine['getState']> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const engineRef = useRef<AnimationEngine | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  async function handleGenerate(concept: string) {
    const trimmed = concept.trim()
    if (!trimmed) return

    setSearchValue(trimmed)
    setAppState({ status: 'loading', concept: trimmed })

    const result = await generateConcept(trimmed)

    if (result.mode === 'error') {
      setAppState({ status: 'error', message: result.error })
      return
    }

    if (result.mode === 'explanation') {
      setAppState({ status: 'explanation', concept: trimmed, text: result.text })
      return
    }

    // Animation mode
    const engine = new AnimationEngine(result.document as IRDocument)
    engineRef.current = engine
    setEngineState(engine.getState())
    setAppState({ status: 'animation', engine })
  }

  function handleNext() {
    const engine = engineRef.current
    if (!engine) return
    engine.nextStep()
    setEngineState(engine.getState())
  }

  function handlePrev() {
    const engine = engineRef.current
    if (!engine) return
    engine.prevStep()
    setEngineState(engine.getState())
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleGenerate(searchValue)
  }

  function handleReset() {
    setAppState({ status: 'idle' })
    setSearchValue('')
    engineRef.current = null
    setEngineState(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  const activeLines = appState.status === 'animation'
    ? engineRef.current?.getActiveLines() ?? []
    : []

  const codeLines = appState.status === 'animation'
    ? engineRef.current?.getCode().split('\n') ?? []
    : []

  return (
    <div style={s.app}>
      {/* Spinner keyframe */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #bd93f9 !important; }
        button:hover:not(:disabled) { opacity: 0.85; }
        .suggestion:hover { background: #313244 !important; }
      `}</style>

      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div style={s.header}>
        <h1 style={s.logo} onClick={handleReset} role="button"
          title="Back to home" >
          algo<span style={s.logoDot}>.</span>viz
        </h1>

        <div style={s.searchWrap}>
          <input
            ref={inputRef}
            style={s.searchInput}
            placeholder="Try: Bubble Sort, BFS, Stack…"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={appState.status === 'loading'}
          />
          <button
            style={{
              ...s.searchBtn,
              opacity: appState.status === 'loading' ? 0.5 : 1,
              cursor: appState.status === 'loading' ? 'not-allowed' : 'pointer',
            }}
            onClick={() => handleGenerate(searchValue)}
            disabled={appState.status === 'loading'}
          >
            {appState.status === 'loading' ? '...' : 'Explain'}
          </button>
        </div>

        {/* Step badge — only in animation mode */}
        {appState.status === 'animation' && engineState && (
          <span style={s.stepBadge}>
            {engineState.isFirstStep
              ? 'Ready'
              : `Step ${engineState.currentStepIndex} / ${engineState.totalSteps}`}
          </span>
        )}

        {/* Reset button — not on idle */}
        {appState.status !== 'idle' && appState.status !== 'loading' && (
          <button onClick={handleReset} style={{
            ...s.navBtn, fontSize: '11px', padding: '5px 12px',
          }}>
            ← New
          </button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* IDLE STATE                                                           */}
      {/* ------------------------------------------------------------------ */}
      {appState.status === 'idle' && (
        <div style={s.idle}>
          <h2 style={s.idleTitle}>What do you want to learn?</h2>
          <p style={s.idleSubtitle}>
            Type any algorithm or concept — we'll animate it step by step.
          </p>
          <div style={s.suggestions}>
            {SUGGESTIONS.map(s => (
              <span
                key={s}
                className="suggestion"
                style={{
                  padding: '6px 14px', background: '#1e1e2e',
                  border: '1px solid #313244', borderRadius: '20px',
                  fontSize: '12px', color: '#bd93f9', cursor: 'pointer',
                }}
                onClick={() => handleGenerate(s)}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* LOADING STATE                                                        */}
      {/* ------------------------------------------------------------------ */}
      {appState.status === 'loading' && (
        <div style={s.loading}>
          <div style={s.spinner} />
          <p style={s.loadingText}>
            Generating animation for "{appState.concept}"…
          </p>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ANIMATION STATE — three panels                                       */}
      {/* ------------------------------------------------------------------ */}
      {appState.status === 'animation' && engineState && (
        <>
          <div style={s.panels}>
            {/* Code Panel */}
            <div style={s.codePanel}>
              <div style={s.codePanelLabel}>Code</div>
              <code>
                {codeLines.map((line, i) => {
                  const lineNum  = i + 1
                  const isActive = activeLines.includes(lineNum)
                  return (
                    <span key={lineNum} style={{
                      ...s.codeLine,
                      background:   isActive ? '#2a2a4a' : 'transparent',
                      color:        isActive ? '#f1fa8c' : '#6272a4',
                      borderLeft:   isActive ? '3px solid #f1fa8c' : '3px solid transparent',
                    }}>
                      <span style={{ color: '#44475a', marginRight: '14px', userSelect: 'none' }}>
                        {String(lineNum).padStart(2)}
                      </span>
                      {line}
                    </span>
                  )
                })}
              </code>
            </div>

            {/* Diagram Panel */}
            <div style={s.diagramPanel}>
              <SceneRenderer scene={engineState.currentScene} />
            </div>
          </div>

          {/* Explanation + Navigation Strip */}
          <div style={s.explanationStrip}>
            <button onClick={handlePrev} disabled={engineState.isFirstStep}
              style={{ ...s.navBtn, opacity: engineState.isFirstStep ? 0.35 : 1,
                cursor: engineState.isFirstStep ? 'not-allowed' : 'pointer' }}>
              ← Prev
            </button>
            <p style={s.explanationText}>
              {engineState.isFirstStep
                ? `Press Next to begin the ${engineRef.current?.getConcept()} walkthrough.`
                : engineState.currentStep?.explanation}
            </p>
            <button onClick={handleNext} disabled={engineState.isLastStep}
              style={{ ...s.navBtn, opacity: engineState.isLastStep ? 0.35 : 1,
                cursor: engineState.isLastStep ? 'not-allowed' : 'pointer' }}>
              Next →
            </button>
          </div>
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* EXPLANATION STATE                                                    */}
      {/* ------------------------------------------------------------------ */}
      {appState.status === 'explanation' && (
        <div style={s.explanationPanel}>
          <div style={s.explanationContent}>
            <h2 style={s.explanationTitle}>{appState.concept}</h2>
            <p style={s.explanationBody}>{appState.text}</p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* ERROR STATE                                                          */}
      {/* ------------------------------------------------------------------ */}
      {appState.status === 'error' && (
        <div style={s.errorPanel}>
          <p style={s.errorText}>{appState.message}</p>
          <button onClick={handleReset} style={s.navBtn}>Try again</button>
        </div>
      )}
    </div>
  )
}