/**
 * Study AI — PointerLabel Renderer (Phase 5)
 * =============================================
 * Named label (slow/fast/prev/current/next) with downward arrow.
 * Position controlled via CSS transform for smooth gliding.
 */

import type { PointerState } from '../../templates/types';

const T_MOVE  = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const T_COLOR = 'fill 0.3s ease, opacity 0.3s ease';

const LABEL_W = 62;
const LABEL_H = 28;
const LABEL_R = 7;
const FONT    = 12;

type Props = {
  pointer: PointerState;
  x: number;
  labelY: number;
  arrowEndY: number;
};

export function PointerLabel({ pointer, x, labelY, arrowEndY }: Props) {
  if (!pointer.visible) return null;

  const lx = x - LABEL_W / 2;
  const arrowStartY = labelY + LABEL_H + 2;

  return (
    <g style={{
      transform: `translate(${x}px, ${labelY}px)`,
      transition: T_MOVE,
    }}>
      {/* Render at local coordinates (0,0) since we're using transform for position */}
      <g style={{ transform: `translate(${-x}px, ${-labelY}px)` }}>
        {/* Label box */}
        <rect
          x={lx} y={labelY}
          width={LABEL_W} height={LABEL_H}
          rx={LABEL_R} ry={LABEL_R}
          fill={pointer.color}
          opacity={0.92}
          style={{ transition: T_COLOR }}
        />
        <text
          x={x} y={labelY + LABEL_H / 2 + FONT * 0.36}
          textAnchor="middle"
          fontSize={FONT} fontWeight="700"
          fontFamily="'JetBrains Mono', monospace"
          fill="#1a1b26"
        >
          {pointer.name}
        </text>

        {/* Downward arrow line */}
        <line
          x1={x} y1={arrowStartY}
          x2={x} y2={arrowEndY - 7}
          stroke={pointer.color}
          strokeWidth={2.5}
          opacity={0.7}
          style={{ transition: T_COLOR }}
        />
        {/* Arrowhead */}
        <polygon
          points={`${x},${arrowEndY} ${x - 5},${arrowEndY - 9} ${x + 5},${arrowEndY - 9}`}
          fill={pointer.color}
          opacity={0.85}
          style={{ transition: T_COLOR }}
        />
      </g>
    </g>
  );
}