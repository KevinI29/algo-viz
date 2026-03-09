/**
 * Study AI — Simulator Runner
 * =============================
 * Executes a simulator generator and collects all SimEvents.
 * Handles multi-example scenarios (e.g., odd + even linked list).
 */

import type { SimEvent } from './events';
import type { LessonPlan } from '../router/types';
import { getSimulator } from './registry';

// =============================================================================
// CORE RUNNER
// =============================================================================

/**
 * Run a generator to completion, collecting all yielded events.
 */
export function collectEvents(gen: Generator<SimEvent>): SimEvent[] {
  const events: SimEvent[] = [];
  let result = gen.next();
  while (!result.done) {
    events.push(result.value);
    result = gen.next();
  }
  return events;
}

/**
 * Run a simulator by name with the given data.
 * Returns null if simulator not found or data type mismatch.
 */
export function runSimulator(
  simulatorName: string,
  data: any,
): SimEvent[] | null {
  const sim = getSimulator(simulatorName);
  if (!sim) {
    console.warn(`[Runner] Simulator not found: ${simulatorName}`);
    return null;
  }

  if (data.type !== sim.dataType) {
    console.warn(`[Runner] Data type mismatch: expected ${sim.dataType}, got ${data.type}`);
    return null;
  }

  try {
    const gen = sim.run(data);
    return collectEvents(gen);
  } catch (err) {
    console.error(`[Runner] Simulator crashed:`, err);
    return null;
  }
}

/**
 * Run a full lesson plan — primary example + additional examples.
 * Wraps each example in example.start / example.end events.
 */
export function runLessonPlan(plan: LessonPlan): SimEvent[] | null {
  if (!plan.simulator) return null; // needs Pyodide path

  const allEvents: SimEvent[] = [];
  const hasExtras = plan.additionalExamples && plan.additionalExamples.length > 0;

  // Primary example
  if (hasExtras) {
    allEvents.push({
      type: 'example.start',
      label: 'Example 1',
      data: plan.exampleData,
    });
  }

  const primaryEvents = runSimulator(plan.simulator, plan.exampleData);
  if (!primaryEvents) return null;
  allEvents.push(...primaryEvents);

  if (hasExtras) {
    allEvents.push({ type: 'example.end' });
  }

  // Additional examples
  if (plan.additionalExamples) {
    for (let i = 0; i < plan.additionalExamples.length; i++) {
      const example = plan.additionalExamples[i];
      allEvents.push({
        type: 'example.start',
        label: example.label,
        data: example.data,
      });

      const extraEvents = runSimulator(plan.simulator, example.data);
      if (extraEvents) {
        allEvents.push(...extraEvents);
      }

      allEvents.push({ type: 'example.end' });
    }
  }

  return allEvents;
}