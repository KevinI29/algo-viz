/**
 * Study AI — Linked List Template Mapper
 * ========================================
 * Converts ll.* SimEvents into AnimationFrames.
 * Manages node chain, pointer labels (slow/fast), and highlights.
 */

import type { SimEvent } from '../simulator/events';
import type {
  AnimationFrame, NodeState, ArrowState, PointerState,
  Transition, EntityState,
} from './types';

const T_SETUP     = 800;
const T_MOVE      = 700;
const T_HIGHLIGHT = 500;
const T_RESULT    = 1000;
const T_DONE      = 800;
const T_PHASE     = 400;

const C_DEFAULT   = '#bb9af7';   // purple
const C_RESULT    = '#9ece6a';   // green

const POINTER_COLORS: Record<string, string> = {
  slow:    '#73daca',   // teal
  fast:    '#7dcfff',   // light blue
  current: '#ff9e64',   // orange
  prev:    '#bb9af7',   // purple
  next:    '#e0af68',   // yellow
};

// =============================================================================
// MAPPER
// =============================================================================

export function mapLinkedListEvents(
  events: SimEvent[],
  values: number[],
  initialPointers: Record<string, number>,
  phaseExplanations?: Record<string, string>,
): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  let seq = 0;

  // ── Initialize node states ──
  const nodes: Record<string, NodeState> = {};
  for (let i = 0; i < values.length; i++) {
    nodes[`node_${i}`] = {
      entityType: 'node', id: `node_${i}`, value: values[i],
      color: C_DEFAULT, opacity: 1, highlighted: false, visited: false,
    };
  }

  // ── Initialize arrows between consecutive nodes ──
  const arrows: Record<string, ArrowState> = {};
  for (let i = 0; i < values.length - 1; i++) {
    const id = `arrow_${i}_${i + 1}`;
    arrows[id] = {
      entityType: 'arrow', id, fromId: `node_${i}`, toId: `node_${i + 1}`, opacity: 0.7,
    };
  }

  // ── Initialize pointer labels ──
  const pointers: Record<string, PointerState> = {};
  for (const [name, index] of Object.entries(initialPointers)) {
    pointers[name] = {
      entityType: 'pointer', id: `ptr_${name}`, name,
      targetIndex: index,
      color: POINTER_COLORS[name] ?? '#a9b1d6',
      visible: true,
    };
  }

  let currentPhase: string | undefined;

  function snapshot(transitions: Transition[], opts: Partial<AnimationFrame> = {}): AnimationFrame {
    const entities: Record<string, EntityState> = {};
    for (const n of Object.values(nodes)) entities[n.id] = { ...n };
    for (const a of Object.values(arrows)) entities[a.id] = { ...a };
    for (const p of Object.values(pointers)) entities[p.id] = { ...p };

    return {
      seq: seq++, entities, transitions,
      duration: opts.duration ?? T_MOVE,
      phase: currentPhase, ...opts,
    };
  }

  // ── Initial frame ──
  frames.push(snapshot([{ type: 'none' }], {
    duration: T_SETUP,
    explanation: `Linked list: [${values.join(' → ')}]`,
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

      case 'll.move_pointer': {
        let ptr = pointers[event.name];
        // Auto-create pointer if it doesn't exist yet (simulator may reference
        // pointers not in the initial set, like 'prev' and 'next' in reverse)
        if (!ptr) {
          ptr = {
            entityType: 'pointer', id: `ptr_${event.name}`, name: event.name,
            targetIndex: event.fromIndex,
            color: POINTER_COLORS[event.name] ?? '#a9b1d6',
            visible: true,
          };
          pointers[event.name] = ptr;
        }

        const fromIdx = ptr.targetIndex;
        ptr.targetIndex = event.toIndex;

        frames.push(snapshot(
          [{ type: 'pointer_slide', pointerId: ptr.id, fromIndex: fromIdx, toIndex: event.toIndex }],
          {
            duration: T_MOVE,
            explanation: `${event.name} moves from node ${values[fromIdx] ?? '?'} to node ${values[event.toIndex] ?? '?'}`,
          }
        ));
        break;
      }

      case 'll.pointer_off_end': {
        const ptr = pointers[event.name];
        if (ptr) {
          ptr.targetIndex = values.length;
          ptr.visible = true;

          frames.push(snapshot(
            [{ type: 'pointer_off', pointerId: ptr.id }],
            {
              duration: T_MOVE,
              explanation: `${event.name} has gone past the end of the list`,
            }
          ));
        }
        break;
      }

      case 'll.reverse_arrow': {
        // Flip the arrow between fromIndex and toIndex
        // Original: arrow_from_to (e.g., arrow_0_1 goes 0→1)
        // After: arrow flips to point backwards (1←0)
        const fwdId = `arrow_${event.fromIndex}_${event.fromIndex + 1}`;
        const arrow = arrows[fwdId];
        if (arrow) {
          // Flip direction
          const oldFrom = arrow.fromId;
          arrow.fromId = arrow.toId;
          arrow.toId = oldFrom;
          arrow.opacity = 0.9; // make reversed arrows more visible
        }

        frames.push(snapshot(
          [{ type: 'none' }],
          {
            duration: 500,
            explanation: `Reverse link: node ${values[event.toIndex]} now points back to node ${values[event.fromIndex]}`,
          }
        ));
        break;
      }

      case 'll.highlight_node': {
        const node = nodes[`node_${event.index}`];
        if (node) {
          node.color = event.color ?? C_RESULT;
          node.highlighted = true;
        }
        frames.push(snapshot(
          [{ type: 'node_highlight', nodeId: `node_${event.index}`, color: event.color ?? C_RESULT }],
          { duration: T_HIGHLIGHT }
        ));
        break;
      }

      case 'll.unhighlight_node': {
        const node = nodes[`node_${event.index}`];
        if (node) {
          node.color = C_DEFAULT;
          node.highlighted = false;
        }
        break;
      }

      case 'll.found_result': {
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_RESULT,
          explanation: event.value >= 0
            ? `Found it! The result is node ${event.value} at position ${event.index}`
            : 'No result found',
        }));
        break;
      }

      case 'll.done':
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_DONE,
          explanation: 'Done!',
        }));
        break;

      case 'example.start': {
        // Reset for new example
        const newData = event.data as any;
        if (newData?.values) {
          const newVals: number[] = newData.values;
          // Clear old
          for (const k of Object.keys(nodes)) delete nodes[k];
          for (const k of Object.keys(arrows)) delete arrows[k];

          for (let i = 0; i < newVals.length; i++) {
            nodes[`node_${i}`] = {
              entityType: 'node', id: `node_${i}`, value: newVals[i],
              color: C_DEFAULT, opacity: 1, highlighted: false, visited: false,
            };
          }
          for (let i = 0; i < newVals.length - 1; i++) {
            const id = `arrow_${i}_${i + 1}`;
            arrows[id] = { entityType: 'arrow', id, fromId: `node_${i}`, toId: `node_${i + 1}`, opacity: 0.7 };
          }

          // Reset pointers
          const ptrs = newData.pointers ?? initialPointers;
          for (const [name, index] of Object.entries(ptrs)) {
            if (pointers[name]) {
              pointers[name].targetIndex = index as number;
            }
          }
        }

        frames.push(snapshot([{ type: 'none' }], {
          duration: T_SETUP,
          isExampleBoundary: true,
          exampleLabel: event.label,
          explanation: event.label,
        }));
        break;
      }

      default:
        break;
    }
  }

  return frames;
}