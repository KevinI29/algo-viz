/**
 * algo.viz — ArrowLine Entity Renderer
 * ======================================
 * Renders an ARROW entity as a directed SVG line with an arrowhead.
 * Endpoints are computed by the layout engine (circle-edge aware).
 */

import type { ArrowEntity } from '../../ir/ir.types';
import type { Scene } from '../../ir/ir.types';
import { getArrowPoints } from '../layout';

const COLORS = {
  default:     { stroke: '#6272a4', head: '#6272a4' },
  highlighted: { stroke: '#f1fa8c', head: '#f1fa8c' },
  dimmed:      { stroke: '#2a2a3d', head: '#2a2a3d' },
};

const TRANSITION = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
const ARROW_HEAD_SIZE = 8;

type ArrowLineProps = {
  entity: ArrowEntity;
  scene: Scene;
};

export function ArrowLine({ entity, scene }: ArrowLineProps) {
  const { highlighted, dimmed } = entity.style;
  const colors = highlighted ? COLORS.highlighted : dimmed ? COLORS.dimmed : COLORS.default;
  const opacity = dimmed ? 0.3 : 1;

  const points = getArrowPoints(entity.fromId, entity.toId, scene);
  if (!points) return null;

  const { x1, y1, x2, y2 } = points;

  // Compute arrowhead angle
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headX1 = x2 - ARROW_HEAD_SIZE * Math.cos(angle - Math.PI / 7);
  const headY1 = y2 - ARROW_HEAD_SIZE * Math.sin(angle - Math.PI / 7);
  const headX2 = x2 - ARROW_HEAD_SIZE * Math.cos(angle + Math.PI / 7);
  const headY2 = y2 - ARROW_HEAD_SIZE * Math.sin(angle + Math.PI / 7);

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      {/* Shaft */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={colors.stroke}
        strokeWidth={highlighted ? 2 : 1.5}
        style={{ transition: TRANSITION }}
      />
      {/* Arrowhead */}
      <polygon
        points={`${x2},${y2} ${headX1},${headY1} ${headX2},${headY2}`}
        fill={colors.head}
        style={{ transition: TRANSITION }}
      />
    </g>
  );
}