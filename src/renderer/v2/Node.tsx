/**
 * Study AI — Node Renderer (Phase 5)
 * =====================================
 * Circle node with smooth CSS transitions for:
 * - Color changes (unvisited → processing → visited)
 * - Scale pulse on highlight
 * - Position changes (for future use)
 */

import type { NodeState } from '../../templates/types';

const T_COLOR = 'fill 0.4s ease, stroke 0.4s ease, opacity 0.4s ease';
const T_SCALE = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
const RADIUS = 28;
const FONT = 15;

type Props = {
  node: NodeState;
  cx: number;
  cy: number;
};

export function Node({ node, cx, cy }: Props) {
  const active = node.highlighted;

  // Scale: pulse up when being processed, settle when visited
  const scale = active ? 'scale(1.18)' : 'scale(1)';

  // Text color adapts to background
  const textFill = active ? '#ffffff'
    : node.visited ? '#2a2040'
    : '#1a1b26';

  return (
    <g style={{
      transformOrigin: `${cx}px ${cy}px`,
      transform: scale,
      transition: T_SCALE,
    }}>
      {/* Glow ring when active */}
      {active && (
        <circle
          cx={cx} cy={cy} r={RADIUS + 6}
          fill="none"
          stroke={node.color}
          strokeWidth={2}
          opacity={0.3}
          style={{ transition: T_COLOR }}
        />
      )}

      {/* Main circle */}
      <circle
        cx={cx} cy={cy} r={RADIUS}
        fill={node.color}
        stroke={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}
        strokeWidth={active ? 2.5 : 1.5}
        opacity={node.opacity}
        style={{ transition: T_COLOR }}
      />

      {/* Specular highlight */}
      <circle
        cx={cx - RADIUS * 0.2} cy={cy - RADIUS * 0.25}
        r={RADIUS * 0.18}
        fill="white"
        opacity={active ? 0.15 : 0.06}
        style={{ transition: 'opacity 0.4s ease' }}
      />

      {/* Value */}
      <text
        x={cx} y={cy + FONT * 0.36}
        textAnchor="middle"
        fontSize={FONT}
        fontWeight={active ? '700' : '500'}
        fontFamily="'JetBrains Mono', monospace"
        fill={textFill}
        style={{ transition: 'fill 0.4s ease' }}
      >
        {node.value}
      </text>
    </g>
  );
}

export { RADIUS as NODE_RADIUS };