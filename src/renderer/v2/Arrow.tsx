/**
 * Study AI — Arrow Renderer (Phase 5)
 * ======================================
 * Directional arrow that smoothly animates when endpoints change.
 * Used for tree edges and linked list connections.
 * When an arrow reverses (linked list reversal), endpoints swap
 * and the CSS transition makes it rotate smoothly.
 */

import type { ArrowState } from '../../templates/types';

const T = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

type Props = {
  arrow: ArrowState;
  x1: number; y1: number;
  x2: number; y2: number;
  nodeRadius?: number;
};

export function Arrow({ arrow, x1, y1, x2, y2, nodeRadius = 28 }: Props) {
  // Shorten to stop at circle edges
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;

  const sx = x1 + ux * (nodeRadius + 2);
  const sy = y1 + uy * (nodeRadius + 2);
  const ex = x2 - ux * (nodeRadius + 8);
  const ey = y2 - uy * (nodeRadius + 8);

  const markerId = `arr-${arrow.id}`;

  return (
    <g style={{ opacity: arrow.opacity, transition: 'opacity 0.4s ease' }}>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 6" refX="9" refY="3"
          markerWidth="8" markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 3 L 0 6 z" fill="rgba(192,202,245,0.5)" />
        </marker>
      </defs>
      <line
        x1={sx} y1={sy} x2={ex} y2={ey}
        stroke="rgba(192,202,245,0.3)"
        strokeWidth={2}
        markerEnd={`url(#${markerId})`}
        style={{ transition: T }}
      />
    </g>
  );
}