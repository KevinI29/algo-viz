/**
 * algo.viz — Animation Engine Core
 * ==================================
 * Pure TypeScript. Zero dependencies. Zero React. Zero DOM.
 *
 * This module is the brain of the platform.
 * It accepts an IRDocument, manages scene state, and applies
 * mutations step by step.
 *
 * It knows nothing about rendering. It knows nothing about AI.
 * It only knows how to walk through a sequence of steps and
 * apply mutations to produce correct scene state at every point.
 *
 * RULES:
 * - Never import React here
 * - Never touch the DOM here
 * - Never call the AI here
 * - This must be fully testable in a Node terminal
 */

import type {
  IRDocument,
  Scene,
  Step,
  Mutation,
  Entity,
  EntityId,
  ArrowEntity,
  VariableLabelEntity,
  NodeEntity,
  ArrayCellEntity,
  EntityPosition,
} from '../ir/ir.types';

// =============================================================================
// ENGINE STATE
// =============================================================================

export type EngineState = {
  currentStepIndex: number;
  currentScene: Scene;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  currentStep: Step;
};

// =============================================================================
// MUTATION APPLIER
// =============================================================================

/**
 * applyMutation
 * Takes the current scene and a single mutation.
 * Returns a NEW scene with the mutation applied.
 * Never mutates the input scene — always returns a fresh object.
 */
function applyMutation(scene: Scene, mutation: Mutation): Scene {
  // Deep clone entities map so we never mutate previous scene state
  const entities: Record<EntityId, Entity> = { ...scene.entities };

  switch (mutation.type) {

    case 'CREATE_ENTITY': {
      entities[mutation.targetId] = mutation.payload.entity;
      break;
    }

    case 'DESTROY_ENTITY': {
      delete entities[mutation.targetId];
      break;
    }

    case 'HIGHLIGHT_ENTITY': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        style: { ...entity.style, highlighted: true, dimmed: false },
      };
      break;
    }

    case 'UNHIGHLIGHT_ENTITY': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        style: { ...entity.style, highlighted: false },
      };
      break;
    }

    case 'DIM_ENTITY': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        style: { ...entity.style, dimmed: true, highlighted: false },
      };
      break;
    }

    case 'UNDIM_ENTITY': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        style: { ...entity.style, dimmed: false },
      };
      break;
    }

    case 'UPDATE_VALUE': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      if (entity.type === 'NODE') {
        entities[mutation.targetId] = {
          ...(entity as NodeEntity),
          value: mutation.payload.value,
        };
      } else if (entity.type === 'ARRAY_CELL') {
        entities[mutation.targetId] = {
          ...(entity as ArrayCellEntity),
          value: mutation.payload.value,
        };
      }
      break;
    }

    case 'MOVE_ENTITY': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        position: mutation.payload.position,
      };
      break;
    }

    case 'REDIRECT_ARROW': {
      const entity = entities[mutation.targetId];
      if (!entity || entity.type !== 'ARROW') break;
      entities[mutation.targetId] = {
        ...(entity as ArrowEntity),
        toId: mutation.payload.toId,
      };
      break;
    }

    case 'UPDATE_TARGET': {
      const entity = entities[mutation.targetId];
      if (!entity || entity.type !== 'VARIABLE_LABEL') break;
      entities[mutation.targetId] = {
        ...(entity as VariableLabelEntity),
        targetId: mutation.payload.targetId,
      };
      break;
    }

    case 'UPDATE_POINTER': {
      const entity = entities[mutation.targetId];
      if (!entity || entity.type !== 'NODE') break;
      entities[mutation.targetId] = {
        ...(entity as NodeEntity),
        pointsTo: mutation.payload.pointsTo ?? undefined,
      };
      break;
    }

    case 'SWAP_POSITIONS': {
      const entityA = entities[mutation.targetId];
      const entityB = entities[mutation.payload.withId];
      if (!entityA || !entityB) break;

      // Swap positions — values stay with their entity so they visually move
      const posA: EntityPosition = entityA.position;
      const posB: EntityPosition = entityB.position;

      // For ARRAY_CELL: swap position AND index (both control visual placement)
      // but KEEP values — the value travels with its entity to the new spot
      if (entityA.type === 'ARRAY_CELL' && entityB.type === 'ARRAY_CELL') {
        const cellA = entityA as ArrayCellEntity;
        const cellB = entityB as ArrayCellEntity;
        entities[mutation.targetId] = {
          ...cellA,
          position: posB,
          index: cellB.index,
          // value stays as cellA.value — it moves to B's position
        };
        entities[mutation.payload.withId] = {
          ...cellB,
          position: posA,
          index: cellA.index,
          // value stays as cellB.value — it moves to A's position
        };
      } else {
        // For all other entity types: swap positions only
        entities[mutation.targetId] = { ...entityA, position: posB };
        entities[mutation.payload.withId] = { ...entityB, position: posA };
      }
      break;
    }

    case 'UPDATE_STYLE': {
      const entity = entities[mutation.targetId];
      if (!entity) break;
      entities[mutation.targetId] = {
        ...entity,
        style: { ...entity.style, ...mutation.payload.style },
      };
      break;
    }

    default: {
      console.warn('[Engine] Unknown mutation type encountered:', (mutation as Mutation).type);
      break;
    }
  }

  return { entities };
}

// =============================================================================
// SCENE BUILDER
// =============================================================================

/**
 * applyStep
 * Takes a scene and a step.
 * Applies every mutation in the step's mutation array in order.
 * Returns the resulting scene.
 */
function applyStep(scene: Scene, step: Step): Scene {
  return step.mutations.reduce(
    (currentScene, mutation) => applyMutation(currentScene, mutation),
    scene
  );
}

/**
 * buildSceneHistory
 * Pre-computes every scene state for every step index upfront.
 * Index 0 = initialScene (before any steps are applied).
 * Index 1 = scene after step[0] is applied.
 * Index N = scene after step[N-1] is applied.
 *
 * This makes step navigation O(1) — no recomputation on navigation.
 */
function buildSceneHistory(document: IRDocument): Scene[] {
  const history: Scene[] = [document.initialScene];

  document.steps.forEach((step) => {
    const previousScene = history[history.length - 1];
    const nextScene = applyStep(previousScene, step);
    history.push(nextScene);
  });

  return history;
}

// =============================================================================
// ENGINE CLASS
// =============================================================================

export class AnimationEngine {
  private document: IRDocument;
  private sceneHistory: Scene[];
  private currentStepIndex: number;

  constructor(document: IRDocument) {
    this.document = document;
    this.sceneHistory = buildSceneHistory(document);
    this.currentStepIndex = 0;
  }

  // ---------------------------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------------------------

  /**
   * Advance to the next step.
   * Returns false if already at the last step.
   */
  nextStep(): boolean {
    if (this.currentStepIndex >= this.document.steps.length) {
      return false;
    }
    this.currentStepIndex += 1;
    return true;
  }

  /**
   * Go back to the previous step.
   * Returns false if already at the first step.
   */
  prevStep(): boolean {
    if (this.currentStepIndex <= 0) {
      return false;
    }
    this.currentStepIndex -= 1;
    return true;
  }

  /**
   * Jump directly to a specific step index.
   * 0 = initial state (before any steps).
   * 1 = after first step.
   */
  goToStep(index: number): boolean {
    if (index < 0 || index > this.document.steps.length) {
      return false;
    }
    this.currentStepIndex = index;
    return true;
  }

  // ---------------------------------------------------------------------------
  // STATE READERS
  // ---------------------------------------------------------------------------

  /**
   * Returns the complete current engine state.
   * This is what the UI and renderer consume.
   */
  getState(): EngineState {
    const isInitialState = this.currentStepIndex === 0;
    const stepIndex = isInitialState ? 0 : this.currentStepIndex - 1;

    return {
      currentStepIndex: this.currentStepIndex,
      currentScene: this.sceneHistory[this.currentStepIndex],
      totalSteps: this.document.steps.length,
      isFirstStep: this.currentStepIndex === 0,
      isLastStep: this.currentStepIndex === this.document.steps.length,
      currentStep: this.document.steps[stepIndex],
    };
  }

  /**
   * Returns the programming language of the IR document.
   */
  getLanguage(): string {
    return this.document.meta.language;
  }

  /**
   * Returns the source code string from the IR document.
   */
  getCode(): string {
    return this.document.code.source;
  }

  /**
   * Returns the concept name (e.g. "Binary Search").
   */
  getConcept(): string {
    return this.document.meta.concept;
  }

  /**
   * Returns the active code line numbers for the current step.
   * Empty array if on initial state.
   */
  getActiveLines(): number[] {
    const { isFirstStep, currentStep } = this.getState();
    if (isFirstStep) return [];
    return currentStep?.codeLines ?? [];
  }
}