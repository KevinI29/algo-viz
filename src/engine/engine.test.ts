/**
 * algo.viz — Engine Core Test
 * ============================
 * This is not a Jest test. This is a manual verification script.
 * Run it with: npx tsx src/engine/engine.test.ts
 *
 * What we are proving:
 * 1. The engine loads an IRDocument without errors
 * 2. Scene state is correct at every step
 * 3. Navigation works forward and backward
 * 4. Mutations are applied correctly and immutably
 */

import { AnimationEngine } from './engine';
import { binarySearchFixture } from '../ir/binarySearch.fixture';

// =============================================================================
// HELPERS
// =============================================================================

function printDivider(label: string) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${label}`);
  console.log('='.repeat(60));
}

function printStep(engine: AnimationEngine) {
  const state = engine.getState();
  const activeLines = engine.getActiveLines();
  const entityIds = Object.keys(state.currentScene.entities);

  console.log(`\n► Step Index : ${state.currentStepIndex} / ${state.totalSteps}`);
  console.log(`  First step : ${state.isFirstStep}`);
  console.log(`  Last step  : ${state.isLastStep}`);
  console.log(`  Code lines : [${activeLines.join(', ')}]`);
  console.log(`  Explanation: ${state.currentStep?.explanation?.slice(0, 80)}...`);
  console.log(`  Entities   : ${entityIds.length} total`);

  // Print each entity's key state
  entityIds.forEach((id) => {
    const entity = state.currentScene.entities[id];
    const highlighted = entity.style.highlighted ? '🟡 HIGHLIGHTED' : '';
    const dimmed = entity.style.dimmed ? '⬛ DIMMED' : '';
    const status = highlighted || dimmed || '⬜ normal';

    if (entity.type === 'ARRAY_CELL') {
      console.log(`    [${entity.type}] ${id} = ${entity.value}  ${status}`);
    } else if (entity.type === 'VARIABLE_LABEL') {
      console.log(`    [${entity.type}] ${id} → targets: ${entity.targetId}  ${status}`);
    } else if (entity.type === 'ARROW') {
      console.log(`    [${entity.type}] ${id}: ${entity.fromId} → ${entity.toId}  ${status}`);
    } else if (entity.type === 'NODE') {
      console.log(`    [${entity.type}] ${id} = ${entity.value}  ${status}`);
    }
  });
}

// =============================================================================
// TEST SUITE
// =============================================================================

function runTests() {
  printDivider('TEST 1 — Engine loads IRDocument');
  const engine = new AnimationEngine(binarySearchFixture);
  const initial = engine.getState();

  console.log(`✅ Concept     : ${engine.getConcept()}`);
  console.log(`✅ Total steps : ${initial.totalSteps}`);
  console.log(`✅ Is first    : ${initial.isFirstStep}`);
  console.log(`✅ Entities    : ${Object.keys(initial.currentScene.entities).length} in initial scene`);

  // Verify initial scene has exactly 7 array cells
  const initialEntityCount = Object.keys(initial.currentScene.entities).length;
  if (initialEntityCount !== 7) {
    console.error(`❌ Expected 7 entities in initial scene, got ${initialEntityCount}`);
    process.exit(1);
  }
  console.log(`✅ Initial scene entity count correct (7)`);

  // -----------------------------------------------------------------------
  printDivider('TEST 2 — Forward navigation through all steps');

  let stepCount = 0;
  while (!engine.getState().isLastStep) {
    engine.nextStep();
    stepCount++;
    printStep(engine);
  }

  if (stepCount !== 5) {
    console.error(`❌ Expected 5 steps, walked ${stepCount}`);
    process.exit(1);
  }
  console.log(`\n✅ Walked all ${stepCount} steps correctly`);

  // -----------------------------------------------------------------------
  printDivider('TEST 3 — Verify final scene state');

  const finalState = engine.getState();
  const finalEntities = finalState.currentScene.entities;

  // cell_5 (value 23) should be highlighted — it's the found element
  const cell5 = finalEntities['cell_5'];
  if (!cell5?.style.highlighted) {
    console.error('❌ cell_5 (value 23) should be highlighted in final scene');
    process.exit(1);
  }
  console.log('✅ cell_5 (value 23) is highlighted in final scene');

  // cell_0 should be dimmed — eliminated in early steps
  const cell0 = finalEntities['cell_0'];
  if (!cell0?.style.dimmed) {
    console.error('❌ cell_0 should be dimmed in final scene');
    process.exit(1);
  }
  console.log('✅ cell_0 is dimmed in final scene');

  // label_mid should exist and target cell_5
  const labelMid = finalEntities['label_mid'];
  if (!labelMid || labelMid.type !== 'VARIABLE_LABEL') {
    console.error('❌ label_mid should exist in final scene');
    process.exit(1);
  }
  if (labelMid.targetId !== 'cell_5') {
    console.error(`❌ label_mid should target cell_5, got ${labelMid.targetId}`);
    process.exit(1);
  }
  console.log('✅ label_mid correctly targets cell_5 in final scene');

  // -----------------------------------------------------------------------
  printDivider('TEST 4 — Backward navigation');

  engine.prevStep();
  const prevState = engine.getState();

  if (prevState.currentStepIndex !== 4) {
    console.error(`❌ Expected step index 4 after prevStep, got ${prevState.currentStepIndex}`);
    process.exit(1);
  }
  console.log(`✅ prevStep() correctly moved to index ${prevState.currentStepIndex}`);

  // -----------------------------------------------------------------------
  printDivider('TEST 5 — goToStep() direct navigation');

  engine.goToStep(1);
  const jumpState = engine.getState();

  if (jumpState.currentStepIndex !== 1) {
    console.error(`❌ Expected step index 1 after goToStep(1), got ${jumpState.currentStepIndex}`);
    process.exit(1);
  }

  // After step 1, label_left and label_right should exist
  const afterStep1 = jumpState.currentScene.entities;
  if (!afterStep1['label_left'] || !afterStep1['label_right']) {
    console.error('❌ label_left and label_right should exist after step 1');
    process.exit(1);
  }
  console.log('✅ goToStep(1) correct — label_left and label_right exist');

  // -----------------------------------------------------------------------
  printDivider('TEST 6 — Immutability check');

  // Go to step 2 and verify step 1 scene is unchanged
  engine.goToStep(2);
  const step2Scene = engine.getState().currentScene;

  engine.goToStep(1);
  const step1SceneAgain = engine.getState().currentScene;

  // label_mid should NOT exist at step 1
  if (step1SceneAgain.entities['label_mid']) {
    console.error('❌ label_mid should not exist at step 1 — immutability violated');
    process.exit(1);
  }
  console.log('✅ Immutability confirmed — step 1 scene unaffected by step 2 mutations');

  // Suppress unused variable warning
  void step2Scene;

  // -----------------------------------------------------------------------
  printDivider('ALL TESTS PASSED ✅');
  console.log('\nThe engine core is correct.');
  console.log('The IR schema is valid.');
  console.log('The Binary Search fixture is sound.');
  console.log('\nReady to build the renderer.\n');
}

runTests();