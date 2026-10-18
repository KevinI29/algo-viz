import { useState } from 'react'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

/** Remounts App with fresh state when the error boundary is reset. */
export function Root() {
  const [resetKey, setResetKey] = useState(0)
  return (
    <ErrorBoundary onReset={() => setResetKey(k => k + 1)}>
      <App key={resetKey} />
    </ErrorBoundary>
  )
}
