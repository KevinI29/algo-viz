/**
 * Study AI — Arrow Renderer (v2)
 * =================================
 * Directional arrow between two points.
 * Used for tree edges and linked list connections.
 */

import type { ArrowState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

type Props = {
  arrow: ArrowState;
  x1: number; y1: number;
  x2: number; y2: number;
  nodeRadius?: number;
};

export function Arrow({ arrow, x1, y1, x2, y2, nodeRadius = 28 }: Props) {
  // Shorten line to stop at circle edge
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const sx = x1 + ux * nodeRadius;
  const sy = y1 + uy * nodeRadius;
  const ex = x2 - ux * (nodeRadius + 6); // extra gap for arrowhead
  const ey = y2 - uy * (nodeRadius + 6);

  const markerId = `arrow-${arrow.id}`;

  return (
    <g style={{ transition: T, opacity: arrow.opacity }}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 6" refX="9" refY="3"
          markerWidth="8" markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 3 L 0 6 z" fill="rgba(192, 202, 245, 0.5)" />
        </marker>
      </defs>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke="rgba(192, 202, 245, 0.35)"
        strokeWidth={2}
        markerEnd={`url(#${markerId})`}
        style={{ transition: T }}
      />
    </g>
  );
}