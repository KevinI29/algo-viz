/**
 * Study AI — Sorting Template Mapper
 * =====================================
 * Converts sort.* SimEvents into AnimationFrames.
 * Manages bar states, staging area, and transitions.
 */

import type { SimEvent } from '../simulator/events';
import type {
  AnimationFrame, BarState, StagingState, Transition, EntityState,
} from './types';

// =============================================================================
// TIMING CONSTANTS (ms)
// =============================================================================

const T_COMPARE       = 600;
const T_LIFT          = 500;
const T_SLIDE         = 400;
const T_DROP          = 500;
const T_MARK_SORTED   = 200;
const T_PASS_DONE     = 600;
const T_DONE          = 1000;
const T_PHASE         = 300;

// =============================================================================
// COLOR CONSTANTS
// =============================================================================

const C_DEFAULT       = '#73daca';   // teal
const C_COMPARING     = '#ff9e64';   // orange
const C_SORTED        = '#9ece6a';   // green
const C_STAGING       = '#ff9e64';   // orange while in temp

// =============================================================================
// MAPPER
// =============================================================================

export function mapSortingEvents(
  events: SimEvent[],
  initialArray: number[],
  phaseExplanations?: Record<string, string>,
  stagingLabel: string = 'temp',
): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  let seq = 0;

  // ── Initialize bar states ──
  const bars: Record<string, BarState> = {};
  for (let i = 0; i < initialArray.length; i++) {
    bars[`bar_${i}`] = {
      entityType: 'bar',
      id: `bar_${i}`,
      value: initialArray[i],
      index: i,
      color: C_DEFAULT,
      opacity: 1,
      highlighted: false,
      sorted: false,
      isStaged: false,
    };
  }

  // ── Staging area ──
  const staging: StagingState = {
    entityType: 'staging',
    id: 'staging_temp',
    label: stagingLabel,
    value: null,
    barColor: C_STAGING,
    visible: false,
  };

  // Track which original bar ID is in staging
  let stagedBarId: string | null = null;
  let currentPhase: string | undefined;

  // ── Helper: snapshot current state ──
  function snapshot(
    transitions: Transition[],
    opts: Partial<AnimationFrame> = {},
  ): AnimationFrame {
    const entities: Record<string, EntityState> = {};
    for (const b of Object.values(bars)) {
      // Ghost the bar that's currently in staging
      const isStaged = stagedBarId === b.id;
      entities[b.id] = {
        ...b,
        opacity: isStaged ? 0.15 : b.opacity,
      };
    }
    entities[staging.id] = { ...staging };

    return {
      seq: seq++,
      entities,
      transitions,
      duration: opts.duration ?? T_COMPARE,
      phase: currentPhase,
      ...opts,
    };
  }

  // ── Initial frame ──
  frames.push(snapshot([{ type: 'none' }], {
    duration: T_PHASE,
    explanation: 'Here\'s our unsorted array',
  }));

  // ── Process events ──
  for (const event of events) {
    switch (event.type) {
      case 'phase.start': {
        currentPhase = event.name;
        const explanation = phaseExplanations?.[event.name] ?? event.explanation;
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_PHASE,
          explanation,
        }));
        break;
      }

      case 'phase.end':
        currentPhase = undefined;
        break;

      case 'sort.compare': {
        const [i, j] = event.indices;
        // Reset all non-sorted bars to default
        for (const b of Object.values(bars)) {
          if (!b.sorted) b.color = C_DEFAULT;
          b.highlighted = false;
        }
        // Highlight the compared pair
        const barA = findBarAtIndex(bars, i);
        const barB = findBarAtIndex(bars, j);
        if (barA) { barA.color = C_COMPARING; barA.highlighted = true; }
        if (barB) { barB.color = C_COMPARING; barB.highlighted = true; }

        frames.push(snapshot(
          [
            barA ? { type: 'bar_recolor', barId: barA.id, fromColor: C_DEFAULT, toColor: C_COMPARING } : { type: 'none' },
            barB ? { type: 'bar_recolor', barId: barB.id, fromColor: C_DEFAULT, toColor: C_COMPARING } : { type: 'none' },
          ],
          {
            duration: T_COMPARE,
            codeLine: event.line,
            explanation: barA && barB
              ? `Compare ${barA.value} and ${barB.value}${barA.value > barB.value ? ' — need to swap' : ' — already in order'}`
              : undefined,
          }
        ));
        break;
      }

      case 'sort.lift_to_temp': {
        const bar = findBarAtIndex(bars, event.index);
        if (bar) {
          stagedBarId = bar.id;
          bar.isStaged = true;       // bar is now in staging, not in array
          staging.value = event.value;
          staging.visible = true;
          staging.barColor = bar.color;
        }

        frames.push(snapshot(
          [bar ? { type: 'bar_lift', barId: bar.id, toStaging: staging.id } : { type: 'none' }],
          {
            duration: T_LIFT,
            codeLine: event.line,
            explanation: `Store ${event.value} in temp`,
          }
        ));
        break;
      }

      case 'sort.slide': {
        const bar = findBarAtIndex(bars, event.fromIndex);
        if (bar) {
          bar.index = event.toIndex;
        }

        frames.push(snapshot(
          [bar ? { type: 'bar_slide', barId: bar.id, fromIndex: event.fromIndex, toIndex: event.toIndex } : { type: 'none' }],
          {
            duration: T_SLIDE,
            codeLine: event.line,
            explanation: `Move ${event.value} to position ${event.toIndex}`,
          }
        ));
        break;
      }

      case 'sort.drop_from_temp': {
        if (stagedBarId) {
          const bar = bars[stagedBarId];
          if (bar) {
            bar.index = event.index;
            bar.isStaged = false;    // bar returns to the array
          }
        }
        staging.value = null;
        staging.visible = false;

        frames.push(snapshot(
          [stagedBarId ? { type: 'bar_drop', barId: stagedBarId, fromStaging: staging.id, toIndex: event.index } : { type: 'none' }],
          {
            duration: T_DROP,
            codeLine: event.line,
            explanation: `Place ${event.value} from temp into position ${event.index}`,
          }
        ));

        stagedBarId = null;
        break;
      }

      case 'sort.mark_sorted': {
        const bar = findBarAtIndex(bars, event.index);
        if (bar) {
          bar.color = C_SORTED;
          bar.sorted = true;
          bar.highlighted = false;
        }

        frames.push(snapshot(
          [bar ? { type: 'bar_recolor', barId: bar.id, fromColor: C_DEFAULT, toColor: C_SORTED } : { type: 'none' }],
          { duration: T_MARK_SORTED }
        ));
        break;
      }

      case 'sort.pass_done': {
        // Reset highlights
        for (const b of Object.values(bars)) {
          if (!b.sorted) { b.color = C_DEFAULT; b.highlighted = false; }
        }
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_PASS_DONE,
          explanation: `Pass ${event.passNumber} complete`,
        }));
        break;
      }

      case 'sort.done': {
        for (const b of Object.values(bars)) {
          b.color = C_SORTED;
          b.sorted = true;
          b.highlighted = false;
        }
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_DONE,
          explanation: 'Array is now sorted!',
        }));
        break;
      }

      case 'example.start':
        // Reset bars for new example
        if ('array' in (event.data as any)) {
          const arr = (event.data as any).array as number[];
          for (const key of Object.keys(bars)) delete bars[key];
          for (let i = 0; i < arr.length; i++) {
            bars[`bar_${i}`] = {
              entityType: 'bar', id: `bar_${i}`,
              value: arr[i], index: i,
              color: C_DEFAULT, opacity: 1,
              highlighted: false, sorted: false, isStaged: false,
            };
          }
          staging.value = null;
          staging.visible = false;
          stagedBarId = null;
        }
        frames.push(snapshot([{ type: 'none' }], {
          duration: T_PHASE,
          isExampleBoundary: true,
          exampleLabel: event.label,
          explanation: event.label,
        }));
        break;

      // Ignore events we don't need to render
      default:
        break;
    }
  }

  return frames;
}

// =============================================================================
// HELPERS
// =============================================================================

function findBarAtIndex(
  bars: Record<string, BarState>,
  index: number,
): BarState | undefined {
  // Skip staged bars — they're in the staging area, not in the array
  return Object.values(bars).find(b => b.index === index && !b.isStaged);
}