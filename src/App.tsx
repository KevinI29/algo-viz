/**
 * algo.viz — Main App (Full Redesign)
 * Cinematic dark intelligence aesthetic
 * Deep space blacks, electric purple accents, glassmorphism panels
 */

import { useState, useRef, useEffect } from 'react'
import { AnimationEngine } from './engine/engine'
import { SceneRenderer }   from './renderer/SceneRenderer'
import { generateConcept } from './api/api'
import { ErrorBoundary }   from './components/ErrorBoundary'
import type { IRDocument } from './ir/ir.types'

// =============================================================================
// SYNTAX HIGHLIGHTER
// Tokenizes a single code line into colored spans.
// =============================================================================

const PY_KEYWORDS = new Set([
  'def','class','return','if','elif','else','for','while','in','not','and','or',
  'is','None','True','False','import','from','pass','break','continue','lambda',
  'with','as','yield','try','except','finally','raise','del','global','nonlocal',
])
const PY_BUILTINS = new Set([
  'range','len','print','list','dict','set','int','str','float','bool',
  'enumerate','zip','map','filter','sorted','reversed','min','max','sum','abs',
  'type','isinstance','append','extend','pop',
])
const JS_KEYWORDS = new Set([
  'const','let','var','function','return','if','else','for','while','do',
  'switch','case','break','continue','new','delete','typeof','instanceof',
  'in','of','class','extends','import','export','default','null','undefined',
  'true','false','try','catch','finally','throw','async','await','this','super',
])
const JS_BUILTINS = new Set([
  'console','Array','Object','Map','Set','Math','parseInt','parseFloat',
  'Promise','JSON','Number','String','Boolean',
])

type Token = { text: string; color: string }

function tokenizeLine(line: string, language: string): Token[] {
  const keywords = language === 'python' ? PY_KEYWORDS : JS_KEYWORDS
  const builtins  = language === 'python' ? PY_BUILTINS  : JS_BUILTINS
  const tokens: Token[] = []
  let i = 0
  while (i < line.length) {
    // Comment
    if (line[i] === '#' && language === 'python') {
      tokens.push({ text: line.slice(i), color: 'var(--syn-comment)' }); break
    }
    if (line[i] === '/' && line[i+1] === '/' && language !== 'python') {
      tokens.push({ text: line.slice(i), color: 'var(--syn-comment)' }); break
    }
    // String
    if (line[i] === '"' || line[i] === "'") {
      const q = line[i]; let j = i + 1
      while (j < line.length && line[j] !== q) { if (line[j] === '\\') j++; j++ }
      j++
      tokens.push({ text: line.slice(i, j), color: 'var(--syn-string)' })
      i = j; continue
    }
    // Number
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_]/.test(line[i-1]))) {
      let j = i
      while (j < line.length && /[\d._]/.test(line[j])) j++
      tokens.push({ text: line.slice(i, j), color: 'var(--syn-number)' })
      i = j; continue
    }
    // Identifier
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < line.length && /\w/.test(line[j])) j++
      const word = line.slice(i, j)
      const color = keywords.has(word) ? 'var(--syn-keyword)'
                  : builtins.has(word)  ? 'var(--syn-builtin)'
                  : /^[A-Z]/.test(word) ? 'var(--syn-builtin)'
                  : 'var(--syn-variable)'
      tokens.push({ text: word, color })
      i = j; continue
    }
    // Punctuation / operator
    tokens.push({ text: line[i], color: 'var(--syn-default)' })
    i++
  }
  return tokens
}

function SyntaxLine({ line, language }: { line: string; language: string }) {
  if (!line.trim()) return <span>&nbsp;</span>
  return <>{tokenizeLine(line, language).map((t, idx) => (
    <span key={idx} style={{ color: t.color }}>{t.text}</span>
  ))}</>
}

type AppState =
  | { status: 'idle' }
  | { status: 'loading'; concept: string }
  | { status: 'animation'; engine: AnimationEngine }
  | { status: 'explanation'; concept: string; text: string }
  | { status: 'error'; message: string }

const SUGGESTIONS = [
  'Binary Search', 'Reverse a Linked List', 'Bubble Sort',
  'Stack push & pop', 'BFS on a graph', 'Merge Sort',
  'Quick Sort', 'Two Sum',
]

export default function App() {
  const [appState, setAppState]     = useState<AppState>({ status: 'idle' })
  const [engineState, setEngineState] = useState<ReturnType<AnimationEngine['getState']> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const engineRef = useRef<AnimationEngine | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const abortRef  = useRef<AbortController | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleGenerate(concept: string) {
    const trimmed = concept.trim()
    if (!trimmed) return

    // Cancel any in-flight request before starting a new one
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearchValue(trimmed)
    setAppState({ status: 'loading', concept: trimmed })
    const result = await generateConcept(trimmed, controller.signal)

    // If this request was cancelled, do nothing — a newer request is in charge
    if (result.mode === 'aborted') return

    if (result.mode === 'error') { setAppState({ status: 'error', message: result.error }); return }
    if (result.mode === 'explanation') { setAppState({ status: 'explanation', concept: trimmed, text: result.text }); return }
    const engine = new AnimationEngine(result.document as IRDocument)
    engineRef.current = engine
    setEngineState(engine.getState())
    setAppState({ status: 'animation', engine })
  }

  function handleNext() {
    const e = engineRef.current; if (!e) return
    e.nextStep(); setEngineState(e.getState())
  }
  function handlePrev() {
    const e = engineRef.current; if (!e) return
    e.prevStep(); setEngineState(e.getState())
  }
  function handleReset() {
    abortRef.current?.abort() // Cancel any in-flight request on reset
    setAppState({ status: 'idle' }); setSearchValue('')
    engineRef.current = null; setEngineState(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }
  function handleKey(ev: React.KeyboardEvent) {
    if (ev.key === 'Enter') handleGenerate(searchValue)
  }

  // ── Keyboard navigation: arrow keys to step through animation ──
  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      // Don't capture if user is typing in the search input
      if (document.activeElement?.tagName === 'INPUT') return
      if (appState.status !== 'animation') return

      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault()
        handleNext()
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault()
        handlePrev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const activeLines = engineRef.current?.getActiveLines() ?? []
  const codeLines   = engineRef.current?.getCode().split('\n') ?? []
  const codeLanguage = engineRef.current?.getLanguage() ?? 'python'
  const isAnim      = appState.status === 'animation' && engineState

  return (
    <ErrorBoundary onReset={handleReset}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          /* ── Tokyo Night ── */
          --bg:          #1a1b26;
          --bg2:         #1f2335;
          --bg3:         #24283b;
          --surface:     rgba(31, 35, 53, 0.92);
          --surface2:    rgba(36, 40, 59, 0.95);
          --border:      rgba(65, 72, 104, 0.35);
          --border2:     rgba(65, 72, 104, 0.65);

          /* accent */
          --purple:      #9d7cd8;
          --purple2:     #bb9af7;
          --purple3:     #c0caf5;

          /* teal */
          --teal:        #73daca;
          --teal2:       #b4f9f8;

          /* text */
          --text:        #c0caf5;
          --text2:       #a9b1d6;
          --text3:       #565f89;

          /* syntax */
          --syn-keyword:  #bb9af7;   /* def, for, if, return */
          --syn-builtin:  #7dcfff;   /* range, len, print    */
          --syn-string:   #9ece6a;   /* "hello"              */
          --syn-number:   #ff9e64;   /* 42, 3.14             */
          --syn-comment:  #565f89;   /* # comment            */
          --syn-variable: #e0af68;   /* identifiers          */
          --syn-default:  #a9b1d6;   /* everything else      */

          /* code active line */
          --code-active-bg:   rgba(187, 154, 247, 0.10);
          --code-active-bar:  #bb9af7;

          --radius:      12px;
          --radius-sm:   8px;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Syne', sans-serif;
          height: 100vh;
          overflow: hidden;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .fade-in { animation: fadeIn 0.5s ease forwards; }

        /* Search input focus ring */
        .search-input:focus { outline: none; border-color: var(--purple) !important; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }

        /* Suggestion chips */
        .chip {
          padding: 6px 14px;
          background: rgba(124, 58, 237, 0.08);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 20px;
          font-size: 12px;
          color: var(--purple3);
          cursor: pointer;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .chip:hover {
          background: rgba(124, 58, 237, 0.18);
          border-color: var(--purple2);
          color: #fff;
          transform: translateY(-1px);
        }

        /* Nav buttons */
        .nav-btn {
          padding: 9px 22px;
          background: rgba(26, 20, 46, 0.9);
          color: var(--text2);
          border: 1px solid var(--border2);
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 12px;
          font-family: 'JetBrains Mono', monospace;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-btn:hover:not(:disabled) {
          background: rgba(124, 58, 237, 0.15);
          border-color: var(--purple2);
          color: var(--text);
        }
        .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Code line hover */
        .code-line:hover { background: rgba(124, 58, 237, 0.06) !important; }

        /* Explain button */
        .explain-btn {
          padding: 10px 22px;
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: #fff;
          border: none;
          border-radius: var(--radius-sm);
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          letter-spacing: 0.03em;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 20px rgba(124, 58, 237, 0.3);
        }
        .explain-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(124, 58, 237, 0.45);
        }
        .explain-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: 'var(--bg)', overflow: 'hidden', position: 'relative',
      }}>

        {/* ── Ambient background glow ── */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(157,124,216,0.07) 0%, transparent 70%)',
        }} />

        {/* ================================================================ */}
        {/* HEADER                                                            */}
        {/* ================================================================ */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '14px 24px', flexShrink: 0, position: 'relative', zIndex: 10,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(6, 4, 15, 0.8)',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Logo */}
          <button onClick={handleReset} style={{
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
              onChange={e => setSearchValue(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              disabled={appState.status === 'loading'}
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                color: 'var(--text)', fontSize: 13, fontFamily: 'JetBrains Mono, monospace',
                padding: '7px 0',
              }}
            />
            <button
              className="explain-btn"
              onClick={() => handleGenerate(searchValue)}
              disabled={appState.status === 'loading'}
            >
              {appState.status === 'loading' ? '···' : 'Explain →'}
            </button>
          </div>

          {/* Step counter */}
          {isAnim && (
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
          {isAnim && (
            <div style={{
              padding: '5px 12px', borderRadius: 20,
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              fontSize: 11, color: 'var(--teal2)',
              fontFamily: 'JetBrains Mono, monospace',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {engineRef.current?.getConcept()}
            </div>
          )}

          {/* New button */}
          {appState.status !== 'idle' && appState.status !== 'loading' && (
            <button onClick={handleReset} className="nav-btn" style={{ fontSize: 11, padding: '5px 14px' }}>
              ← New
            </button>
          )}
        </header>

        {/* ================================================================ */}
        {/* IDLE                                                              */}
        {/* ================================================================ */}
        {appState.status === 'idle' && (
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
                <button key={s} className="chip" onClick={() => handleGenerate(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* LOADING                                                           */}
        {/* ================================================================ */}
        {appState.status === 'loading' && (
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
              <p style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'JetBrains Mono, monospace', marginBottom: 4 }}>
                Generating animation for
              </p>
              <p style={{
                fontSize: 16, fontWeight: 700, color: 'var(--purple3)',
                fontFamily: 'Syne, sans-serif',
              }}>
                "{appState.concept}"
              </p>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ANIMATION — three panels                                          */}
        {/* ================================================================ */}
        {isAnim && (
          <div className="fade-in" style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>

            {/* ── Code Panel ── */}
            <div style={{
              width: 320, minWidth: 260, flexShrink: 0,
              borderRight: '1px solid var(--border)',
              background: 'var(--surface)',
              backdropFilter: 'blur(20px)',
              overflow: 'auto', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '14px 18px 10px',
                fontSize: 10, fontWeight: 600, letterSpacing: '0.12em',
                color: 'var(--text3)', textTransform: 'uppercase',
                borderBottom: '1px solid var(--border)',
                fontFamily: 'Syne, sans-serif',
              }}>
                Source Code
              </div>
              <div style={{ padding: '12px 0', flex: 1 }}>
                {codeLines.map((line, i) => {
                  const ln       = i + 1
                  const isActive = activeLines.includes(ln)
                  return (
                    <div key={ln} className="code-line" style={{
                      display: 'flex', alignItems: 'stretch',
                      background: isActive ? 'var(--code-active-bg)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--code-active-bar)' : '2px solid transparent',
                      transition: 'all 0.25s',
                    }}>
                      <span style={{
                        width: 36, textAlign: 'right', paddingRight: 12,
                        fontSize: 11, lineHeight: '1.85',
                        color: isActive ? 'rgba(187,154,247,0.7)' : 'var(--text3)',
                        fontFamily: 'JetBrains Mono, monospace',
                        userSelect: 'none', flexShrink: 0,
                        transition: 'color 0.25s',
                      }}>
                        {ln}
                      </span>
                      <span style={{
                        fontSize: 12, lineHeight: '1.85', whiteSpace: 'pre',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontWeight: isActive ? '700' : '400',
                        transition: 'font-weight 0.2s',
                        paddingRight: 16,
                      }}>
                        <SyntaxLine line={line} language={codeLanguage} />
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Diagram Panel ── */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '32px', overflow: 'hidden',
              background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(76,29,149,0.06) 0%, transparent 70%)',
            }}>
              <SceneRenderer scene={engineState.currentScene} />
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* EXPLANATION STATE                                                 */}
        {/* ================================================================ */}
        {appState.status === 'explanation' && (
          <div className="fade-in" style={{
            flex: 1, overflow: 'auto', padding: '48px 24px',
            display: 'flex', justifyContent: 'center', zIndex: 1,
          }}>
            <div style={{ maxWidth: 680, width: '100%' }}>
              <h2 style={{
                fontSize: 28, fontWeight: 800, marginBottom: 24,
                fontFamily: 'Syne, sans-serif', letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #e2d9f3, #9d6bff)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                {appState.concept}
              </h2>
              <p style={{
                fontSize: 15, color: 'var(--text2)', lineHeight: '1.85',
                whiteSpace: 'pre-wrap', fontFamily: 'JetBrains Mono, monospace',
              }}>
                {appState.text}
              </p>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ERROR STATE                                                       */}
        {/* ================================================================ */}
        {appState.status === 'error' && (
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
              <p style={{ fontSize: 13, color: '#fca5a5', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.7 }}>
                {appState.message}
              </p>
            </div>
            <button onClick={handleReset} className="nav-btn">← Try again</button>
          </div>
        )}

        {/* ================================================================ */}
        {/* EXPLANATION STRIP — shown only in animation mode                 */}
        {/* ================================================================ */}
        {isAnim && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '16px',
            padding: '16px 24px', flexShrink: 0,
            borderTop: '1px solid var(--border)',
            background: 'rgba(6, 4, 15, 0.9)',
            backdropFilter: 'blur(20px)',
            minHeight: 80, zIndex: 10,
          }}>
            <button onClick={handlePrev} disabled={engineState.isFirstStep} className="nav-btn">
              ← Prev
            </button>

            <p style={{
              flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              {engineState.isFirstStep
                ? <span style={{ color: 'var(--text3)' }}>
                    Press <span style={{ color: 'var(--purple3)' }}>Next →</span> to begin the walkthrough
                  </span>
                : engineState.currentStep?.explanation}
            </p>

            <button onClick={handleNext} disabled={engineState.isLastStep} className="nav-btn">
              Next →
            </button>

            <span style={{
              fontSize: 10, color: 'var(--text3)',
              fontFamily: 'JetBrains Mono, monospace',
              opacity: 0.6,
            }}>
              ← → keys
            </span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}