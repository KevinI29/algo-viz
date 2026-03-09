/**
 * Study AI — StagingArea Renderer (v2)
 * =======================================
 * The "temp = [bar]" container shown during sorting swaps.
 * Bar physically lives here while adjacent elements slide.
 */

import type { StagingState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const T_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';

const AREA_W = 80;
const AREA_H = 200;
const BAR_W  = 42;
const MIN_BAR_H = 24;
const MAX_BAR_H = 150;
const RADIUS = 8;

type Props = {
  staging: StagingState;
  x: number;
  y: number;
  maxValue: number;
};

export function StagingArea({ staging, x, y, maxValue }: Props) {
  const cx = x + AREA_W / 2;
  const barBaseY = y + AREA_H - 16;
  const visible = staging.visible && staging.value !== null;

  const ratio = staging.value && maxValue > 0 ? staging.value / maxValue : 0;
  const barH = MIN_BAR_H + ratio * (MAX_BAR_H - MIN_BAR_H);

  return (
    <g style={{ transition: T, opacity: visible ? 1 : 0.3 }}>
      {/* Container outline */}
      <rect
        x={x} y={y}
        width={AREA_W} height={AREA_H}
        rx={RADIUS} ry={RADIUS}
        fill="rgba(26, 27, 38, 0.6)"
        stroke="rgba(65, 72, 104, 0.3)"
        strokeWidth={1}
        strokeDasharray="4 3"
        style={{ transition: T }}
      />

      {/* Label */}
      <text
        x={cx} y={y - 10}
        textAnchor="middle"
        fontSize={12}
        fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        fill="#565f89"
        style={{ transition: T }}
      >
        {staging.label}
      </text>

      {/* Bar inside staging area */}
      {visible && staging.value !== null && (
        <g style={{
          transformOrigin: `${cx}px ${barBaseY}px`,
          transform: 'scale(1)',
          transition: T_SCALE,
        }}>
          <rect
            x={cx - BAR_W / 2}
            y={barBaseY - barH}
            width={BAR_W}
            height={barH}
            rx={5} ry={5}
            fill={staging.barColor}
            opacity={0.9}
            style={{ transition: T }}
          />
          <text
            x={cx}
            y={barBaseY + 16}
            textAnchor="middle"
            fontSize={13}
            fontWeight="700"
            fontFamily="'JetBrains Mono', monospace"
            fill="#c0caf5"
          >
            {staging.value}
          </text>
        </g>
      )}

      {/* "= " prefix when value present */}
      {visible && (
        <text
          x={x - 4} y={y + AREA_H / 2 + 5}
          textAnchor="end"
          fontSize={14}
          fontWeight="600"
          fontFamily="'JetBrains Mono', monospace"
          fill="#565f89"
        >
          =
        </text>
      )}
    </g>
  );
}

export { AREA_W, AREA_H };