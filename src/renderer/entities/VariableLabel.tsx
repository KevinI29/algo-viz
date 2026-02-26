/**
 * algo.viz — VariableLabel Entity Renderer
 * ==========================================
 * Renders a VARIABLE_LABEL as a rectangle above its target cell.
 * Smoothly animates position when targetId changes between steps.
 */

import type { VariableLabelEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { LABEL_WIDTH, LABEL_HEIGHT, CELL_Y, CELL_WIDTH } from '../layout';

const COLORS = {
  default:     { fill: '#313244', stroke: '#bd93f9', text: '#bd93f9', line: '#6272a4' },
  highlighted: { fill: '#44475a', stroke: '#f1fa8c', text: '#f1fa8c', line: '#f1fa8c' },
  dimmed:      { fill: '#1a1a2a', stroke: '#44475a', text: '#44475a', line: '#2a2a3d' },
};

const CORNER_RADIUS = 6;
const FONT_SIZE = 13;
const TRANSITION = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';

type VariableLabelProps = {
  entity: VariableLabelEntity;
  position: PixelPosition;
  targetPosition: PixelPosition;
};

export function VariableLabel({ entity, position, targetPosition }: VariableLabelProps) {
  const { highlighted, dimmed } = entity.style;
  const colors = highlighted ? COLORS.highlighted : dimmed ? COLORS.dimmed : COLORS.default;
  const opacity = dimmed ? 0.35 : 1;

  const lineX  = position.x + LABEL_WIDTH / 2;
  const lineY1 = position.y + LABEL_HEIGHT;
  const lineX2 = targetPosition.x + CELL_WIDTH / 2;
  const lineY2 = CELL_Y;

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      {/* Connector line */}
      <line
        x1={lineX} y1={lineY1} x2={lineX2} y2={lineY2}
        stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 3"
        style={{ transition: TRANSITION }}
      />
      {/* Arrowhead */}
      <polygon
        points={`${lineX2},${lineY2} ${lineX2 - 5},${lineY2 - 10} ${lineX2 + 5},${lineY2 - 10}`}
        fill={colors.line}
        style={{ transition: TRANSITION }}
      />
      {/* Label box */}
      <rect
        x={position.x} y={position.y}
        width={LABEL_WIDTH} height={LABEL_HEIGHT}
        rx={CORNER_RADIUS} ry={CORNER_RADIUS}
        fill={colors.fill} stroke={colors.stroke}
        strokeWidth={highlighted ? 2 : 1.5}
        style={{
          transition: TRANSITION,
          filter: highlighted ? 'drop-shadow(0 0 6px rgba(241,250,140,0.35))' : 'none',
        }}
      />
      {/* Label text */}
      <text
        x={position.x + LABEL_WIDTH / 2}
        y={position.y + LABEL_HEIGHT / 2 + FONT_SIZE * 0.35}
        textAnchor="middle" fontSize={FONT_SIZE}
        fontWeight="600" fontFamily="monospace"
        fill={colors.text} style={{ transition: TRANSITION }}
      >
        {entity.name}
      </text>
    </g>
  );
}