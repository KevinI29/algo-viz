/**
 * Study AI — Bar Renderer (Phase 5)
 * ====================================
 * ONE persistent DOM element per bar. Position controlled via CSS
 * transform: translate(). When target position changes, the browser
 * smoothly interpolates the movement.
 *
 * No conditional rendering. No unmount/remount. Just coordinate changes.
 */

import type { BarState } from '../../templates/types';

const T_MOVE  = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const T_COLOR = 'fill 0.3s ease, opacity 0.3s ease';
const T_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';

const BAR_W  = 48;
const MAX_H  = 170;
const MIN_H  = 28;
const RADIUS = 6;
const FONT   = 14;

type Props = {
  bar: BarState;
  maxValue: number;
  targetX: number;       // center X where bar should be
  targetY: number;       // baseline Y (bottom of bar)
  isStaged: boolean;
  slotX: number;         // center X of array slot (for ghost)
  slotBaseY: number;     // baseline Y of array (for ghost)
};

export function Bar({ bar, maxValue, targetX, targetY, isStaged, slotX, slotBaseY }: Props) {
  const ratio = maxValue > 0 ? bar.value / maxValue : 0.5;
  const h = MIN_H + ratio * (MAX_H - MIN_H);
  const active = bar.highlighted || bar.sorted;

  // Target position for the bar rect (top-left corner)
  const tx = targetX - BAR_W / 2;
  const ty = targetY - h;

  const scale = active && !isStaged ? 'scale(1.04) translateY(-3px)' : 'scale(1)';

  return (
    <g>
      {/* Ghost outline at array slot when bar is in staging */}
      {isStaged && (
        <g style={{ opacity: 0.5, transition: 'opacity 0.3s ease' }}>
          <rect
            x={slotX - BAR_W / 2} y={slotBaseY - h}
            width={BAR_W} height={h}
            rx={RADIUS} ry={RADIUS}
            fill="none"
            stroke="rgba(192,202,245,0.12)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
          <text
            x={slotX} y={slotBaseY + 20}
            textAnchor="middle" fontSize={FONT - 1} fontWeight="400"
            fontFamily="'JetBrains Mono', monospace"
            fill="rgba(192,202,245,0.15)"
          >
            {bar.value}
          </text>
        </g>
      )}

      {/* Actual bar — position via translate, animated by CSS */}
      <g style={{ transform: `translate(${tx}px, ${ty}px)`, transition: T_MOVE }}>
        <g style={{
          transformOrigin: `${BAR_W / 2}px ${h}px`,
          transform: scale,
          transition: T_SCALE,
        }}>
          <rect
            width={BAR_W} height={h}
            rx={RADIUS} ry={RADIUS}
            fill={bar.color}
            opacity={bar.opacity}
            style={{ transition: T_COLOR }}
          />
        </g>
        <text
          x={BAR_W / 2} y={h + 20}
          textAnchor="middle" fontSize={FONT}
          fontWeight={active ? '700' : '500'}
          fontFamily="'JetBrains Mono', monospace"
          fill="#c0caf5"
          style={{ transition: 'fill 0.3s ease' }}
        >
          {bar.value}
        </text>
      </g>
    </g>
  );
}

export { BAR_W, MAX_H, MIN_H, RADIUS };