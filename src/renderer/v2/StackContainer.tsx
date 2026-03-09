/**
 * Study AI — StackContainer Renderer (v2)
 * ==========================================
 * U-shaped container for stack visualizations.
 * Items physically enter from top and pop out.
 */

import type { StackContainerState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const CONTAINER_W = 70;
const CONTAINER_H = 180;
const ITEM_H = 32;
const ITEM_W = 50;
const ITEM_GAP = 4;
const RADIUS = 4;
const WALL = 3;

type Props = {
  stack: StackContainerState;
  x: number;
  y: number;
};

export function StackContainer({ stack, x, y }: Props) {
  const cx = x + CONTAINER_W / 2;
  const bottomY = y + CONTAINER_H;

  return (
    <g style={{ transition: T }}>
      {/* Label */}
      <text
        x={cx} y={y - 10}
        textAnchor="middle"
        fontSize={12}
        fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        fill="#565f89"
      >
        stack
      </text>

      {/* U-shaped container — left wall, bottom, right wall */}
      <path
        d={`M ${x} ${y} L ${x} ${bottomY} L ${x + CONTAINER_W} ${bottomY} L ${x + CONTAINER_W} ${y}`}
        fill="none"
        stroke="rgba(192, 202, 245, 0.4)"
        strokeWidth={WALL}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: T }}
      />

      {/* Items stacked from bottom */}
      {stack.items.map((char, i) => {
        const itemY = bottomY - (i + 1) * (ITEM_H + ITEM_GAP) - ITEM_GAP;
        const itemX = cx - ITEM_W / 2;

        return (
          <g key={`${i}-${char}`} style={{ transition: T }}>
            <rect
              x={itemX} y={itemY}
              width={ITEM_W} height={ITEM_H}
              rx={RADIUS} ry={RADIUS}
              fill="rgba(224, 175, 104, 0.15)"
              stroke="#e0af68"
              strokeWidth={1.5}
              style={{ transition: T }}
            />
            <text
              x={cx} y={itemY + ITEM_H / 2 + 5}
              textAnchor="middle"
              fontSize={16}
              fontWeight="600"
              fontFamily="'JetBrains Mono', monospace"
              fill="#e0af68"
              style={{ transition: T }}
            >
              {char}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export { CONTAINER_W, CONTAINER_H };