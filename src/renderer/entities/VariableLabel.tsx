/**
 * algo.viz — VariableLabel Entity Renderer
 * Tokyo Night palette. Scale on highlight.
 */

import type { VariableLabelEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { LABEL_WIDTH, LABEL_HEIGHT, CELL_Y, CELL_WIDTH, NODE_CY, NODE_RADIUS } from '../layout';

const TRANSITION  = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const TRANS_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const FONT_SIZE   = 12;
const R           = 6;

// Per-variable accent colors — Tokyo Night semantic tokens
const LABEL_COLORS: Record<string, { fill: string; stroke: string; text: string; line: string }> = {
  current: { fill: '#1a2a3a', stroke: '#73daca', text: '#b4f9f8', line: '#73daca' },
  prev:    { fill: '#2a1a3a', stroke: '#bb9af7', text: '#cba6f7', line: '#bb9af7' },
  next:    { fill: '#1a2040', stroke: '#7aa2f7', text: '#a9c8ff', line: '#7aa2f7' },
  mid:     { fill: '#2a1e0a', stroke: '#e0af68', text: '#f5c06a', line: '#e0af68' },
  left:    { fill: '#0a2028', stroke: '#7dcfff', text: '#a4d8ff', line: '#7dcfff' },
  right:   { fill: '#2a0a18', stroke: '#f7768e', text: '#ffb3c1', line: '#f7768e' },
  low:     { fill: '#1a2a3a', stroke: '#73daca', text: '#b4f9f8', line: '#73daca' },
  high:    { fill: '#2a0a18', stroke: '#f7768e', text: '#ffb3c1', line: '#f7768e' },
  default: { fill: '#1f2335', stroke: '#414868', text: '#a9b1d6', line: '#414868' },
};

function getColors(name: string, highlighted: boolean, dimmed: boolean) {
  if (dimmed) return { fill: '#1a1b26', stroke: '#292e42', text: '#2a2f45', line: '#292e42' };
  const key = Object.keys(LABEL_COLORS).find(k => name.toLowerCase().includes(k)) ?? 'default';
  const base = LABEL_COLORS[key];
  if (highlighted) return { ...base, stroke: '#c0caf5', text: '#ffffff' };
  return base;
}

type VariableLabelProps = {
  entity: VariableLabelEntity;
  position: PixelPosition;
  targetPosition: PixelPosition;
  targetType?: string;
};

export function VariableLabel({ entity, position, targetPosition, targetType }: VariableLabelProps) {
  const { highlighted, dimmed } = entity.style;
  const colors  = getColors(entity.name, !!highlighted, !!dimmed);
  const opacity = dimmed ? 0.3 : 1;

  const lineX1 = position.x + LABEL_WIDTH / 2;
  const lineY1 = position.y + LABEL_HEIGHT;

  const targetCenterX = targetType === 'NODE'
    ? targetPosition.x
    : targetPosition.x + CELL_WIDTH / 2;
  const lineY2 = targetType === 'NODE'
    ? NODE_CY - NODE_RADIUS - 4
    : CELL_Y - 4;

  // Center of label box for transform-origin
  const lcx = position.x + LABEL_WIDTH / 2;
  const lcy = position.y + LABEL_HEIGHT / 2;

  return (
    <g style={{ transition: TRANSITION }} opacity={opacity}>
      {/* Connector line */}
      <line
        x1={lineX1} y1={lineY1}
        x2={targetCenterX} y2={lineY2}
        stroke={colors.line}
        strokeWidth={1.5}
        strokeDasharray="3 3"
        strokeOpacity="0.6"
        style={{ transition: TRANSITION }}
      />
      {/* Arrowhead */}
      <polygon
        points={`${targetCenterX},${lineY2+2} ${targetCenterX-4},${lineY2-7} ${targetCenterX+4},${lineY2-7}`}
        fill={colors.line}
        fillOpacity="0.8"
        style={{ transition: TRANSITION }}
      />

      {/* Label box with scale on highlight */}
      <g style={{
        transformOrigin: `${lcx}px ${lcy}px`,
        transform: highlighted ? 'scale(1.08) translateY(-2px)' : 'scale(1)',
        transition: TRANS_SCALE,
      }}>
        <rect
          x={position.x} y={position.y}
          width={LABEL_WIDTH} height={LABEL_HEIGHT}
          rx={R} ry={R}
          fill={colors.fill}
          stroke={colors.stroke}
          strokeWidth={highlighted ? 1.5 : 1}
          style={{ transition: TRANSITION }}
        />
        <text
          x={position.x + LABEL_WIDTH / 2}
          y={position.y + LABEL_HEIGHT / 2 + FONT_SIZE * 0.36}
          textAnchor="middle"
          fontSize={FONT_SIZE}
          fontWeight={highlighted ? '700' : '600'}
          fontFamily="'JetBrains Mono', 'Fira Code', monospace"
          fill={colors.text}
          style={{ transition: TRANSITION }}
        >
          {entity.name}
        </text>
      </g>
    </g>
  );
}
