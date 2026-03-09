/**
 * Study AI — Bar Renderer (v2)
 * ==============================
 * Proportional-height bar for sorting visualizations.
 * Transitions smoothly between positions, colors, and opacity.
 */

import type { BarState } from '../../templates/types';

const T = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
const T_BOUNCE = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

const BAR_W     = 48;
const MAX_H     = 170;
const MIN_H     = 28;
const RADIUS    = 6;
const BASE_Y    = 240;
const FONT      = 14;

type Props = {
  bar: BarState;
  maxValue: number;
  slotX: (index: number) => number;
  isInStaging?: boolean;
};

export function Bar({ bar, maxValue, slotX, isInStaging }: Props) {
  const ratio = maxValue > 0 ? bar.value / maxValue : 0.5;
  const h = MIN_H + ratio * (MAX_H - MIN_H);

  const cx = slotX(bar.index);
  const x = cx - BAR_W / 2;
  const y = BASE_Y - h;

  const opacity = isInStaging ? 0.25 : bar.opacity;
  const active = bar.highlighted || bar.sorted;

  return (
    <g style={{ transition: T, opacity }}>
      <g style={{
        transformOrigin: `${cx}px ${BASE_Y}px`,
        transform: active ? 'scaleY(1.02) translateY(-2px)' : 'scaleY(1)',
        transition: T_BOUNCE,
      }}>
        <rect
          x={x} y={y} width={BAR_W} height={h}
          rx={RADIUS} ry={RADIUS}
          fill={bar.color}
          style={{ transition: T }}
        />
      </g>

      {/* Value label below */}
      <text
        x={cx} y={BASE_Y + 20}
        textAnchor="middle"
        fontSize={FONT}
        fontWeight={active ? '700' : '500'}
        fontFamily="'JetBrains Mono', monospace"
        fill="#c0caf5"
        style={{ transition: T }}
      >
        {bar.value}
      </text>
    </g>
  );
}

export { BAR_W, BASE_Y, MAX_H, MIN_H };