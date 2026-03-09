/**
 * Study AI — Stack & Queue Simulators
 * ======================================
 * The reference video (parenthesis matching) shows:
 * - Characters scanned left to right with a large arrow
 * - Open brackets fly into a U-shaped stack container
 * - Close brackets trigger a pop from the stack
 * - Multiple examples: balanced, unbalanced
 */

import type { SimEvent } from './events';

// =============================================================================
// VALID PARENTHESES
// =============================================================================

/**
 * Checks if a string of brackets is balanced using a stack.
 * Supports (, ), [, ], {, }
 */
export function* validParentheses(input: string): Generator<SimEvent> {
  const stack: { char: string; index: number }[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
  const openers = new Set(['(', '[', '{']);

  yield { type: 'phase.start', name: 'scan',
          explanation: `Scan each character in "${input}" from left to right` };

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    // Move scan arrow to this character
    yield { type: 'stack.scan', charIndex: i, char };

    if (openers.has(char)) {
      // Push opener onto stack
      stack.push({ char, index: i });
      yield { type: 'stack.push', char, charIndex: i };

    } else if (pairs[char]) {
      // It's a closer — check if stack has matching opener
      if (stack.length === 0) {
        yield { type: 'stack.no_match', closeIndex: i,
                expected: undefined };
        yield { type: 'phase.end', name: 'scan' };
        yield { type: 'stack.result', balanced: false,
                reason: `Found '${char}' but stack is empty — no matching opener` };
        yield { type: 'stack.done' };
        return;
      }

      const top = stack[stack.length - 1];
      if (top.char !== pairs[char]) {
        yield { type: 'stack.no_match', closeIndex: i,
                expected: pairs[char] };
        yield { type: 'phase.end', name: 'scan' };
        yield { type: 'stack.result', balanced: false,
                reason: `Found '${char}' but top of stack is '${top.char}' — mismatch` };
        yield { type: 'stack.done' };
        return;
      }

      // Match found — pop from stack
      const matched = stack.pop()!;
      yield { type: 'stack.pop', char: matched.char };
      yield { type: 'stack.match', openIndex: matched.index, closeIndex: i };
    }
    // Ignore non-bracket characters
  }

  yield { type: 'phase.end', name: 'scan' };

  if (stack.length === 0) {
    yield { type: 'stack.result', balanced: true,
            reason: 'Stack is empty — all brackets are matched' };
  } else {
    const remaining = stack.map(s => s.char).join(', ');
    yield { type: 'stack.result', balanced: false,
            reason: `Stack still has [${remaining}] — unmatched openers` };
  }

  yield { type: 'stack.done' };
}

// =============================================================================
// EVALUATE POSTFIX EXPRESSION
// =============================================================================

/**
 * Evaluates a postfix expression using a stack.
 * Input: array of tokens, e.g. ["3", "4", "+", "2", "*"]
 */
export function* evaluatePostfix(tokens: string[]): Generator<SimEvent> {
  const stack: { value: number; index: number }[] = [];
  const isOperator = (t: string) => ['+', '-', '*', '/'].includes(t);

  yield { type: 'phase.start', name: 'evaluate',
          explanation: `Evaluate the postfix expression: ${tokens.join(' ')}` };

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    yield { type: 'stack.scan', charIndex: i, char: token };

    if (isOperator(token)) {
      // Pop two operands
      if (stack.length < 2) {
        yield { type: 'stack.result', balanced: false, reason: 'Not enough operands' };
        yield { type: 'stack.done' };
        return;
      }

      const b = stack.pop()!;
      yield { type: 'stack.pop', char: String(b.value) };
      const a = stack.pop()!;
      yield { type: 'stack.pop', char: String(a.value) };

      let result: number;
      switch (token) {
        case '+': result = a.value + b.value; break;
        case '-': result = a.value - b.value; break;
        case '*': result = a.value * b.value; break;
        case '/': result = Math.floor(a.value / b.value); break;
        default: result = 0;
      }

      // Push result
      stack.push({ value: result, index: i });
      yield { type: 'stack.push', char: String(result), charIndex: i };

    } else {
      // It's a number — push onto stack
      const value = parseInt(token, 10);
      stack.push({ value, index: i });
      yield { type: 'stack.push', char: token, charIndex: i };
    }
  }

  yield { type: 'phase.end', name: 'evaluate' };

  if (stack.length === 1) {
    yield { type: 'stack.result', balanced: true,
            reason: `Final result: ${stack[0].value}` };
  }

  yield { type: 'stack.done' };
}
