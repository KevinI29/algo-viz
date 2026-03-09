/**
 * Study AI — StringDisplay Renderer (v2)
 * =========================================
 * Characters of a string laid out horizontally with a scanning arrow.
 * Matched characters dim out. Current scan position highlighted.
 */

import type { StringDisplayState } from '../../templates/types';

const T = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
const CHAR_W = 40;
const CHAR_H = 44;
const CHAR_GAP = 6;
const CHAR_FONT = 24;
const ARROW_H = 36;
const RADIUS = 6;

type Props = {
  display: StringDisplayState;
  x: number;
  y: number;
};

export function StringDisplay({ display, x, y }: Props) {
  const totalW = display.chars.length * (CHAR_W + CHAR_GAP) - CHAR_GAP;
  const startX = x - totalW / 2;
  const arrowY = y - ARROW_H - 8;

  return (
    <g style={{ transition: T }}>
      {/* Quote marks */}
      <text
        x={startX - 18} y={y + CHAR_H / 2 + CHAR_FONT * 0.3}
        fontSize={CHAR_FONT}
        fontWeight="400"
        fontFamily="'JetBrains Mono', monospace"
        fill="#565f89"
      >"</text>
      <text
        x={startX + totalW + 8} y={y + CHAR_H / 2 + CHAR_FONT * 0.3}
        fontSize={CHAR_FONT}
        fontWeight="400"
        fontFamily="'JetBrains Mono', monospace"
        fill="#565f89"
      >"</text>

      {/* Characters */}
      {display.chars.map((char, i) => {
        const cx = startX + i * (CHAR_W + CHAR_GAP) + CHAR_W / 2;
        const cy = y + CHAR_H / 2;
        const isMatched = display.matchedIndices.includes(i);
        const isCurrent = display.scanIndex === i;

        return (
          <g key={i} style={{ transition: T }}>
            {/* Background highlight for current */}
            {isCurrent && (
              <rect
                x={cx - CHAR_W / 2 - 2} y={y - 2}
                width={CHAR_W + 4} height={CHAR_H + 4}
                rx={RADIUS} ry={RADIUS}
                fill="rgba(224, 175, 104, 0.12)"
                stroke="rgba(224, 175, 104, 0.3)"
                strokeWidth={1}
                style={{ transition: T }}
              />
            )}

            {/* Character */}
            <text
              x={cx} y={cy + CHAR_FONT * 0.3}
              textAnchor="middle"
              fontSize={CHAR_FONT}
              fontWeight={isCurrent ? '800' : '500'}
              fontFamily="'JetBrains Mono', monospace"
              fill={isMatched ? '#3b4261' : isCurrent ? '#e0af68' : '#c0caf5'}
              opacity={isMatched ? 0.4 : 1}
              style={{ transition: T }}
            >
              {char}
            </text>
          </g>
        );
      })}

      {/* Scan arrow */}
      {display.scanIndex >= 0 && display.scanIndex < display.chars.length && (
        <g style={{ transition: T }}>
          {(() => {
            const arrowCx = startX + display.scanIndex * (CHAR_W + CHAR_GAP) + CHAR_W / 2;
            return (
              <>
                {/* Arrow body */}
                <rect
                  x={arrowCx - 10} y={arrowY}
                  width={20} height={ARROW_H - 10}
                  rx={4} ry={4}
                  fill="rgba(247, 118, 142, 0.7)"
                  style={{ transition: T }}
                />
                {/* Arrow head */}
                <polygon
                  points={`${arrowCx},${arrowY + ARROW_H} ${arrowCx - 12},${arrowY + ARROW_H - 14} ${arrowCx + 12},${arrowY + ARROW_H - 14}`}
                  fill="rgba(247, 118, 142, 0.7)"
                  style={{ transition: T }}
                />
              </>
            );
          })()}
        </g>
      )}
    </g>
  );
}

export { CHAR_W, CHAR_GAP, CHAR_H, ARROW_H };