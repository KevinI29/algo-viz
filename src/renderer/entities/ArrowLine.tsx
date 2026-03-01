/**
 * algo.viz — ArrowLine Entity Renderer
 * Tokyo Night palette. No glow filters — color change only on highlight.
 */

import type { ArrowEntity, Scene } from '../../ir/ir.types';
import { getArrowPoints } from '../layout';

const TRANSITION      = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const ARROW_HEAD_SIZE = 9;

type ArrowLineProps = {
  entity: ArrowEntity;
  scene: Scene;
};

export function ArrowLine({ entity, scene }: ArrowLineProps) {
  const { highlighted, dimmed } = entity.style;
  const points = getArrowPoints(entity.fromId, entity.toId, scene);
  if (!points) return null;

  const { x1, y1, x2, y2 } = points;
  const opacity = dimmed ? 0.15 : 1;

  // Tokyo Night: muted default, bright blue on highlight
  const stroke      = highlighted ? '#7aa2f7' : '#3b4261';
  const strokeWidth = highlighted ? 2.2 : 1.5;

  const angle = Math.atan2(y2 - y1, x2 - x1);
  const hx1 = x2 - ARROW_HEAD_SIZE * Math.cos(angle - Math.PI / 7);
  const hy1 = y2 - ARROW_HEAD_SIZE * Math.sin(angle - Math.PI / 7);
  const hx2 = x2 - ARROW_HEAD_SIZE * Math.cos(angle + Math.PI / 7);
  const hy2 = y2 - ARROW_HEAD_SIZE * Math.sin(angle + Math.PI / 7);

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{ transition: TRANSITION }}
      />
      <polygon
        points={`${x2},${y2} ${hx1},${hy1} ${hx2},${hy2}`}
        fill={stroke}
        style={{ transition: TRANSITION }}
      />
    </g>
  );
}
