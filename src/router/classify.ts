/**
 * Study AI — Client-Side Input Classifier
 * ==========================================
 * Fast local heuristic to detect if user input is code or a concept name.
 * If it looks like code, we skip the LLM classifier and go straight to
 * Pyodide path with inputType: 'code'.
 */

/**
 * Returns true if the input looks like pasted code rather than a concept name.
 * Uses pattern matching — no API calls.
 */
export function looksLikeCode(input: string): boolean {
  const lines = input.split('\n');

  // Multi-line input with 4+ lines is almost certainly code
  if (lines.length >= 4) return true;

  // Check for code-like patterns
  const codePatterns = [
    /\b(def|function|class|const|let|var)\s+\w+/,    // function/variable definitions
    /\bfor\s+\w+\s+in\b/,                             // Python for loop
    /\bwhile\s*[\(:]/ ,                                // while loop
    /\b(if|elif|else)\s*[\(:]/,                        // conditionals
    /\w+\s*=\s*\[/,                                    // array assignment
    /\breturn\s+/,                                     // return statement
    /\bimport\s+/,                                     // import
    /\bprint\s*\(/,                                    // print call
    /\bconsole\.\w+\(/,                                // console.log etc
    /:\s*$\n\s+/m,                                     // Python indentation pattern
    /\{\s*\n/,                                         // JS block open
    /\bself\.\w+/,                                     // Python self reference
    /=>/,                                              // Arrow function
  ];

  const matchCount = codePatterns.filter(p => p.test(input)).length;

  // 2+ code patterns = definitely code
  // 1 pattern + multi-line = probably code
  return matchCount >= 2 || (matchCount >= 1 && lines.length >= 3);
}

/**
 * Detect the likely programming language of pasted code.
 */
export function detectLanguage(input: string): 'python' | 'javascript' {
  const pythonSignals = [
    /\bdef\s+\w+\s*\(/,
    /\bprint\s*\(/,
    /\bself\.\w+/,
    /:\s*$/m,                  // colon at end of line
    /\belif\b/,
    /\bNone\b/,
    /\bTrue\b|\bFalse\b/,
  ];

  const jsSignals = [
    /\bfunction\s+\w+\s*\(/,
    /\bconst\s+\w+/,
    /\blet\s+\w+/,
    /\bconsole\.\w+/,
    /=>/,                      // arrow function
    /\bnull\b/,
    /\bundefined\b/,
    /\{\s*$/m,                 // opening brace
  ];

  const pyScore = pythonSignals.filter(p => p.test(input)).length;
  const jsScore = jsSignals.filter(p => p.test(input)).length;

  return pyScore >= jsScore ? 'python' : 'javascript';
}