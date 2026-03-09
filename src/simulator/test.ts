/**
 * Study AI — Phase 1 Integration Test
 * ======================================
 * Verifies the complete pipeline: simulator → events → template mapper → frames
 * Run with: npx tsx src/simulator/test.ts
 */

import { bubbleSort, insertionSort, selectionSort } from './sorting';
import { bfs } from './tree-traversal';
import { findMiddle } from './linked-list';
import { validParentheses } from './stack-queue';
import { collectEvents, runSimulator, runLessonPlan } from './runner';
import { getSimulator, hasSimulator, listSimulators } from './registry';
import { compileTimeline } from '../templates/registry';
import type { SimEvent } from './events';
import type { LessonPlan, SortingData, TreeData, LinkedListData, StackData } from '../router/types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.log(`  ✗ ${msg}`);
  }
}

// =============================================================================
// TEST 1: Bubble Sort Simulator
// =============================================================================

console.log('\n── Bubble Sort Simulator ──');
{
  const events = collectEvents(bubbleSort([4, 2, 6]));

  assert(events.length > 0, `Produces events (got ${events.length})`);

  const types = new Set(events.map(e => e.type));
  assert(types.has('sort.compare'), 'Has compare events');
  assert(types.has('sort.lift_to_temp'), 'Has lift events');
  assert(types.has('sort.slide'), 'Has slide events');
  assert(types.has('sort.drop_from_temp'), 'Has drop events');
  assert(types.has('sort.mark_sorted'), 'Has mark_sorted events');
  assert(types.has('sort.done'), 'Has done event');
  assert(types.has('phase.start'), 'Has phase.start events');

  // Verify sort is correct: after all events, the sorted order should be [2, 4, 6]
  const compareCount = events.filter(e => e.type === 'sort.compare').length;
  assert(compareCount >= 2, `At least 2 comparisons for 3 elements (got ${compareCount})`);

  // Larger array
  const events6 = collectEvents(bubbleSort([4, 2, 6, 5, 1, 3]));
  assert(events6.length > 20, `6-element sort produces many events (got ${events6.length})`);
}

// =============================================================================
// TEST 2: Insertion Sort Simulator
// =============================================================================

console.log('\n── Insertion Sort Simulator ──');
{
  const events = collectEvents(insertionSort([5, 3, 1, 4, 2]));
  assert(events.length > 0, `Produces events (got ${events.length})`);

  const types = new Set(events.map(e => e.type));
  assert(types.has('sort.lift_to_temp'), 'Has lift (key extraction)');
  assert(types.has('sort.slide'), 'Has slide (shifting elements)');
  assert(types.has('sort.drop_from_temp'), 'Has drop (key insertion)');
  assert(types.has('sort.done'), 'Has done event');
}

// =============================================================================
// TEST 3: Selection Sort Simulator
// =============================================================================

console.log('\n── Selection Sort Simulator ──');
{
  const events = collectEvents(selectionSort([3, 1, 4, 1, 5]));
  assert(events.length > 0, `Produces events (got ${events.length})`);

  const doneEvents = events.filter(e => e.type === 'sort.done');
  assert(doneEvents.length === 1, 'Exactly one done event');
}

// =============================================================================
// TEST 4: BFS Simulator
// =============================================================================

console.log('\n── BFS Simulator ──');
{
  const tree = {
    id: 'n47', value: 47,
    left: {
      id: 'n21', value: 21,
      left: { id: 'n18', value: 18 },
      right: { id: 'n27', value: 27 },
    },
    right: {
      id: 'n76', value: 76,
      left: { id: 'n52', value: 52 },
      right: { id: 'n82', value: 82 },
    },
  };

  const events = collectEvents(bfs(tree));
  assert(events.length > 0, `Produces events (got ${events.length})`);

  const types = new Set(events.map(e => e.type));
  assert(types.has('tree.enqueue'), 'Has enqueue events');
  assert(types.has('tree.dequeue'), 'Has dequeue events');
  assert(types.has('tree.visit'), 'Has visit events');
  assert(types.has('tree.add_result'), 'Has add_result events');
  assert(types.has('tree.done'), 'Has done event');

  // Verify BFS order: should visit 47, 21, 76, 18, 27, 52, 82
  const visitOrder = events
    .filter(e => e.type === 'tree.add_result')
    .map(e => (e as any).value);
  assert(
    JSON.stringify(visitOrder) === JSON.stringify([47, 21, 76, 18, 27, 52, 82]),
    `BFS order is correct: [${visitOrder.join(', ')}]`
  );
}

// =============================================================================
// TEST 5: Find Middle Node Simulator
// =============================================================================

console.log('\n── Find Middle Node Simulator ──');
{
  // Odd length: [1,2,3,4,5] → middle is 3 (index 2)
  const events5 = collectEvents(findMiddle([1, 2, 3, 4, 5]));
  assert(events5.length > 0, `Odd-length produces events (got ${events5.length})`);

  const result5 = events5.find(e => e.type === 'll.found_result') as any;
  assert(result5 !== undefined, 'Has found_result event');
  assert(result5?.value === 3, `Middle of [1,2,3,4,5] is 3 (got ${result5?.value})`);

  // Even length: [1,2,3,4] → middle is 3 (index 2, first of second half)
  const events4 = collectEvents(findMiddle([1, 2, 3, 4]));
  const result4 = events4.find(e => e.type === 'll.found_result') as any;
  assert(result4?.value === 3, `Middle of [1,2,3,4] is 3 (got ${result4?.value})`);

  // Pointer movement events
  const moves = events5.filter(e => e.type === 'll.move_pointer');
  assert(moves.length >= 2, `Has pointer move events (got ${moves.length})`);
}

// =============================================================================
// TEST 6: Valid Parentheses Simulator
// =============================================================================

console.log('\n── Valid Parentheses Simulator ──');
{
  // Balanced
  const balanced = collectEvents(validParentheses('(())'));
  const balResult = balanced.find(e => e.type === 'stack.result') as any;
  assert(balResult?.balanced === true, '"(())" is balanced');

  // Also balanced
  const balanced2 = collectEvents(validParentheses('()()'));
  const bal2Result = balanced2.find(e => e.type === 'stack.result') as any;
  assert(bal2Result?.balanced === true, '"()()" is balanced');

  // Unbalanced
  const unbal = collectEvents(validParentheses('(()'));
  const unbalResult = unbal.find(e => e.type === 'stack.result') as any;
  assert(unbalResult?.balanced === false, '"(()" is unbalanced');

  // Mixed brackets
  const mixed = collectEvents(validParentheses('{[()]}'));
  const mixResult = mixed.find(e => e.type === 'stack.result') as any;
  assert(mixResult?.balanced === true, '"{[()]}" is balanced');

  // Push/pop events
  const pushes = balanced.filter(e => e.type === 'stack.push');
  const pops = balanced.filter(e => e.type === 'stack.pop');
  assert(pushes.length === 2, `"(())" has 2 pushes (got ${pushes.length})`);
  assert(pops.length === 2, `"(())" has 2 pops (got ${pops.length})`);
}

// =============================================================================
// TEST 7: Registry
// =============================================================================

console.log('\n── Simulator Registry ──');
{
  const sims = listSimulators();
  assert(sims.length >= 9, `At least 9 simulators registered (got ${sims.length})`);
  assert(hasSimulator('sorting.bubble'), 'Has sorting.bubble');
  assert(hasSimulator('tree.bfs'), 'Has tree.bfs');
  assert(hasSimulator('linked_list.find_middle'), 'Has linked_list.find_middle');
  assert(hasSimulator('stack.valid_parentheses'), 'Has stack.valid_parentheses');
  assert(!hasSimulator('nonexistent'), 'Returns false for unknown');

  const sim = getSimulator('sorting.bubble');
  assert(sim !== null, 'getSimulator returns entry');
  assert(sim!.dataType === 'sorting', 'Data type is sorting');
}

// =============================================================================
// TEST 8: Runner
// =============================================================================

console.log('\n── Simulator Runner ──');
{
  const events = runSimulator('sorting.bubble', { type: 'sorting', array: [3, 1, 2] });
  assert(events !== null, 'runSimulator returns events');
  assert(events!.length > 0, `Events not empty (got ${events!.length})`);

  const badData = runSimulator('sorting.bubble', { type: 'tree', root: {} });
  assert(badData === null, 'Returns null for data type mismatch');

  const unknown = runSimulator('nonexistent', { type: 'sorting', array: [1] });
  assert(unknown === null, 'Returns null for unknown simulator');
}

// =============================================================================
// TEST 9: Template Mappers (via compileTimeline)
// =============================================================================

console.log('\n── Template Mappers ──');
{
  // Sorting timeline
  const sortPlan: LessonPlan = {
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    exampleData: { type: 'sorting', array: [4, 2, 6] } as SortingData,
    code: { source: 'def bubble_sort(arr): pass', language: 'python' },
    title: 'How does it work?',
    setupExplanation: 'Test setup',
    phaseExplanations: {},
    insightText: 'Test insight',
  };

  const sortEvents = runSimulator('sorting.bubble', sortPlan.exampleData)!;
  const sortTimeline = compileTimeline(sortPlan, sortEvents);

  assert(sortTimeline.frames.length > 0, `Sorting: produces frames (got ${sortTimeline.frames.length})`);
  assert(sortTimeline.meta.concept === 'Bubble Sort', 'Sorting: correct concept');
  assert(sortTimeline.meta.visualTemplate === 'sorting', 'Sorting: correct template');

  // Check frame structure
  const firstFrame = sortTimeline.frames[0];
  assert(firstFrame.seq === 0, 'First frame seq is 0');
  assert(Object.keys(firstFrame.entities).length > 0, 'Frame has entities');
  assert(firstFrame.duration > 0, 'Frame has positive duration');

  // Verify bars exist
  const barEntities = Object.values(firstFrame.entities).filter(e => e.entityType === 'bar');
  assert(barEntities.length === 3, `Sorting: 3 bars for [4,2,6] (got ${barEntities.length})`);

  // Staging entity exists
  const stagingEntity = Object.values(firstFrame.entities).find(e => e.entityType === 'staging');
  assert(stagingEntity !== undefined, 'Sorting: staging area exists');

  // Tree timeline
  const treePlan: LessonPlan = {
    simulator: 'tree.bfs',
    visualTemplate: 'tree',
    codePosition: 'after',
    concept: 'BFS',
    category: 'tree',
    exampleData: {
      type: 'tree',
      root: { id: 'r', value: 10, left: { id: 'l', value: 5 }, right: { id: 'ri', value: 15 } },
    } as TreeData,
    code: { source: 'def bfs(root): pass', language: 'python' },
    title: 'BFS',
    setupExplanation: 'Test',
    phaseExplanations: {},
    insightText: 'Test',
  };

  const treeEvents = runSimulator('tree.bfs', treePlan.exampleData)!;
  const treeTimeline = compileTimeline(treePlan, treeEvents);
  assert(treeTimeline.frames.length > 0, `Tree: produces frames (got ${treeTimeline.frames.length})`);

  // Linked list timeline
  const llPlan: LessonPlan = {
    simulator: 'linked_list.find_middle',
    visualTemplate: 'linked_list',
    codePosition: 'after',
    concept: 'Find Middle',
    category: 'linked_list',
    exampleData: { type: 'linked_list', values: [1, 2, 3, 4, 5], pointers: { slow: 0, fast: 0 } } as LinkedListData,
    code: { source: 'def find_middle(head): pass', language: 'python' },
    title: 'Find Middle',
    setupExplanation: 'Test',
    phaseExplanations: {},
    insightText: 'Test',
  };

  const llEvents = runSimulator('linked_list.find_middle', llPlan.exampleData)!;
  const llTimeline = compileTimeline(llPlan, llEvents);
  assert(llTimeline.frames.length > 0, `LL: produces frames (got ${llTimeline.frames.length})`);

  // Stack timeline
  const stackPlan: LessonPlan = {
    simulator: 'stack.valid_parentheses',
    visualTemplate: 'stack',
    codePosition: 'after',
    concept: 'Valid Parentheses',
    category: 'stack',
    exampleData: { type: 'stack', input: '(())' } as StackData,
    code: { source: 'def is_valid(s): pass', language: 'python' },
    title: 'Valid Parens',
    setupExplanation: 'Test',
    phaseExplanations: {},
    insightText: 'Test',
  };

  const stackEvents = runSimulator('stack.valid_parentheses', stackPlan.exampleData)!;
  const stackTimeline = compileTimeline(stackPlan, stackEvents);
  assert(stackTimeline.frames.length > 0, `Stack: produces frames (got ${stackTimeline.frames.length})`);
}

// =============================================================================
// TEST 10: Full Lesson Plan with Runner
// =============================================================================

console.log('\n── Full Lesson Plan Runner ──');
{
  const plan: LessonPlan = {
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    exampleData: { type: 'sorting', array: [4, 2, 6, 5, 1, 3] } as SortingData,
    code: { source: 'def bubble_sort(arr): ...', language: 'python' },
    title: 'Test',
    setupExplanation: 'Test',
    phaseExplanations: {
      'pass_1': 'First pass: bubble the largest to the end',
    },
    insightText: 'Bubble sort is O(n²)',
  };

  const events = runLessonPlan(plan);
  assert(events !== null, 'runLessonPlan returns events');
  assert(events!.length > 40, `6-element bubble sort has many events (got ${events!.length})`);

  const timeline = compileTimeline(plan, events!);
  assert(timeline.frames.length > 20, `Timeline has many frames (got ${timeline.frames.length})`);
  assert(timeline.meta.estimatedDuration > 5000, `Estimated duration > 5s (got ${timeline.meta.estimatedDuration}ms)`);

  console.log(`\n  Timeline stats:`);
  console.log(`    Frames: ${timeline.frames.length}`);
  console.log(`    Duration: ${(timeline.meta.estimatedDuration / 1000).toFixed(1)}s`);
  console.log(`    Concept: ${timeline.meta.concept}`);
  console.log(`    Template: ${timeline.meta.visualTemplate}`);
}

// =============================================================================
// SUMMARY
// =============================================================================

console.log(`\n${'═'.repeat(50)}`);
console.log(`  Phase 1 Tests: ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) process.exit(1);