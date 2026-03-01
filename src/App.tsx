/**
 * Study AI — Main App
 * =====================
 * Single-column layout: visualization → explanation → code.
 * Matches the "Study AI" design language.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { AnimationEngine } from './engine/engine'
import { generateConcept } from './api/api'
import { ErrorBoundary }   from './components/ErrorBoundary'
import { Header }          from './components/Header'
import { IdleScreen }      from './components/IdleScreen'
import { LoadingScreen }   from './components/LoadingScreen'
import { ErrorScreen }     from './components/ErrorScreen'
import { ExplanationView } from './components/ExplanationView'
import { SceneRenderer }   from './renderer/SceneRenderer'
import { tokenizeLine }    from './lib/syntaxHighlighter'
import type { AppState }   from './components/types'
import type { IRDocument } from './ir/ir.types'
import './styles/global.css'

const AUTO_PLAY_SPEEDS = [2000, 3000, 5000] as const
type SpeedIndex = 0 | 1 | 2

export default function App() {
  const [appState, setAppState]       = useState<AppState>({ status: 'idle' })
  const [engineState, setEngineState] = useState<ReturnType<AnimationEngine['getState']> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [isPlaying, setIsPlaying]     = useState(false)
  const [speedIndex, setSpeedIndex]   = useState<SpeedIndex>(1)
  const [showCode, setShowCode]       = useState(false)
  const engineRef   = useRef<AnimationEngine | null>(null)
  const abortRef    = useRef<AbortController | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Auto-play ──

  const clearAutoPlay = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const handleNext = useCallback(() => {
    const e = engineRef.current; if (!e) return
    const advanced = e.nextStep()
    setEngineState(e.getState())
    if (!advanced) { setIsPlaying(false); clearAutoPlay() }
  }, [clearAutoPlay])

  useEffect(() => {
    clearAutoPlay()
    if (isPlaying && appState.status === 'animation') {
      intervalRef.current = setInterval(handleNext, AUTO_PLAY_SPEEDS[speedIndex])
    }
    return clearAutoPlay
  }, [isPlaying, speedIndex, appState.status, handleNext, clearAutoPlay])

  // ── Handlers ──

  async function handleGenerate(concept: string) {
    const trimmed = concept.trim()
    if (!trimmed) return
    abortRef.current?.abort()
    setIsPlaying(false); clearAutoPlay()
    const controller = new AbortController()
    abortRef.current = controller
    setSearchValue(trimmed)
    setAppState({ status: 'loading', concept: trimmed })
    const result = await generateConcept(trimmed, controller.signal)
    if (result.mode === 'aborted') return
    if (result.mode === 'error')      { setAppState({ status: 'error', message: result.error }); return }
    if (result.mode === 'explanation') { setAppState({ status: 'explanation', concept: trimmed, text: result.text }); return }
    const engine = new AnimationEngine(result.document as IRDocument)
    engineRef.current = engine
    setEngineState(engine.getState())
    setAppState({ status: 'animation', engine })
    setShowCode(false)
  }

  function handlePrev() {
    const e = engineRef.current; if (!e) return
    setIsPlaying(false); clearAutoPlay()
    e.prevStep(); setEngineState(e.getState())
  }
  function handleGoToStep(index: number) {
    const e = engineRef.current; if (!e) return
    setIsPlaying(false); clearAutoPlay()
    e.goToStep(index); setEngineState(e.getState())
  }
  function handleReset() {
    abortRef.current?.abort()
    setIsPlaying(false); clearAutoPlay()
    setAppState({ status: 'idle' }); setSearchValue('')
    engineRef.current = null; setEngineState(null)
  }
  function handleTogglePlay() {
    if (!engineState) return
    if (engineState.isLastStep) {
      const e = engineRef.current; if (!e) return
      e.goToStep(0); setEngineState(e.getState())
      setIsPlaying(true); return
    }
    setIsPlaying(prev => !prev)
  }
  function handleCycleSpeed() {
    setSpeedIndex(prev => ((prev + 1) % 3) as SpeedIndex)
  }

  // ── Keyboard ──

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT') return
      if (appState.status !== 'animation') return
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault(); setIsPlaying(false); clearAutoPlay(); handleNext()
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault(); handlePrev()
      } else if (ev.key === ' ') {
        ev.preventDefault(); handleTogglePlay()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // ── Derived ──

  const activeLines  = engineRef.current?.getActiveLines() ?? []
  const codeLines    = engineRef.current?.getCode().split('\n') ?? []
  const codeLanguage = engineRef.current?.getLanguage() ?? 'python'
  const isAnim       = appState.status === 'animation' && engineState
  const concept      = engineRef.current?.getConcept() ?? null
  const { currentStepIndex = 0, totalSteps = 0, isFirstStep = true, isLastStep = false, currentStep = null } = engineState ?? {}

  // ── Render ──

  return (
    <ErrorBoundary onReset={handleReset}>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: 'var(--bg)', overflow: 'hidden', position: 'relative',
      }}>
        <Header
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onGenerate={handleGenerate}
          onReset={handleReset}
          isLoading={appState.status === 'loading'}
          isAnimating={appState.status === 'animation'}
          showNewButton={appState.status !== 'idle' && appState.status !== 'loading'}
          engineState={engineState}
          concept={concept}
        />

        {appState.status === 'idle' && (
          <IdleScreen onGenerate={handleGenerate} />
        )}

        {appState.status === 'loading' && (
          <LoadingScreen concept={appState.concept} />
        )}

        {appState.status === 'error' && (
          <ErrorScreen message={appState.message} onReset={handleReset} />
        )}

        {appState.status === 'explanation' && (
          <ExplanationView concept={appState.concept} text={appState.text} />
        )}

        {/* ================================================================ */}
        {/* ANIMATION — Single-column scrolling layout                       */}
        {/* ================================================================ */}
        {isAnim && (
          <div className="fade-in" style={{
            flex: 1, overflow: 'auto', zIndex: 1,
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '24px 24px 120px',
          }}>
            {/* Section heading */}
            <h2 style={{
              fontSize: 28, fontWeight: 700, color: '#e2e8f0',
              fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
              marginBottom: 32, alignSelf: 'flex-start', maxWidth: 720,
              width: '100%', margin: '0 auto 24px',
            }}>
              How does it work?
            </h2>

            {/* Visualization */}
            <div style={{
              width: '100%', maxWidth: 720,
              display: 'flex', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <SceneRenderer scene={engineState.currentScene} />
            </div>

            {/* Explanation text */}
            <div style={{
              width: '100%', maxWidth: 720,
              marginBottom: 24,
            }}>
              <p style={{
                fontSize: 14, color: 'var(--text2)', lineHeight: 1.8,
                fontFamily: 'JetBrains Mono, monospace',
                minHeight: 48,
              }}>
                {isFirstStep
                  ? <span style={{ color: 'var(--text3)' }}>
                      Press <span style={{ color: 'var(--teal)' }}>▶</span> or <span style={{ color: 'var(--teal)' }}>&gt;</span> to begin the walkthrough
                    </span>
                  : currentStep?.explanation}
              </p>
            </div>

            {/* Navigation controls */}
            <div style={{
              width: '100%', maxWidth: 720,
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: 32,
            }}>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                {Array.from({ length: totalSteps + 1 }, (_, i) => (
                  <button
                    key={i}
                    className="step-dot"
                    data-active={i === currentStepIndex ? 'true' : undefined}
                    data-visited={i < currentStepIndex ? 'true' : undefined}
                    onClick={() => handleGoToStep(i)}
                    title={i === 0 ? 'Initial state' : `Step ${i}`}
                  />
                ))}
              </div>

              {/* Play/speed */}
              <button
                onClick={handleTogglePlay}
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : isLastStep ? '↻' : '▶'}
              </button>
              <button onClick={handleCycleSpeed} className="speed-btn" title="Speed">
                {AUTO_PLAY_SPEEDS[speedIndex] / 1000}s
              </button>

              {/* < > navigation */}
              <button onClick={handlePrev} disabled={isFirstStep} className="arrow-nav">
                &lt;
              </button>
              <button onClick={handleNext} disabled={isLastStep} className="arrow-nav">
                &gt;
              </button>
            </div>

            {/* Code section (collapsible) */}
            <div style={{ width: '100%', maxWidth: 720, marginBottom: 32 }}>
              <button
                onClick={() => setShowCode(!showCode)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 22, fontWeight: 700, color: '#e2e8f0',
                  fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
                  padding: '12px 0', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Code Implementation
                <span style={{
                  fontSize: 14, color: 'var(--text3)',
                  transform: showCode ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  display: 'inline-block',
                }}>▼</span>
              </button>

              {showCode && (
                <div className="fade-in" style={{
                  background: 'rgba(22, 20, 35, 0.9)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '20px 0',
                  marginTop: 8,
                }}>
                  {codeLines.map((line, i) => {
                    const ln = i + 1
                    const isActive = activeLines.includes(ln)
                    return (
                      <div key={ln} style={{
                        display: 'flex', alignItems: 'stretch',
                        background: isActive ? 'rgba(115,218,202,0.08)' : 'transparent',
                        borderLeft: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                        transition: 'all 0.25s',
                        padding: '0 20px',
                      }}>
                        <span style={{
                          width: 32, textAlign: 'right', paddingRight: 14,
                          fontSize: 12, lineHeight: '1.85',
                          color: isActive ? 'rgba(115,218,202,0.7)' : 'var(--text3)',
                          fontFamily: 'JetBrains Mono, monospace',
                          userSelect: 'none', flexShrink: 0,
                        }}>
                          {ln}
                        </span>
                        <span style={{
                          fontSize: 13, lineHeight: '1.85', whiteSpace: 'pre',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: isActive ? '700' : '400',
                          color: isActive ? 'var(--teal2)' : undefined,
                        }}>
                          {line.trim() ? (
                            tokenizeLine(line, codeLanguage).map((t, idx) => (
                              <span key={idx} style={{ color: isActive ? undefined : t.color }}>{t.text}</span>
                            ))
                          ) : '\u00A0'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}