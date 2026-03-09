/**
 * Study AI — Tree Scene (v2 fixed)
 * ===================================
 * Renders binary tree + queue display + results display.
 * Uses NodeState.x/y positions embedded by the template mapper,
 * eliminating the fragile arrow-inference layout.
 */

import type { AnimationFrame, NodeState, ArrowState, QueueDisplayState } from '../../templates/types';
import { Node, NODE_RADIUS } from './Node';
import { Arrow } from './Arrow';
import { QueueDisplay } from './QueueDisplay';

const CANVAS_W = 700;
const CANVAS_H = 320;

// Display positions (right side)
const DISPLAY_X = 480;
const QUEUE_Y = 60;
const RESULTS_Y = 150;

type Props = {
  frame: AnimationFrame;
};

export function TreeScene({ frame }: Props) {
  const entities = frame.entities;

  const nodes = Object.values(entities).filter(
    (e): e is NodeState => e.entityType === 'node'
  );
  const arrows = Object.values(entities).filter(
    (e): e is ArrowState => e.entityType === 'arrow'
  );
  const displays = Object.values(entities).filter(
    (e): e is QueueDisplayState => e.entityType === 'queue_display'
  );

  const queueDisp = displays.find(d => d.label === 'queue');
  const resultsDisp = displays.find(d => d.label === 'results');

  // Build position lookup from embedded node positions
  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of nodes) {
    if (node.x !== undefined && node.y !== undefined) {
      positions[node.id] = { x: node.x, y: node.y };
    }
  }

  // Fallback: if no positions embedded, spread linearly
  if (Object.keys(positions).length === 0) {
    nodes.forEach((n, i) => {
      positions[n.id] = { x: 80 + i * 80, y: 80 };
    });
  }

  return (
    <svg
      width="100%" height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ overflow: 'visible', maxWidth: 700 }}
    >
      <defs>
        <pattern id="tree-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill="#292e42" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="#1a1b26" />
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#tree-grid)" />

      {/* Arrows (edges) — render below nodes */}
      {arrows.map(arrow => {
        const from = positions[arrow.fromId];
        const to = positions[arrow.toId];
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

      {/* Nodes */}
      {nodes.map(node => {
        const pos = positions[node.id];
        if (!pos) return null;
        return (
          <Node
            key={node.id}
            node={node}
            cx={pos.x}
            cy={pos.y}
          />
        );
      })}

      {/* Queue display */}
      {queueDisp && (
        <QueueDisplay display={queueDisp} x={DISPLAY_X} y={QUEUE_Y} />
      )}

      {/* Results display */}
      {resultsDisp && (
        <QueueDisplay display={resultsDisp} x={DISPLAY_X} y={RESULTS_Y} />
      )}
    </svg>
  );
}