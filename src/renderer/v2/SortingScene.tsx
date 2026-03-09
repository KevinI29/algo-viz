/**
 * Study AI — Sorting Scene (v2 fixed)
 * =====================================
 * Renders sorting template: bars + staging area.
 * Uses bar.isStaged flag to properly hide bars when they're in staging.
 */

import type { AnimationFrame, BarState, StagingState } from '../../templates/types';
import { Bar, BAR_W } from './Bar';
import { StagingArea, AREA_W, AREA_H } from './StagingArea';

const CANVAS_W = 700;
const CANVAS_H = 300;
const SLOT_GAP = 12;
const STAGING_X = 16;
const BASE_Y = 240;
const STAGING_Y = BASE_Y - AREA_H;

type Props = {
  frame: AnimationFrame;
};

export function SortingScene({ frame }: Props) {
  const entities = frame.entities;

  // Extract bars and staging
  const bars = Object.values(entities).filter(
    (e): e is BarState => e.entityType === 'bar'
  ).sort((a, b) => a.index - b.index);

  const staging = Object.values(entities).find(
    (e): e is StagingState => e.entityType === 'staging'
  );

  const maxValue = bars.reduce((max, b) => Math.max(max, b.value), 1);

  // Calculate bar positions — offset to the right to leave room for staging
  const barAreaStartX = STAGING_X + AREA_W + 40;
  const activeBars = bars.filter(b => !b.isStaged);
  const totalBarWidth = bars.length * (BAR_W + SLOT_GAP) - SLOT_GAP;
  const barStartX = barAreaStartX + (CANVAS_W - barAreaStartX - totalBarWidth) / 2;

  function slotX(index: number): number {
    return barStartX + index * (BAR_W + SLOT_GAP) + BAR_W / 2;
  }

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

      {/* Staging area */}
      {staging && (
        <StagingArea
          staging={staging}
          x={STAGING_X}
          y={STAGING_Y}
          maxValue={maxValue}
        />
      )}

      {/* Bars — staged bars rendered as ghost (low opacity) at their slot */}
      {bars.map(bar => (
        <Bar
          key={bar.id}
          bar={bar}
          maxValue={maxValue}
          slotX={slotX}
          isInStaging={bar.isStaged}
        />
      ))}
    </svg>
  );
}