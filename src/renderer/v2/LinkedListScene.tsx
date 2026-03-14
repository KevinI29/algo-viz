/**
 * Study AI — LinkedList Scene (v2)
 * ===================================
 * Renders linked list: nodes in a horizontal chain with arrows,
 * pointer labels (slow/fast) above that slide between nodes.
 */

import type { AnimationFrame, NodeState, ArrowState, PointerState } from '../../templates/types';
import { Node, NODE_RADIUS } from './Node';
import { Arrow } from './Arrow';
import { PointerLabel } from './PointerLabel';

const CANVAS_W = 700;
const CANVAS_H = 260;
const NODE_Y = 160;
const NODE_GAP = 110;
const LABEL_Y = 50;
const ARROW_END_Y = NODE_Y - NODE_RADIUS - 8;

type Props = {
  frame: AnimationFrame;
};

export function LinkedListScene({ frame }: Props) {
  const entities = frame.entities;

  const nodes = Object.values(entities).filter(
    (e): e is NodeState => e.entityType === 'node'
  ).sort((a, b) => {
    // Sort by ID suffix number: node_0, node_1, etc.
    const ai = parseInt(a.id.split('_')[1] ?? '0');
    const bi = parseInt(b.id.split('_')[1] ?? '0');
    return ai - bi;
  });

  const arrows = Object.values(entities).filter(
    (e): e is ArrowState => e.entityType === 'arrow'
  );

  const pointers = Object.values(entities).filter(
    (e): e is PointerState => e.entityType === 'pointer'
  );

  const nodeCount = nodes.length;
  const totalW = (nodeCount - 1) * NODE_GAP;
  const startX = (CANVAS_W - totalW) / 2;

  function nodeX(index: number): number {
    return startX + index * NODE_GAP;
  }

  // Map node IDs to positions
  const nodePositions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    nodePositions[n.id] = { x: nodeX(i), y: NODE_Y };
  });

  return (
    <svg
      width="100%" height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ overflow: 'visible', maxWidth: 700 }}
    >
      <defs>
        <pattern id="ll-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill="#292e42" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="#1a1b26" />
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#ll-grid)" />

      {/* Arrows between consecutive nodes */}
      {arrows.map(arrow => {
        const from = nodePositions[arrow.fromId];
        const to = nodePositions[arrow.toId];
        if (!from || !to) return null;
        return (
          <Arrow
            key={arrow.id}
            arrow={arrow}
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            nodeRadius={NODE_RADIUS}
          />
        );
      })}

      {/* Trailing arrow from last node (→ null) */}
      {nodeCount > 0 && (
        <line
          x1={nodeX(nodeCount - 1) + NODE_RADIUS + 6}
          y1={NODE_Y}
          x2={nodeX(nodeCount - 1) + NODE_RADIUS + 30}
          y2={NODE_Y}
          stroke="rgba(192, 202, 245, 0.25)"
          strokeWidth={2}
          markerEnd="url(#ll-trail)"
          style={{ transition: 'all 0.4s ease' }}
        />
      )}
      <defs>
        <marker id="ll-trail" viewBox="0 0 10 6" refX="9" refY="3"
          markerWidth="7" markerHeight="5" orient="auto">
          <path d="M 0 0 L 10 3 L 0 6 z" fill="rgba(192,202,245,0.25)" />
        </marker>
      </defs>

      {/* Nodes */}
      {nodes.map((node, i) => (
        <Node
          key={node.id}
          node={node}
          cx={nodeX(i)}
          cy={NODE_Y}
        />
      ))}

      {/* Pointer labels — offset when multiple point at same node, stagger heights */}
      {(() => {
        // Group pointers by target index to detect overlaps
        const groups: Record<number, typeof pointers> = {};
        for (const ptr of pointers) {
          const idx = ptr.targetIndex;
          if (!groups[idx]) groups[idx] = [];
          groups[idx].push(ptr);
        }

        // Stagger Y positions by pointer name for visual clarity
        const LABEL_Y_MAP: Record<string, number> = {
          prev:    LABEL_Y - 10,   // higher
          current: LABEL_Y + 16,   // lower (middle)
          next:    LABEL_Y - 10,   // higher (same as prev, but different x)
          slow:    LABEL_Y,
          fast:    LABEL_Y,
        };

        return pointers.map(ptr => {
          const targetIdx = ptr.targetIndex;
          const baseX = targetIdx < nodeCount
            ? nodeX(targetIdx)
            : nodeX(nodeCount - 1) + NODE_GAP;

          // Offset if multiple pointers share this target
          const group = groups[targetIdx] ?? [ptr];
          const posInGroup = group.findIndex(p => p.id === ptr.id);
          const groupSize = group.length;
          const LABEL_SPREAD = 66;
          const xOffset = groupSize > 1
            ? (posInGroup - (groupSize - 1) / 2) * LABEL_SPREAD
            : 0;

          const thisLabelY = LABEL_Y_MAP[ptr.name] ?? LABEL_Y;

          return (
            <PointerLabel
              key={ptr.id}
              pointer={ptr}
              x={baseX + xOffset}
              labelY={thisLabelY}
              arrowEndY={ARROW_END_Y}
            />
          );
        });
      })()}
    </svg>
  );
}