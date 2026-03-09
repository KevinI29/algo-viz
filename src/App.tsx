/**
 * Study AI — App (v2)
 * =====================
 * Full pipeline:
 *   User types concept → classify → /api/teach → LessonPlan
 *   → simulator → template mapper → AnimationTimeline → renderer
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { fetchLessonPlan } from './api/teach'
import { looksLikeCode, detectLanguage } from './router/classify'
import { runLessonPlan } from './simulator/runner'
import { compileTimeline } from './templates/registry'
import { useAnimationPlayer } from './engine/useAnimationPlayer'
import { SceneRenderer } from './renderer/v2/SceneRenderer'
import { PlaybackControls } from './renderer/v2/PlaybackControls'
import { tokenizeLine } from './lib/syntaxHighlighter'
import type { LessonPlan } from './router/types'
import type { AnimationTimeline } from './templates/types'
import './styles/global.css'

// =============================================================================
// APP STATE
// =============================================================================

type AppState =
  | { status: 'idle' }
  | { status: 'loading'; concept: string }
  | { status: 'animation'; plan: LessonPlan; timeline: AnimationTimeline }
  | { status: 'text'; plan: LessonPlan }
  | { status: 'error'; message: string }

// =============================================================================
// SUGGESTIONS
// =============================================================================

const SUGGESTIONS = [
  'Bubble Sort', 'Insertion Sort', 'BFS on a binary tree',
  'Find middle of linked list', 'Valid Parentheses',
  'Selection Sort', 'DFS pre-order', 'Reverse a linked list',
]

const CATEGORIES = ['Sorting', 'Trees', 'Linked Lists', 'Stacks']

// =============================================================================
// APP COMPONENT
// =============================================================================

export default function App() {
  const [appState, setAppState] = useState<AppState>({ status: 'idle' })
  const [searchValue, setSearchValue] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const player = useAnimationPlayer()

  useEffect(() => { inputRef.current?.focus() }, [])

  // ── Generate ──

  const handleGenerate = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setSearchValue(trimmed)
    setAppState({ status: 'loading', concept: trimmed })
    setShowCode(false)

    const inputType = looksLikeCode(trimmed) ? 'code' : 'concept'
    const result = await fetchLessonPlan(trimmed, inputType, ctrl.signal)

    if ('aborted' in result) return
    if (!result.ok) {
      setAppState({ status: 'error', message: result.error })
      return
    }

    const plan = result.plan

    // Text-only response?
    if ((plan as any).textOnly || plan.codePosition === 'none') {
      setAppState({ status: 'text', plan })
      return
    }

    // Has simulator? Run it
    if (plan.simulator) {
      const events = runLessonPlan(plan)
      if (!events) {
        setAppState({ status: 'error', message: `Simulator "${plan.simulator}" failed to run` })
        return
      }
      const timeline = compileTimeline(plan, events)
      player.load(timeline)
      setAppState({ status: 'animation', plan, timeline })
      return
    }

    // No simulator — would need Pyodide (Phase 4)
    // For now, show as text explanation
    setAppState({ status: 'text', plan })
  }, [player])

  // ── Reset ──

  const handleReset = useCallback(() => {
    abortRef.current?.abort()
    setAppState({ status: 'idle' })
    setSearchValue('')
    player.reset()
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [player])

  // ── Keyboard ──

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (appState.status !== 'animation') return
      if (e.key === ' ') { e.preventDefault(); player.togglePlay() }
      if (e.key === 'ArrowRight') { e.preventDefault(); player.nextFrame() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); player.prevFrame() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── Derived ──

  const frame = player.state.currentFrame
  const isAnim = appState.status === 'animation'
  const plan = isAnim ? appState.plan : appState.status === 'text' ? appState.plan : null

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#1a1b26', color: '#c0caf5', overflow: 'hidden',
    }}>
      {/* ── Header ── */}
      <header style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px', flexShrink: 0, zIndex: 10,
      }}>
        <button onClick={handleReset} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#a9b1d6', fontFamily: 'Syne, sans-serif' }}>Study</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif' }}>AI</span>
        </button>
        <div style={{ flex: 1 }} />

        {/* New topic button when not idle */}
        {appState.status !== 'idle' && appState.status !== 'loading' && (
          <button onClick={handleReset} className="nav-btn" style={{ borderRadius: 20, padding: '6px 16px', fontSize: 12 }}>
            ← New topic
          </button>
        )}

        {/* Step counter */}
        {isAnim && !player.state.isFirstFrame && (
          <div style={{
            padding: '5px 14px', borderRadius: 20,
            background: 'rgba(115,218,202,0.08)',
            border: '1px solid rgba(115,218,202,0.2)',
            fontSize: 11, color: '#b4f9f8',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {player.state.currentFrameIndex + 1} / {player.state.totalFrames}
          </div>
        )}
      </header>

      {/* ── Idle Screen ── */}
      {appState.status === 'idle' && (
        <div className="fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 28, padding: '0 24px', marginTop: -60,
        }}>
          <h1 style={{
            fontSize: 30, fontWeight: 600, color: '#e2e8f0',
            fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
          }}>
            What are we learning today<span style={{ color: '#73daca' }}>?</span>
          </h1>

          <div style={{
            width: '100%', maxWidth: 580, display: 'flex',
            background: 'rgba(30,28,42,0.9)',
            border: `1.5px solid ${inputFocused ? 'rgba(115,218,202,0.4)' : 'rgba(65,72,104,0.4)'}`,
            borderRadius: 28, padding: '4px 6px 4px 22px',
            transition: 'all 0.25s',
            boxShadow: inputFocused ? '0 0 0 4px rgba(115,218,202,0.08)' : '0 2px 20px rgba(0,0,0,0.2)',
          }}>
            <input
              ref={inputRef}
              placeholder="Type a concept, algorithm, or paste code..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate(searchValue)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: '#c0caf5', fontSize: 14, fontFamily: 'JetBrains Mono, monospace',
                padding: '12px 0',
              }}
            />
            <button
              className="explain-btn"
              onClick={() => handleGenerate(searchValue)}
              style={{ borderRadius: 22, padding: '10px 24px', fontSize: 13 }}
            >
              Explain →
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 580 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="chip" onClick={() => handleGenerate(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {appState.status === 'loading' && (
        <div className="fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2.5px solid rgba(115,218,202,0.2)',
            borderTop: '2.5px solid #73daca',
            animation: 'spin 0.75s linear infinite',
          }} />
          <p style={{ fontSize: 13, color: '#a9b1d6', fontFamily: 'JetBrains Mono, monospace' }}>
            Planning lesson for <span style={{ color: '#73daca', fontWeight: 700 }}>"{appState.concept}"</span>
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {appState.status === 'error' && (
        <div className="fade-in" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16,
        }}>
          <div style={{
            padding: '24px 32px', borderRadius: 12,
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            maxWidth: 480, textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>
              {appState.message}
            </p>
          </div>
          <button onClick={handleReset} className="nav-btn">← Try again</button>
        </div>
      )}

      {/* ── Text Explanation ── */}
      {appState.status === 'text' && plan && (
        <div className="fade-in" style={{
          flex: 1, overflow: 'auto', padding: '40px 24px',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ maxWidth: 680, width: '100%' }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700, marginBottom: 16,
              fontFamily: 'Syne, sans-serif', color: '#e2e8f0',
            }}>
              {plan.concept}
            </h2>
            <p style={{
              fontSize: 14, color: '#a9b1d6', lineHeight: 1.85,
              fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap',
            }}>
              {plan.setupExplanation}
            </p>
            {plan.insightText && (
              <div style={{
                marginTop: 24, padding: '16px 20px', borderRadius: 10,
                background: 'rgba(115,218,202,0.06)', border: '1px solid rgba(115,218,202,0.15)',
              }}>
                <p style={{ fontSize: 13, color: '#73daca', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>
                  {plan.insightText}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Animation ── */}
      {isAnim && frame && (
        <div className="fade-in" style={{
          flex: 1, overflow: 'auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '20px 24px 120px',
        }}>
          {/* Title */}
          <h2 style={{
            fontSize: 26, fontWeight: 700, color: '#e2e8f0',
            fontFamily: 'Syne, sans-serif', marginBottom: 6,
          }}>
            {appState.plan.title || appState.plan.concept}
          </h2>

          {/* Setup explanation */}
          <p style={{
            fontSize: 13, color: '#a9b1d6', marginBottom: 20,
            fontFamily: 'JetBrains Mono, monospace',
            maxWidth: 600, textAlign: 'center', lineHeight: 1.7,
          }}>
            {appState.plan.setupExplanation}
          </p>

          {/* Animation area — code alongside or visualization only */}
          <div style={{
            width: '100%', maxWidth: 900,
            display: 'flex', gap: 20, marginBottom: 12,
          }}>
            {/* Code panel (alongside mode) */}
            {appState.plan.codePosition === 'alongside' && appState.plan.code && (
              <div style={{
                width: 300, flexShrink: 0,
                background: 'rgba(22,20,35,0.9)',
                border: '1px solid rgba(65,72,104,0.35)',
                borderRadius: 12, padding: '16px 0',
                overflow: 'auto', maxHeight: 340,
              }}>
                <div style={{
                  padding: '0 16px 10px', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.1em', color: '#565f89', textTransform: 'uppercase',
                  fontFamily: 'Syne, sans-serif', borderBottom: '1px solid rgba(65,72,104,0.25)',
                  marginBottom: 8,
                }}>
                  Source Code
                </div>
                {appState.plan.code.source.split('\n').map((line, i) => {
                  const ln = i + 1
                  const isActive = frame.codeLine === ln
                  return (
                    <div key={ln} style={{
                      display: 'flex', padding: '0 16px',
                      background: isActive ? 'rgba(115,218,202,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid #73daca' : '2px solid transparent',
                      transition: 'all 0.25s',
                    }}>
                      <span style={{
                        width: 28, textAlign: 'right', paddingRight: 10,
                        fontSize: 11, lineHeight: '1.85',
                        color: isActive ? 'rgba(115,218,202,0.7)' : '#3b4261',
                        fontFamily: 'JetBrains Mono, monospace',
                        userSelect: 'none', flexShrink: 0,
                      }}>{ln}</span>
                      <span style={{
                        fontSize: 12, lineHeight: '1.85', whiteSpace: 'pre',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: isActive ? 700 : 400,
                      }}>
                        {line.trim() ? tokenizeLine(line, appState.plan.code!.language).map((t, idx) => (
                          <span key={idx} style={{ color: isActive ? '#b4f9f8' : t.color }}>{t.text}</span>
                        )) : '\u00A0'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Visualization */}
            <div style={{ flex: 1 }}>
              <SceneRenderer
                frame={frame}
                template={appState.plan.visualTemplate}
              />
            </div>
          </div>

          {/* Step explanation */}
          <div style={{ width: '100%', maxWidth: 900, minHeight: 44, marginBottom: 8 }}>
            <p style={{
              fontSize: 13, color: '#a9b1d6', lineHeight: 1.8,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {frame.explanation ?? ''}
            </p>
          </div>

          {/* Playback controls */}
          <div style={{ width: '100%', maxWidth: 900 }}>
            <PlaybackControls
              state={player.state}
              onTogglePlay={player.togglePlay}
              onNext={player.nextFrame}
              onPrev={player.prevFrame}
              onGoToFrame={player.goToFrame}
              onSetSpeed={player.setSpeed}
            />
          </div>

          {/* Code section (after mode) — collapsible */}
          {appState.plan.codePosition === 'after' && appState.plan.code && (
            <div style={{ width: '100%', maxWidth: 900, marginTop: 24 }}>
              <button
                onClick={() => setShowCode(!showCode)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 20, fontWeight: 700, color: '#e2e8f0',
                  fontFamily: 'Syne, sans-serif', padding: '12px 0',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Code Implementation
                <span style={{
                  fontSize: 13, color: '#565f89',
                  transform: showCode ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s', display: 'inline-block',
                }}>▼</span>
              </button>

              {showCode && (
                <div className="fade-in" style={{
                  background: 'rgba(22,20,35,0.9)',
                  border: '1px solid rgba(65,72,104,0.35)',
                  borderRadius: 12, padding: '16px 0', marginTop: 8,
                }}>
                  {appState.plan.code.source.split('\n').map((line, i) => {
                    const ln = i + 1
                    return (
                      <div key={ln} style={{ display: 'flex', padding: '0 20px' }}>
                        <span style={{
                          width: 28, textAlign: 'right', paddingRight: 12,
                          fontSize: 12, lineHeight: '1.85', color: '#3b4261',
                          fontFamily: 'JetBrains Mono, monospace',
                          userSelect: 'none', flexShrink: 0,
                        }}>{ln}</span>
                        <span style={{
                          fontSize: 13, lineHeight: '1.85', whiteSpace: 'pre',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {line.trim() ? tokenizeLine(line, appState.plan.code!.language).map((t, idx) => (
                            <span key={idx} style={{ color: t.color }}>{t.text}</span>
                          )) : '\u00A0'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Insight / complexity note */}
          {appState.plan.insightText && (
            <div style={{
              width: '100%', maxWidth: 900, marginTop: 20,
              padding: '14px 20px', borderRadius: 10,
              background: 'rgba(115,218,202,0.05)',
              border: '1px solid rgba(115,218,202,0.12)',
            }}>
              <p style={{ fontSize: 12, color: '#73daca', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>
                💡 {appState.plan.insightText}
                {appState.plan.complexityNote && (
                  <span style={{ color: '#565f89' }}> — {appState.plan.complexityNote}</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Keyframe animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}