/**
 * algo.viz — ArrayCell Entity Renderer
 * ======================================
 * Renders a single ARRAY_CELL entity as an SVG rectangle with value and index.
 * CSS transitions handle smooth state changes between steps.
 */

import type { ArrayCellEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { CELL_WIDTH, CELL_HEIGHT } from '../layout';

const COLORS = {
  default:     { fill: '#1e1e2e', stroke: '#44475a',  text: '#cdd6f4', index: '#6272a4' },
  highlighted: { fill: '#2a2a4a', stroke: '#f1fa8c',  text: '#f1fa8c', index: '#6272a4' },
  dimmed:      { fill: '#12121a', stroke: '#2a2a3d',  text: '#44475a', index: '#2a2a3d' },
};

const CORNER_RADIUS = 6;
const VALUE_FONT_SIZE = 18;
const INDEX_FONT_SIZE = 11;
const INDEX_OFFSET_Y = 22;
const TRANSITION = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

type ArrayCellProps = {
  entity: ArrayCellEntity;
  position: PixelPosition;
};

export function ArrayCell({ entity, position }: ArrayCellProps) {
  const { highlighted, dimmed } = entity.style;
  const colors = highlighted ? COLORS.highlighted : dimmed ? COLORS.dimmed : COLORS.default;
  const opacity = dimmed ? 0.35 : 1;

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      <rect
        x={position.x} y={position.y}
        width={CELL_WIDTH} height={CELL_HEIGHT}
        rx={CORNER_RADIUS} ry={CORNER_RADIUS}
        fill={colors.fill} stroke={colors.stroke}
        strokeWidth={highlighted ? 2.5 : 1.5}
        style={{
          transition: TRANSITION,
          filter: highlighted ? 'drop-shadow(0 0 8px rgba(241, 250, 140, 0.4))' : 'none',
        }}
      />
      <text
        x={position.x + CELL_WIDTH / 2}
        y={position.y + CELL_HEIGHT / 2 + VALUE_FONT_SIZE * 0.35}
        textAnchor="middle" fontSize={VALUE_FONT_SIZE}
        fontWeight={highlighted ? '700' : '500'} fontFamily="monospace"
        fill={colors.text} style={{ transition: TRANSITION }}
      >
        {entity.value}
      </text>
      <text
        x={position.x + CELL_WIDTH / 2} y={position.y + CELL_HEIGHT + INDEX_OFFSET_Y}
        textAnchor="middle" fontSize={INDEX_FONT_SIZE}
        fontFamily="monospace" fill={colors.index} style={{ transition: TRANSITION }}
      >
        {entity.index}
      </text>
    </g>
  );
}