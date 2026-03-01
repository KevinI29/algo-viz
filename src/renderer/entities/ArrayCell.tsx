/**
 * algo.viz — ArrayCell Entity Renderer
 * Tokyo Night palette. Scale + lift on highlight. No glow filters.
 */

import type { ArrayCellEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { CELL_WIDTH, CELL_HEIGHT } from '../layout';

const TRANSITION  = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const TRANS_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const VALUE_FONT  = 17;
const INDEX_FONT  = 10;
const INDEX_Y     = 20;
const R           = 7;

const COLORS = {
  default:     { fill: '#1f2335', stroke: '#292e42', text: '#565f89', indexText: '#3b4261' },
  highlighted: { fill: '#1e2a4a', stroke: '#7aa2f7', text: '#c0caf5', indexText: '#7aa2f7' },
  dimmed:      { fill: '#1a1b26', stroke: '#1f2335', text: '#2a2f45', indexText: '#1f2335' },
};

type ArrayCellProps = {
  entity: ArrayCellEntity;
  position: PixelPosition;
};

export function ArrayCell({ entity, position }: ArrayCellProps) {
  const { highlighted, dimmed, color, strokeColor } = entity.style;

  const c = dimmed      ? COLORS.dimmed
          : highlighted ? COLORS.highlighted
          : COLORS.default;

  // Custom colors from UPDATE_STYLE override the theme defaults
  const fill   = color       ?? c.fill;
  const stroke = strokeColor ?? c.stroke;
  const text   = color       ? '#ffffff' : c.text;   // white text on custom colors
  const idx    = color       ? stroke    : c.indexText;

  // Cell center for transform-origin
  const cx = position.x + CELL_WIDTH / 2;
  const cy = position.y + CELL_HEIGHT / 2;

  return (
    <g style={{ transition: TRANSITION }}>
      <g style={{
        transformOrigin: `${cx}px ${cy}px`,
        transform: (highlighted || color) ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
        transition: TRANS_SCALE,
      }}>
        {/* Cell body */}
        <rect
          x={position.x} y={position.y}
          width={CELL_WIDTH} height={CELL_HEIGHT}
          rx={R} ry={R}
          fill={fill}
          stroke={stroke}
          strokeWidth={highlighted || color ? 2 : 1}
          style={{ transition: TRANSITION }}
        />

        {/* Value */}
        <text
          x={position.x + CELL_WIDTH / 2}
          y={position.y + CELL_HEIGHT / 2 + VALUE_FONT * 0.36}
          textAnchor="middle"
          fontSize={VALUE_FONT}
          fontWeight={highlighted || color ? '700' : '500'}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fill={text}
          style={{ transition: TRANSITION }}
        >
          {entity.value}
        </text>

        {/* Index */}
        <text
          x={position.x + CELL_WIDTH / 2}
          y={position.y + CELL_HEIGHT + INDEX_Y}
          textAnchor="middle"
          fontSize={INDEX_FONT}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fill={idx}
          style={{ transition: TRANSITION }}
        >
          {entity.index}
        </text>
      </g>
    </g>
  );
}