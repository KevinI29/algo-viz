/**
 * Study AI — Template Registry
 * ==============================
 * Maps visual template names to their mapper functions.
 * Given a LessonPlan + SimEvents, produces an AnimationTimeline.
 */

import type { SimEvent } from '../simulator/events';
import type { LessonPlan, SortingData, TreeData, LinkedListData, StackData } from '../router/types';
import type { AnimationFrame, AnimationTimeline } from './types';
import { mapSortingEvents } from './sorting';
import { mapTreeEvents } from './tree';
import { mapLinkedListEvents } from './linked-list';
import { mapStackEvents } from './stack';

// =============================================================================
// COMPILE: LessonPlan + SimEvents → AnimationTimeline
// =============================================================================

export function compileTimeline(
  plan: LessonPlan,
  events: SimEvent[],
): AnimationTimeline {
  const frames = mapEvents(plan, events);

  const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

  return {
    meta: {
      concept: plan.concept,
      visualTemplate: plan.visualTemplate,
      codePosition: plan.codePosition,
      frameCount: frames.length,
      estimatedDuration: totalDuration,
    },
    code: plan.code ? {
      source: plan.code.source,
      language: plan.code.language,
    } : undefined,
    frames,
    setupExplanation: plan.setupExplanation,
    insightText: plan.insightText,
    complexityNote: plan.complexityNote,
  };
}

// =============================================================================
// MAP EVENTS — dispatch to correct template mapper
// =============================================================================

function mapEvents(plan: LessonPlan, events: SimEvent[]): AnimationFrame[] {
  switch (plan.visualTemplate) {
    case 'sorting': {
      const data = plan.exampleData as SortingData;
      return mapSortingEvents(events, data.array, plan.phaseExplanations);
    }

    case 'tree': {
      const data = plan.exampleData as TreeData;
      return mapTreeEvents(events, data.root, plan.phaseExplanations);
    }

    case 'linked_list': {
      const data = plan.exampleData as LinkedListData;
      return mapLinkedListEvents(
        events, data.values, data.pointers, plan.phaseExplanations,
      );
    }

    case 'stack': {
      const data = plan.exampleData as StackData;
      return mapStackEvents(events, data.input, plan.phaseExplanations);
    }

    default:
      console.warn(`[Template] Unknown visual template: ${plan.visualTemplate}`);
      return [];
  }
}
