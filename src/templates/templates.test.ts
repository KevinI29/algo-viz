/**
 * Study AI — Template Mapper Tests
 * ==================================
 * LessonPlan + SimEvents → AnimationTimeline, via compileTimeline.
 * Run with: npm test
 */

import { describe, it, expect } from 'vitest';
import { runLessonPlan, runSimulator } from '../simulator/runner';
import { compileTimeline } from './registry';
import type { LessonPlan } from '../router/types';

// =============================================================================
// FIXTURES
// =============================================================================

function plan(overrides: Partial<LessonPlan> & Pick<LessonPlan, 'simulator' | 'visualTemplate' | 'exampleData'>): LessonPlan {
  return {
    codePosition: 'after',
    concept: 'Test',
    category: 'general',
    code: { source: 'def f(): pass', language: 'python' },
    title: 'Test',
    setupExplanation: 'Test',
    phaseExplanations: {},
    insightText: 'Test',
    ...overrides,
  };
}

function timelineFor(p: LessonPlan) {
  const events = runSimulator(p.simulator!, p.exampleData!);
  expect(events).not.toBeNull();
  return compileTimeline(p, events!);
}

// =============================================================================
// PER-TEMPLATE
// =============================================================================

describe('sorting template', () => {
  const sortPlan = plan({
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    exampleData: { type: 'sorting', array: [4, 2, 6] },
  });
  const timeline = timelineFor(sortPlan);
  const first = timeline.frames[0];

  it('produces frames with the right meta', () => {
    expect(timeline.frames.length).toBeGreaterThan(0);
    expect(timeline.meta.concept).toBe('Bubble Sort');
    expect(timeline.meta.visualTemplate).toBe('sorting');
  });

  it('starts at seq 0 with entities and a positive duration', () => {
    expect(first.seq).toBe(0);
    expect(Object.keys(first.entities).length).toBeGreaterThan(0);
    expect(first.duration).toBeGreaterThan(0);
  });

  it('draws one bar per element plus a staging area', () => {
    const entities = Object.values(first.entities);
    expect(entities.filter(e => e.entityType === 'bar')).toHaveLength(3);
    expect(entities.find(e => e.entityType === 'staging')).toBeDefined();
  });
});

describe('other templates produce frames', () => {
  it('tree', () => {
    const t = timelineFor(plan({
      simulator: 'tree.bfs',
      visualTemplate: 'tree',
      exampleData: {
        type: 'tree',
        root: { id: 'r', value: 10, left: { id: 'l', value: 5 }, right: { id: 'ri', value: 15 } },
      },
    }));
    expect(t.frames.length).toBeGreaterThan(0);
  });

  it('linked list', () => {
    const t = timelineFor(plan({
      simulator: 'linked_list.find_middle',
      visualTemplate: 'linked_list',
      exampleData: { type: 'linked_list', values: [1, 2, 3, 4, 5], pointers: { slow: 0, fast: 0 } },
    }));
    expect(t.frames.length).toBeGreaterThan(0);
  });

  it('stack', () => {
    const t = timelineFor(plan({
      simulator: 'stack.valid_parentheses',
      visualTemplate: 'stack',
      exampleData: { type: 'stack', input: '(())' },
    }));
    expect(t.frames.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// FULL LESSON PLAN
// =============================================================================

describe('runLessonPlan + compileTimeline', () => {
  const fullPlan = plan({
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    exampleData: { type: 'sorting', array: [4, 2, 6, 5, 1, 3] },
    phaseExplanations: { pass_1: 'First pass: bubble the largest to the end' },
    insightText: 'Bubble sort is O(n²)',
  });
  const events = runLessonPlan(fullPlan);

  it('returns many events for a 6-element bubble sort', () => {
    expect(events).not.toBeNull();
    expect(events!.length).toBeGreaterThan(40);
  });

  it('compiles a long timeline', () => {
    const timeline = compileTimeline(fullPlan, events!);
    expect(timeline.frames.length).toBeGreaterThan(20);
    expect(timeline.meta.estimatedDuration).toBeGreaterThan(5000);
  });
});

// =============================================================================
// ROBUSTNESS
// =============================================================================

describe('runLessonPlan robustness', () => {
  it('skips a failing additional example without orphan markers', () => {
    const events = runLessonPlan(plan({
      simulator: 'sorting.bubble',
      visualTemplate: 'sorting',
      exampleData: { type: 'sorting', array: [2, 1] },
      additionalExamples: [
        // Wrong data type for the simulator — runSimulator returns null
        { label: 'Broken', data: { type: 'stack', input: '()' } },
        { label: 'Good', data: { type: 'sorting', array: [3, 1, 2] } },
      ],
    }));
    expect(events).not.toBeNull();
    const starts = events!.filter(e => e.type === 'example.start');
    const ends = events!.filter(e => e.type === 'example.end');
    expect(starts.map(e => e.type === 'example.start' && e.label)).toEqual(['Example 1', 'Good']);
    expect(ends).toHaveLength(starts.length);
  });

  it('returns null for a simulator plan without example data', () => {
    expect(runLessonPlan(plan({ simulator: 'sorting.bubble', visualTemplate: 'sorting', exampleData: undefined }))).toBeNull();
  });

  it('compiles an empty timeline for a plan with no data', () => {
    const t = compileTimeline(plan({ simulator: null, visualTemplate: 'sorting', exampleData: undefined }), []);
    expect(t.frames).toEqual([]);
  });
});
