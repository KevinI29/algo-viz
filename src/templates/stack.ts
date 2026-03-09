/**
 * Study AI — Stack Template Mapper
 * ==================================
 * Converts stack.* SimEvents into AnimationFrames.
 * Manages string display, scan arrow, and stack container.
 */

import type { SimEvent } from '../simulator/events';
import type {
  AnimationFrame, StringDisplayState, StackContainerState,
  Transition, EntityState,
} from './types';

const T_SCAN      = 600;
const T_PUSH      = 700;
const T_POP       = 600;
const T_MATCH     = 400;
const T_RESULT    = 1000;
const T_DONE      = 800;
const T_PHASE     = 400;

// =============================================================================
// MAPPER
// =============================================================================

export function mapStackEvents(
  events: SimEvent[],
  input: string,
  phaseExplanations?: Record<string, string>,
): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  let seq = 0;

  // ── Initialize string display ──
  const stringDisplay: StringDisplayState = {
    entityType: 'string_display',
    id: 'input_string',
    chars: input.split(''),
    scanIndex: -1,
    matchedIndices: [],
  };

  // ── Initialize stack container ──
  const stackContainer: StackContainerState = {
    entityType: 'stack_container',
    id: 'stack',
    items: [],
  };

  let currentPhase: string | undefined;

  function snapshot(transitions: Transition[], opts: Partial<AnimationFrame> = {}): AnimationFrame {
    const entities: Record<string, EntityState> = {};
    entities[stringDisplay.id] = {
      ...stringDisplay,
      chars: [...stringDisplay.chars],
      matchedIndices: [...stringDisplay.matchedIndices],
    };
    entities[stackContainer.id] = {
      ...stackContainer,
      items: [...stackContainer.items],
    };

    return {
      seq: seq++, entities, transitions,
      duration: opts.duration ?? T_SCAN,
      phase: currentPhase, ...opts,
    };
  }

  // ── Initial frame ──
  frames.push(snapshot([{ type: 'none' }], {
    duration: T_PHASE,
    explanation: `Check if "${input}" has balanced brackets`,
  }));

  // ── Process events ──
  for (const event of events) {
    switch (event.type) {
      case 'phase.start':
        currentPhase = event.name;
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_PHASE,
          explanation: phaseExplanations?.[event.name] ?? event.explanation,
        }));
        break;

      case 'phase.end':
        currentPhase = undefined;
        break;

      case 'stack.scan':
        stringDisplay.scanIndex = event.charIndex;
        frames.push(snapshot(
          [{ type: 'scan_move', toIndex: event.charIndex }],
          {
            duration: T_SCAN,
            explanation: `Scan character '${event.char}' at position ${event.charIndex}`,
          }
        ));
        break;

      case 'stack.push':
        stackContainer.items.push(event.char);
        frames.push(snapshot(
          [{ type: 'stack_push', char: event.char }],
          {
            duration: T_PUSH,
            explanation: `'${event.char}' is an opener — push it onto the stack`,
          }
        ));
        break;

      case 'stack.pop': {
        stackContainer.items.pop();
        frames.push(snapshot(
          [{ type: 'stack_pop', char: event.char }],
          {
            duration: T_POP,
            explanation: `Pop '${event.char}' from the stack — it matches!`,
          }
        ));
        break;
      }

      case 'stack.match':
        stringDisplay.matchedIndices.push(event.openIndex, event.closeIndex);
        frames.push(snapshot(
          [{ type: 'none' }],
          { duration: T_MATCH }
        ));
        break;

      case 'stack.no_match':
        frames.push(snapshot(
          [{ type: 'none' }],
          {
            duration: T_RESULT,
            explanation: event.expected
              ? `Mismatch! Expected '${event.expected}' but found closer at position ${event.closeIndex}`
              : `No matching opener for closer at position ${event.closeIndex}`,
          }
        ));
        break;

      case 'stack.result':
        frames.push(snapshot(
          [{ type: 'none' }],
          {
            duration: T_RESULT,
            explanation: event.balanced
              ? `✓ Balanced! ${event.reason}`
              : `✗ Not balanced. ${event.reason}`,
          }
        ));
        break;

      case 'stack.done':
        frames.push(snapshot([{ type: 'none' }], { duration: T_DONE }));
        break;

      case 'example.start': {
        // Reset for new example
        const newData = event.data as any;
        const newInput: string = newData?.input ?? input;
        stringDisplay.chars = newInput.split('');
        stringDisplay.scanIndex = -1;
        stringDisplay.matchedIndices = [];
        stackContainer.items = [];

        frames.push(snapshot([{ type: 'none' }], {
          duration: T_PHASE,
          isExampleBoundary: true,
          exampleLabel: event.label,
          explanation: `${event.label}: "${newInput}"`,
        }));
        break;
      }

      default:
        break;
    }
  }

  return frames;
}
