/**
 * algo.viz — NodeCircle Entity Renderer
 * Tokyo Night palette. Scale + lift on highlight. No glow filters.
 */

import type { NodeEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { NODE_RADIUS } from '../layout';

const TRANSITION  = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const TRANS_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const FONT_SIZE   = 15;

const COLORS = {
  default:     { fill: '#292e42', stroke: '#414868', text: '#a9b1d6' },
  highlighted: { fill: '#364a82', stroke: '#7aa2f7', text: '#c0caf5' },
  dimmed:      { fill: '#1f2335', stroke: '#292e42', text: '#3b4261' },
  null:        { fill: '#1f2335', stroke: '#292e42', text: '#3b4261' },
};

type NodeCircleProps = {
  entity: NodeEntity;
  position: PixelPosition;
  index: number;
};

export function NodeCircle({ entity, position }: NodeCircleProps) {
  const { highlighted, dimmed } = entity.style;
  const isNull = entity.value === '∅';

  const c = dimmed      ? COLORS.dimmed
          : isNull      ? COLORS.null
          : highlighted ? COLORS.highlighted
          : COLORS.default;

  const scale = highlighted ? 'scale(1.13)' : 'scale(1)';

  return (
    <g style={{ transition: TRANSITION }}>
      <g style={{
        transformOrigin: `${position.x}px ${position.y}px`,
        transform: highlighted ? `${scale} translateY(-3px)` : scale,
        transition: TRANS_SCALE,
      }}>
        <circle
          cx={position.x} cy={position.y} r={NODE_RADIUS}
          fill={c.fill}
          stroke={c.stroke}
          strokeWidth={highlighted ? 2 : 1.5}
          style={{ transition: TRANSITION }}
        />
        <circle
          cx={position.x - NODE_RADIUS * 0.22}
          cy={position.y - NODE_RADIUS * 0.28}
          r={NODE_RADIUS * 0.18}
          fill="white"
          fillOpacity={highlighted ? 0.12 : 0.05}
          style={{ transition: TRANSITION }}
        />
        <text
          x={position.x}
          y={position.y + FONT_SIZE * 0.36}
          textAnchor="middle"
          fontSize={FONT_SIZE}
          fontWeight={highlighted ? '700' : '500'}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fill={c.text}
          style={{ transition: TRANSITION }}
        >
          {entity.value}
        </text>
      </g>
    </g>
  );
}
