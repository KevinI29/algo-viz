/**
 * algo.viz — NodeCircle Entity Renderer
 * =======================================
 * Renders a NODE entity as an SVG circle with its value centered inside.
 * Position represents the CENTER of the circle.
 */

import type { NodeEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { NODE_RADIUS } from '../layout';

const COLORS = {
  default:     { fill: '#1e1e2e', stroke: '#bd93f9', text: '#cdd6f4' },
  highlighted: { fill: '#2d2b55', stroke: '#f1fa8c', text: '#f1fa8c' },
  dimmed:      { fill: '#12121a', stroke: '#313244', text: '#44475a' },
  null:        { fill: '#0f0f0f', stroke: '#44475a', text: '#6272a4' },
};

const FONT_SIZE  = 16;
const TRANSITION = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

type NodeCircleProps = {
  entity: NodeEntity;
  position: PixelPosition; // CENTER of the circle
};

export function NodeCircle({ entity, position }: NodeCircleProps) {
  const { highlighted, dimmed } = entity.style;
  const isNull = entity.value === '∅';

  const colors = isNull
    ? COLORS.null
    : highlighted
    ? COLORS.highlighted
    : dimmed
    ? COLORS.dimmed
    : COLORS.default;

  const opacity = dimmed ? 0.35 : 1;

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      <circle
        cx={position.x}
        cy={position.y}
        r={NODE_RADIUS}
        fill={colors.fill}
        stroke={colors.stroke}
        strokeWidth={highlighted ? 2.5 : 1.5}
        style={{
          transition: TRANSITION,
          filter: highlighted
            ? 'drop-shadow(0 0 10px rgba(241, 250, 140, 0.45))'
            : 'none',
        }}
      />
      <text
        x={position.x}
        y={position.y + FONT_SIZE * 0.36}
        textAnchor="middle"
        fontSize={FONT_SIZE}
        fontWeight={highlighted ? '700' : '500'}
        fontFamily="monospace"
        fill={colors.text}
        style={{ transition: TRANSITION }}
      >
        {entity.value}
      </text>
    </g>
  );
}