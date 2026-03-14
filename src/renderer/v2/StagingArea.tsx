/**
 * Study AI — StagingArea Renderer (Phase 5)
 * ============================================
 * Just the container outline and label. The actual bar physically
 * travels here via CSS transform — no need to render a duplicate.
 */

import type { StagingState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

const AREA_W  = 90;
const AREA_H  = 200;
const RADIUS  = 8;

type Props = {
  staging: StagingState;
  x: number;
  y: number;
};

export function StagingArea({ staging, x, y }: Props) {
  const cx = x + AREA_W / 2;
  const active = staging.visible && staging.value !== null;

  return (
    <g>
      {/* Container outline */}
      <rect
        x={x} y={y}
        width={AREA_W} height={AREA_H}
        rx={RADIUS} ry={RADIUS}
        fill={active ? 'rgba(255,158,100,0.04)' : 'rgba(26,27,38,0.3)'}
        stroke={active ? 'rgba(255,158,100,0.35)' : 'rgba(65,72,104,0.15)'}
        strokeWidth={active ? 1.5 : 1}
        strokeDasharray="4 3"
        style={{ transition: T }}
      />

      {/* Label */}
      <text
        x={cx} y={y - 10}
        textAnchor="middle"
        fontSize={13} fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        fill={active ? '#ff9e64' : '#3b4261'}
        style={{ transition: T }}
      >
        {staging.label}
      </text>

      {/* "=" sign */}
      <text
        x={x + AREA_W + 10}
        y={y + AREA_H / 2 + 5}
        fontSize={16} fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        fill={active ? '#565f89' : 'transparent'}
        style={{ transition: T }}
      >
        =
      </text>
    </g>
  );
}

export { AREA_W, AREA_H };