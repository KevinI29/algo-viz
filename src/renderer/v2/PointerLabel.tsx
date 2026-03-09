/**
 * Study AI — PointerLabel Renderer (v2)
 * ========================================
 * Named label (slow, fast, j) with downward arrow pointing at a node/cell.
 * Slides smoothly between positions.
 */

import type { PointerState } from '../../templates/types';

const T = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
const LABEL_W = 56;
const LABEL_H = 26;
const LABEL_R = 6;
const ARROW_LEN = 22;
const FONT = 12;

type Props = {
  pointer: PointerState;
  x: number;         // center x of target
  labelY: number;    // top of label
  arrowEndY: number; // where arrow tip reaches
};

export function PointerLabel({ pointer, x, labelY, arrowEndY }: Props) {
  if (!pointer.visible) return null;

  const lx = x - LABEL_W / 2;
  const arrowStartY = labelY + LABEL_H;
  const midX = x;

  return (
    <g style={{ transition: T }}>
      {/* Label box */}
      <rect
        x={lx} y={labelY}
        width={LABEL_W} height={LABEL_H}
        rx={LABEL_R} ry={LABEL_R}
        fill={pointer.color}
        opacity={0.9}
        style={{ transition: T }}
      />
      <text
        x={midX} y={labelY + LABEL_H / 2 + FONT * 0.36}
        textAnchor="middle"
        fontSize={FONT}
        fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        fill="#1a1b26"
        style={{ transition: T }}
      >
        {pointer.name}
      </text>

      {/* Downward arrow */}
      <line
        x1={midX} y1={arrowStartY + 2}
        x2={midX} y2={arrowEndY - 6}
        stroke={pointer.color}
        strokeWidth={2.5}
        opacity={0.8}
        style={{ transition: T }}
      />
      {/* Arrowhead */}
      <polygon
        points={`${midX},${arrowEndY} ${midX - 5},${arrowEndY - 9} ${midX + 5},${arrowEndY - 9}`}
        fill={pointer.color}
        opacity={0.9}
        style={{ transition: T }}
      />
    </g>
  );
}