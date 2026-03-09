/**
 * Study AI — Pyodide Manager
 * ============================
 * Lazy-loads Pyodide (Python-in-browser via WASM) and provides
 * instrumented code execution with sys.settrace.
 *
 * Loading strategy:
 * - preload() called on idle screen mount (background)
 * - ensureReady() awaited before any execution
 * - Once loaded, stays in memory for the session
 * - Simulator-path queries never touch this module
 */

// =============================================================================
// TRACE EVENT (raw Pyodide output)
// =============================================================================

export type PyTraceEvent = {
  seq: number;
  line: number;        // 1-based line in user's code
  event: 'line' | 'call' | 'return' | 'exception';
  locals: Record<string, unknown>;
};

// =============================================================================
// EXECUTION RESULT
// =============================================================================

export type ExecutionResult = {
  success: true;
  events: PyTraceEvent[];
  output: string;
} | {
  success: false;
  error: string;
};

// =============================================================================
// PYODIDE MANAGER
// =============================================================================

class PyodideManager {
  private pyodide: any = null;
  private loadPromise: Promise<void> | null = null;
  private _ready = false;

  get ready(): boolean { return this._ready; }

  /**
   * Start loading Pyodide in the background.
   * Safe to call multiple times — only loads once.
   */
  preload(): void {
    if (!this.loadPromise) {
      this.loadPromise = this.init();
    }
  }

  private async init(): Promise<void> {
    try {
      // Dynamic import — Pyodide is loaded from CDN
      const { loadPyodide } = await import(
        /* @vite-ignore */
        'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs'
      );
      this.pyodide = await loadPyodide({
        indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/',
      });
      this._ready = true;
      console.log('[Pyodide] Ready');
    } catch (err) {
      console.error('[Pyodide] Failed to load:', err);
      this.loadPromise = null; // allow retry
      throw err;
    }
  }

  /**
   * Wait until Pyodide is fully loaded.
   * Starts loading if not already started.
   */
  async ensureReady(): Promise<void> {
    if (!this.loadPromise) this.preload();
    await this.loadPromise;
  }

  /**
   * Execute user code with tracing instrumentation.
   *
   * @param code - The user's Python code (function definition)
   * @param callExpression - How to call the function, e.g. "bubble_sort([4,2,6,5,1,3])"
   * @param timeoutMs - Max execution time (default 5000ms)
   */
  async trace(
    code: string,
    callExpression: string,
    timeoutMs = 5000,
  ): Promise<ExecutionResult> {
    await this.ensureReady();

    if (!this.pyodide) {
      return { success: false, error: 'Pyodide not loaded' };
    }

    // Build the instrumented Python code
    const instrumented = buildTracerCode(code, callExpression);

    try {
      // Run with timeout using Promise.race
      const result = await Promise.race([
        this.pyodide.runPythonAsync(instrumented),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Execution timed out (possible infinite loop)')), timeoutMs)
        ),
      ]);

      // Convert Pyodide proxy to JS
      const events: PyTraceEvent[] = result.toJs({ dict_converter: Object.fromEntries });

      return {
        success: true,
        events,
        output: '',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Unknown execution error',
      };
    }
  }
}

// =============================================================================
// TRACER CODE BUILDER
// =============================================================================

function buildTracerCode(userCode: string, callExpression: string): string {
  // Indent user code to be inside the exec scope
  const indented = userCode.split('\n').map(line => '    ' + line).join('\n');

  return `
import sys
import json

_trace_events = []
_seq = [0]
_max_events = 2000  # safety limit

def _tracer(frame, event, arg):
    if len(_trace_events) >= _max_events:
        sys.settrace(None)
        return None
    if frame.f_code.co_filename != '<string>':
        return _tracer
    if event not in ('line', 'call', 'return'):
        return _tracer

    _seq[0] += 1
    locals_snap = {}
    for k, v in frame.f_locals.items():
        if k.startswith('_'):
            continue
        try:
            json.dumps(v)
            locals_snap[k] = v
        except (TypeError, ValueError, OverflowError):
            try:
                locals_snap[k] = str(v)
            except:
                pass

    _trace_events.append({
        'seq': _seq[0],
        'line': frame.f_lineno,
        'event': event,
        'locals': locals_snap,
    })
    return _tracer

# Execute user code
exec('''
${userCode}
''')

# Run with tracing
sys.settrace(_tracer)
try:
    ${callExpression}
finally:
    sys.settrace(None)

_trace_events
`;
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const pyodideManager = new PyodideManager();