/**
 * algo.viz — ArrayCell Entity Renderer (Bar Chart Mode)
 * ======================================================
 * Renders ARRAY_CELL as proportional-height bars.
 * Height scales with value relative to maxValue.
 *
 * Colors:
 *   Default:   teal   (#73daca)
 *   Comparing: orange (#ff9e64) — via UPDATE_STYLE color
 *   Sorted:    green  (#9ece6a) — via UPDATE_STYLE color
 */

import type { ArrayCellEntity } from '../../ir/ir.types';
import type { PixelPosition } from '../layout';
import { CELL_WIDTH, CELL_GAP } from '../layout';

const TRANSITION  = 'all 0.45s cubic-bezier(0.4, 0, 0.2, 1)';
const TRANS_SCALE = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
const BAR_WIDTH   = 48;
const MAX_BAR_H   = 180;   // tallest bar pixel height
const MIN_BAR_H   = 24;    // shortest bar pixel height (so 0 is still visible)
const BAR_RADIUS  = 6;
const VALUE_FONT  = 14;
const BASELINE_Y  = 260;   // bottom edge of all bars

const DEFAULT_COLOR = '#73daca';  // teal
const DIMMED_COLOR  = '#2a3040';
const DIMMED_TEXT   = '#3b4261';

type ArrayCellProps = {
  entity: ArrayCellEntity;
  position: PixelPosition;
  maxValue: number;
};

export function ArrayCell({ entity, position, maxValue }: ArrayCellProps) {
  const { highlighted, dimmed, color } = entity.style;
  const numVal = typeof entity.value === 'number' ? entity.value : parseFloat(String(entity.value)) || 1;

  // Bar height proportional to value
  const ratio  = maxValue > 0 ? numVal / maxValue : 0.5;
  const barH   = MIN_BAR_H + ratio * (MAX_BAR_H - MIN_BAR_H);

  // Bar color
  const barColor = dimmed ? DIMMED_COLOR
                 : color  ? color            // custom color from UPDATE_STYLE
                 : highlighted ? '#ff9e64'   // orange when highlighted
                 : DEFAULT_COLOR;

  const textColor = dimmed ? DIMMED_TEXT : '#c0caf5';

  // Position: center the bar within the cell slot
  const cx   = position.x + CELL_WIDTH / 2;
  const barX = cx - BAR_WIDTH / 2;
  const barY = BASELINE_Y - barH;

  const isActive = highlighted || !!color;

  return (
    <g style={{ transition: TRANSITION }}>
      <g style={{
        transformOrigin: `${cx}px ${BASELINE_Y}px`,
        transform: isActive ? 'scaleY(1.02) translateY(-2px)' : 'scaleY(1)',
        transition: TRANS_SCALE,
      }}>
        {/* Bar */}
        <rect
          x={barX}
          y={barY}
          width={BAR_WIDTH}
          height={barH}
          rx={BAR_RADIUS}
          ry={BAR_RADIUS}
          fill={barColor}
          opacity={dimmed ? 0.4 : 0.9}
          style={{ transition: TRANSITION }}
        />
      </g>

      {/* Value label below bar */}
      <text
        x={cx}
        y={BASELINE_Y + 22}
        textAnchor="middle"
        fontSize={VALUE_FONT}
        fontWeight={isActive ? '700' : '500'}
        fontFamily="'JetBrains Mono', 'Fira Code', monospace"
        fill={textColor}
        opacity={dimmed ? 0.3 : 1}
        style={{ transition: TRANSITION }}
      >
        {entity.value}
      </text>
    </g>
  );
}