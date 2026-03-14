/**
 * Study AI — Sorting Scene (Phase 5)
 * =====================================
 * Computes target pixel positions for each bar.
 * When isStaged, target moves to staging area center.
 * When in array, target is the slot position.
 * Bar component animates between positions via CSS transform.
 */

import type { AnimationFrame, BarState, StagingState } from '../../templates/types';
import { Bar, BAR_W } from './Bar';
import { StagingArea, AREA_W, AREA_H } from './StagingArea';

const CANVAS_W = 700;
const CANVAS_H = 300;
const SLOT_GAP = 12;
const STAGING_X = 16;
const BASE_Y = 240;                       // array baseline
const STAGING_Y = BASE_Y - AREA_H;        // staging container top
const STAGING_BASE_Y = BASE_Y - 20;       // baseline inside staging area

type Props = {
  frame: AnimationFrame;
};

export function SortingScene({ frame }: Props) {
  const entities = frame.entities;

  const bars = Object.values(entities).filter(
    (e): e is BarState => e.entityType === 'bar'
  ).sort((a, b) => a.index - b.index);

  const staging = Object.values(entities).find(
    (e): e is StagingState => e.entityType === 'staging'
  );

  const maxValue = bars.reduce((max, b) => Math.max(max, b.value), 1);

  // Array slot positions
  const barAreaStartX = STAGING_X + AREA_W + 50;
  const totalBarWidth = bars.length * (BAR_W + SLOT_GAP) - SLOT_GAP;
  const barStartX = barAreaStartX + (CANVAS_W - barAreaStartX - totalBarWidth) / 2;

  function slotCenterX(index: number): number {
    return barStartX + index * (BAR_W + SLOT_GAP) + BAR_W / 2;
  }

  // Staging area center
  const stagingCenterX = STAGING_X + AREA_W / 2;

  return (
    <svg
      width="100%" height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ overflow: 'visible', maxWidth: 700 }}
    >
      {/* Background */}
      <defs>
        <pattern id="sort-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill="#292e42" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="#1a1b26" />
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#sort-grid)" />

      {/* Staging area container (just the outline + label) */}
      {staging && (
        <StagingArea
          staging={staging}
          x={STAGING_X}
          y={STAGING_Y}
        />
      )}

      {/* Bars — each gets a computed target position */}
      {bars.map(bar => {
        const isStaged = bar.isStaged;

        // Target position: staging area or array slot
        const targetX = isStaged ? stagingCenterX : slotCenterX(bar.index);
        const targetY = isStaged ? STAGING_BASE_Y : BASE_Y;

        return (
          <Bar
            key={bar.id}
            bar={bar}
            maxValue={maxValue}
            targetX={targetX}
            targetY={targetY}
            isStaged={isStaged}
            slotX={slotCenterX(bar.index)}
            slotBaseY={BASE_Y}
          />
        );
      })}
    </svg>
  );
}