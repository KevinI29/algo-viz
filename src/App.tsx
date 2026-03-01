/**
 * algo.viz — Main App
 * =====================
 * State machine + router. All visual components are imported.
 * This file manages state transitions and delegates rendering.
 */

import { useState, useRef, useEffect } from 'react'
import { AnimationEngine } from './engine/engine'
import { generateConcept } from './api/api'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Header }          from './components/Header'
import { IdleScreen }      from './components/IdleScreen'
import { LoadingScreen }   from './components/LoadingScreen'
import { ErrorScreen }     from './components/ErrorScreen'
import { ExplanationView } from './components/ExplanationView'
import { CodePanel }       from './components/CodePanel'
import { DiagramPanel }    from './components/DiagramPanel'
import { StepControls }    from './components/StepControls'
import type { AppState }   from './components/types'
import type { IRDocument } from './ir/ir.types'
import './styles/global.css'

export default function App() {
  const [appState, setAppState]       = useState<AppState>({ status: 'idle' })
  const [engineState, setEngineState] = useState<ReturnType<AnimationEngine['getState']> | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const engineRef = useRef<AnimationEngine | null>(null)
  const abortRef  = useRef<AbortController | null>(null)

  // ── Handlers ──

  async function handleGenerate(concept: string) {
    const trimmed = concept.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setSearchValue(trimmed)
    setAppState({ status: 'loading', concept: trimmed })
    const result = await generateConcept(trimmed, controller.signal)

    if (result.mode === 'aborted') return
    if (result.mode === 'error')       { setAppState({ status: 'error', message: result.error }); return }
    if (result.mode === 'explanation')  { setAppState({ status: 'explanation', concept: trimmed, text: result.text }); return }

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
  function handleGoToStep(index: number) {
    const e = engineRef.current; if (!e) return
    e.goToStep(index); setEngineState(e.getState())
  }
  function handleReset() {
    abortRef.current?.abort()
    setAppState({ status: 'idle' }); setSearchValue('')
    engineRef.current = null; setEngineState(null)
  }

  // ── Keyboard navigation ──

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (document.activeElement?.tagName === 'INPUT') return
      if (appState.status !== 'animation') return

      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault(); handleNext()
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault(); handlePrev()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // ── Derived state ──

  const activeLines  = engineRef.current?.getActiveLines() ?? []
  const codeLines    = engineRef.current?.getCode().split('\n') ?? []
  const codeLanguage = engineRef.current?.getLanguage() ?? 'python'
  const isAnim       = appState.status === 'animation' && engineState
  const concept      = engineRef.current?.getConcept() ?? null

  // ── Render ──

  return (
    <ErrorBoundary onReset={handleReset}>
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh',
        background: 'var(--bg)', overflow: 'hidden', position: 'relative',
      }}>
        {/* Ambient background glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(157,124,216,0.07) 0%, transparent 70%)',
        }} />

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

        {isAnim && (
          <div className="fade-in" style={{ display: 'flex', flex: 1, overflow: 'hidden', zIndex: 1 }}>
            <CodePanel
              codeLines={codeLines}
              activeLines={activeLines}
              language={codeLanguage}
            />
            <DiagramPanel scene={engineState.currentScene} />
          </div>
        )}

        {isAnim && (
          <StepControls
            engineState={engineState}
            onPrev={handlePrev}
            onNext={handleNext}
            onGoToStep={handleGoToStep}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
