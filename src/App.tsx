/**
 * algo.viz — Main App
 * ====================
 * Three panel layout:
 * Left  — Code panel with line highlighting
 * Right — Scene renderer (visual diagram)
 * Bottom strip — Explanation + navigation
 */

import { useState } from 'react'
import { AnimationEngine } from './engine/engine'
import { linkedListFixture } from './ir/linkedList.fixture'
import { SceneRenderer } from './renderer/SceneRenderer'

// =============================================================================
// ENGINE — instantiated once outside component
// =============================================================================
const engine = new AnimationEngine(linkedListFixture)

// =============================================================================
// STYLES
// =============================================================================
const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: '#0f0f0f', color: '#cdd6f4', fontFamily: 'monospace',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 28px', borderBottom: '1px solid #1e1e2e',
    display: 'flex', alignItems: 'center', gap: '16px',
  },
  title: { fontSize: '18px', fontWeight: '700', color: '#cdd6f4', margin: 0 },
  stepBadge: {
    fontSize: '12px', color: '#6272a4', background: '#1e1e2e',
    padding: '4px 10px', borderRadius: '20px', border: '1px solid #313244',
  },
  panels: { display: 'flex', flex: 1, overflow: 'hidden' },
  codePanel: {
    width: '380px', minWidth: '320px', borderRight: '1px solid #1e1e2e',
    overflow: 'auto', padding: '24px 0',
  },
  codePanelTitle: {
    fontSize: '11px', color: '#6272a4', textTransform: 'uppercase',
    letterSpacing: '0.1em', padding: '0 20px 12px',
  },
  codeLine: {
    display: 'block', padding: '2px 20px',
    fontSize: '13px', lineHeight: '1.8',
    transition: 'background 0.3s, color 0.3s',
    whiteSpace: 'pre',
  },
  diagramPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: '32px',
    overflow: 'hidden',
  },
  explanationStrip: {
    borderTop: '1px solid #1e1e2e', padding: '20px 28px',
    display: 'flex', alignItems: 'center', gap: '20px',
    background: '#0d0d0d', minHeight: '88px',
  },
  explanationText: {
    flex: 1, fontSize: '14px', color: '#cdd6f4',
    lineHeight: '1.65', margin: 0,
  },
  navBtn: {
    padding: '8px 20px', background: '#1e1e2e', color: '#cdd6f4',
    border: '1px solid #313244', borderRadius: '6px',
    cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  },
}

// =============================================================================
// COMPONENT
// =============================================================================
export default function App() {
  const [state, setState] = useState(engine.getState())
  const activeLines = engine.getActiveLines()

  const next = () => { engine.nextStep(); setState(engine.getState()) }
  const prev = () => { engine.prevStep(); setState(engine.getState()) }

  const codeLines = engine.getCode().split('\n')

  return (
    <div style={styles.app}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>algo.viz</h1>
        <span style={styles.stepBadge}>
          {state.isFirstStep
            ? 'Initial state'
            : `Step ${state.currentStepIndex} of ${state.totalSteps}`}
        </span>
        <span style={{ ...styles.stepBadge, color: '#bd93f9', borderColor: '#44475a' }}>
          {engine.getConcept()}
        </span>
      </div>

      {/* Main panels */}
      <div style={styles.panels}>

        {/* Code Panel */}
        <div style={styles.codePanel}>
          <div style={styles.codePanelTitle}>Code</div>
          <code>
            {codeLines.map((line, i) => {
              const lineNumber = i + 1
              const isActive = activeLines.includes(lineNumber)
              return (
                <span
                  key={lineNumber}
                  style={{
                    ...styles.codeLine,
                    background: isActive ? '#2a2a4a' : 'transparent',
                    color: isActive ? '#f1fa8c' : '#6272a4',
                    borderLeft: isActive ? '3px solid #f1fa8c' : '3px solid transparent',
                  }}
                >
                  <span style={{ color: '#44475a', marginRight: '16px', userSelect: 'none' }}>
                    {String(lineNumber).padStart(2, ' ')}
                  </span>
                  {line}
                </span>
              )
            })}
          </code>
        </div>

        {/* Diagram Panel */}
        <div style={styles.diagramPanel}>
          <SceneRenderer scene={state.currentScene} />
        </div>
      </div>

      {/* Explanation + Navigation Strip */}
      <div style={styles.explanationStrip}>
        <button
          onClick={prev}
          disabled={state.isFirstStep}
          style={{
            ...styles.navBtn,
            opacity: state.isFirstStep ? 0.4 : 1,
            cursor: state.isFirstStep ? 'not-allowed' : 'pointer',
          }}
        >
          ← Prev
        </button>

        <p style={styles.explanationText}>
          {state.isFirstStep
            ? 'Press Next to begin the walkthrough.'
            : state.currentStep?.explanation}
        </p>

        <button
          onClick={next}
          disabled={state.isLastStep}
          style={{
            ...styles.navBtn,
            opacity: state.isLastStep ? 0.4 : 1,
            cursor: state.isLastStep ? 'not-allowed' : 'pointer',
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}