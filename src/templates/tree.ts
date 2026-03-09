/**
 * Study AI — Tree Template Mapper (v2 fixed)
 * =============================================
 * Converts tree.* SimEvents into AnimationFrames.
 * Computes tree layout positions ONCE from the TreeNodeData structure
 * and embeds them directly in NodeState.x / NodeState.y.
 *
 * Fixes:
 * - Positions computed from actual tree data (not reverse-engineered from arrows)
 * - BFS highlight lifecycle: unvisited→processing→visited with proper color transitions
 */

import type { SimEvent } from '../simulator/events';
import type { TreeNodeData } from '../router/types';
import type {
  AnimationFrame, NodeState, ArrowState, QueueDisplayState,
  Transition, EntityState,
} from './types';

const T_ENQUEUE   = 500;
const T_DEQUEUE   = 400;
const T_VISIT     = 600;
const T_CHECK     = 400;
const T_DONE      = 800;
const T_PHASE     = 300;

const C_UNVISITED   = '#7aa2f7';   // blue
const C_PROCESSING  = '#f7768e';   // pink/salmon
const C_VISITED     = '#9aa5ce';   // soft grey-blue (clearly different from both)

// ── Tree layout constants ──
const TREE_ROOT_X = 220;
const TREE_ROOT_Y = 60;
const TREE_LEVEL_H = 80;
const TREE_SPREADS = [130, 65, 35]; // spread per level

// =============================================================================
// COMPUTE TREE POSITIONS from actual tree data — no arrow guessing
// =============================================================================

type PosMap = Record<string, { x: number; y: number }>;

function computePositions(root: TreeNodeData): PosMap {
  const pos: PosMap = {};

  function walk(node: TreeNodeData | undefined, x: number, y: number, level: number) {
    if (!node) return;
    pos[node.id] = { x, y };
    const spread = TREE_SPREADS[Math.min(level, TREE_SPREADS.length - 1)];
    walk(node.left,  x - spread, y + TREE_LEVEL_H, level + 1);
    walk(node.right, x + spread, y + TREE_LEVEL_H, level + 1);
  }

  walk(root, TREE_ROOT_X, TREE_ROOT_Y, 0);
  return pos;
}

// =============================================================================
// HELPERS
// =============================================================================

function flattenTree(node: TreeNodeData | undefined): TreeNodeData[] {
  if (!node) return [];
  return [node, ...flattenTree(node.left), ...flattenTree(node.right)];
}

function buildEdges(node: TreeNodeData | undefined): Array<{ fromId: string; toId: string }> {
  if (!node) return [];
  const edges: Array<{ fromId: string; toId: string }> = [];
  if (node.left)  { edges.push({ fromId: node.id, toId: node.left.id });  edges.push(...buildEdges(node.left)); }
  if (node.right) { edges.push({ fromId: node.id, toId: node.right.id }); edges.push(...buildEdges(node.right)); }
  return edges;
}

// =============================================================================
// MAPPER
// =============================================================================

export function mapTreeEvents(
  events: SimEvent[],
  root: TreeNodeData,
  phaseExplanations?: Record<string, string>,
): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  let seq = 0;

  // Compute positions from tree data directly
  const posMap = computePositions(root);

  // ── Initialize node states with embedded positions ──
  const allNodes = flattenTree(root);
  const nodes: Record<string, NodeState> = {};
  for (const n of allNodes) {
    const p = posMap[n.id] ?? { x: 0, y: 0 };
    nodes[n.id] = {
      entityType: 'node', id: n.id, value: n.value,
      color: C_UNVISITED, opacity: 1, highlighted: false, visited: false,
      x: p.x, y: p.y,
    };
  }

  // ── Initialize arrows ──
  const edgeList = buildEdges(root);
  const arrows: Record<string, ArrowState> = {};
  for (const e of edgeList) {
    const id = `arrow_${e.fromId}_${e.toId}`;
    arrows[id] = { entityType: 'arrow', id, fromId: e.fromId, toId: e.toId, opacity: 0.6 };
  }

  // ── Queue and results displays ──
  const queueDisplay: QueueDisplayState = {
    entityType: 'queue_display', id: 'queue', label: 'queue', values: [],
  };
  const resultsDisplay: QueueDisplayState = {
    entityType: 'queue_display', id: 'results', label: 'results', values: [],
  };

  let currentPhase: string | undefined;

  function snapshot(transitions: Transition[], opts: Partial<AnimationFrame> = {}): AnimationFrame {
    const entities: Record<string, EntityState> = {};
    for (const n of Object.values(nodes)) entities[n.id] = { ...n };
    for (const a of Object.values(arrows)) entities[a.id] = { ...a };
    entities[queueDisplay.id] = { ...queueDisplay, values: [...queueDisplay.values] };
    entities[resultsDisplay.id] = { ...resultsDisplay, values: [...resultsDisplay.values] };

    return {
      seq: seq++, entities, transitions,
      duration: opts.duration ?? T_VISIT,
      phase: currentPhase, ...opts,
    };
  }

  // ── Initial frame ──
  frames.push(snapshot([{ type: 'none' }], {
    duration: T_PHASE,
    explanation: 'Here\'s our binary tree. We\'ll traverse it level by level.',
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

      case 'tree.enqueue':
        queueDisplay.values.push(event.value);
        frames.push(snapshot(
          [{ type: 'list_append', listId: 'queue', value: event.value }],
          { duration: T_ENQUEUE, explanation: `Add ${event.value} to the queue` }
        ));
        break;

      case 'tree.dequeue': {
        const idx = queueDisplay.values.indexOf(event.value);
        if (idx >= 0) queueDisplay.values.splice(idx, 1);

        // Highlight this node as "processing"
        const node = nodes[event.nodeId];
        if (node) {
          node.color = C_PROCESSING;
          node.highlighted = true;
        }

        frames.push(snapshot(
          [
            { type: 'list_remove', listId: 'queue', index: 0 },
            node ? { type: 'node_highlight', nodeId: event.nodeId, color: C_PROCESSING } : { type: 'none' },
          ],
          { duration: T_DEQUEUE, explanation: `Dequeue ${event.value}` }
        ));
        break;
      }

      case 'tree.visit': {
        // Mark as visited — remove highlight, transition to visited color
        const node = nodes[event.nodeId];
        if (node) {
          node.visited = true;
          node.highlighted = false;
          node.color = C_VISITED;
        }
        break;
      }

      case 'tree.add_result':
        resultsDisplay.values.push(event.value);
        frames.push(snapshot(
          [{ type: 'list_append', listId: 'results', value: event.value }],
          { duration: T_VISIT, explanation: `Visit ${event.value} — add to results` }
        ));
        break;

      case 'tree.check_child': {
        if (event.childId && event.value !== undefined) {
          // Briefly highlight the child being checked
          const child = nodes[event.childId];
          if (child && !child.visited) {
            child.highlighted = true;
          }

          const parentNode = nodes[event.parentId];
          frames.push(snapshot(
            [{ type: 'node_highlight', nodeId: event.childId, color: '#e0af68' }],
            {
              duration: T_CHECK,
              explanation: `${event.side === 'left' ? 'Left' : 'Right'} child of ${parentNode?.value ?? '?'} is ${event.value}`,
            }
          ));

          // Reset child highlight
          if (child && !child.visited) {
            child.color = C_UNVISITED;
            child.highlighted = false;
          }
        }
        break;
      }

      case 'tree.done': {
        // All nodes to visited state
        for (const n of Object.values(nodes)) {
          n.color = C_VISITED;
          n.visited = true;
          n.highlighted = false;
        }
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_DONE,
          explanation: `BFS complete! Visited order: [${resultsDisplay.values.join(', ')}]`,
        }));
        break;
      }

      default:
        break;
    }
  }

  return frames;
}