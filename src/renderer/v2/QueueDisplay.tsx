/**
 * Study AI — QueueDisplay Renderer (v2)
 * ========================================
 * Shows a labeled list of values: "queue: [21, 76]" or "results: [47, 21]"
 * Values animate in/out with transitions.
 */

import type { QueueDisplayState } from '../../templates/types';

const T = 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
const FONT_LABEL = 13;
const FONT_VALUE = 16;

type Props = {
  display: QueueDisplayState;
  x: number;
  y: number;
};

export function QueueDisplay({ display, x, y }: Props) {
  const valStr = display.values.length > 0
    ? display.values.join(', ')
    : ' ';

  return (
    <g style={{ transition: T }}>
      {/* Label */}
      <text
        x={x} y={y}
        fontSize={FONT_LABEL}
        fontWeight="600"
        fontFamily="'Syne', sans-serif"
        fill="#565f89"
        style={{ transition: T }}
      >
        {display.label}
      </text>

      {/* Values in brackets */}
      <text
        x={x} y={y + 28}
        fontSize={FONT_VALUE}
        fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        fill="#c0caf5"
        style={{ transition: T }}
      >
        [{valStr}]
      </text>
    </g>
  );
}