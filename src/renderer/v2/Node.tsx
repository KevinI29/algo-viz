/**
 * Study AI — Node Renderer (v2)
 * ================================
 * Circle node for tree and linked list visualizations.
 * Supports color states: unvisited, processing, visited.
 */

import type { NodeState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const T_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const RADIUS = 28;
const FONT = 15;

type Props = {
  node: NodeState;
  cx: number;
  cy: number;
};

export function Node({ node, cx, cy }: Props) {
  const active = node.highlighted;
  const scale = active ? 'scale(1.15) translateY(-3px)' : 'scale(1)';

  // Subtle specular highlight
  const specOpacity = active ? 0.14 : 0.06;

  return (
    <g style={{ transition: T, opacity: node.opacity }}>
      <g style={{
        transformOrigin: `${cx}px ${cy}px`,
        transform: scale,
        transition: T_SCALE,
      }}>
        {/* Shadow */}
        {active && (
          <circle
            cx={cx} cy={cy + 2} r={RADIUS + 4}
            fill={node.color}
            opacity={0.15}
            style={{ transition: T }}
          />
        )}

        {/* Main circle */}
        <circle
          cx={cx} cy={cy} r={RADIUS}
          fill={node.color}
          stroke={active ? '#ffffff' : 'rgba(255,255,255,0.15)'}
          strokeWidth={active ? 2.5 : 1.5}
          style={{ transition: T }}
        />

        {/* Specular highlight */}
        <circle
          cx={cx - RADIUS * 0.22}
          cy={cy - RADIUS * 0.26}
          r={RADIUS * 0.2}
          fill="white"
          opacity={specOpacity}
          style={{ transition: T }}
        />

        {/* Value text */}
        <text
          x={cx} y={cy + FONT * 0.36}
          textAnchor="middle"
          fontSize={FONT}
          fontWeight={active ? '700' : '500'}
          fontFamily="'JetBrains Mono', monospace"
          fill={active ? '#ffffff' : '#1a1b26'}
          style={{ transition: T }}
        >
          {node.value}
        </text>
      </g>
    </g>
  );
}

export { RADIUS as NODE_RADIUS };