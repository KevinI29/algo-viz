/**
 * algo.viz — IR Document Validator
 * ==================================
 * Validates that AI-generated JSON conforms to the IRDocument schema.
 * Catches malformed output before it reaches the engine or renderer.
 *
 * Not a full JSON Schema validator — targeted checks on the fields
 * we know the engine depends on. Fast and explicit.
 */

import type { IRDocument } from '../../src/ir/ir.types';

export type ValidationResult =
  | { valid: true;  document: IRDocument }
  | { valid: false; error: string };

const VALID_ENTITY_TYPES  = ['NODE', 'VARIABLE_LABEL', 'ARROW', 'ARRAY_CELL'];
const VALID_MUTATION_TYPES = [
  'CREATE_ENTITY', 'DESTROY_ENTITY',
  'HIGHLIGHT_ENTITY', 'UNHIGHLIGHT_ENTITY',
  'DIM_ENTITY', 'UNDIM_ENTITY',
  'UPDATE_VALUE', 'MOVE_ENTITY',
  'REDIRECT_ARROW', 'UPDATE_TARGET', 'UPDATE_POINTER',
];
const VALID_LANGUAGES = ['python', 'javascript', 'typescript', 'java'];

export function validateIRDocument(raw: unknown): ValidationResult {
  try {
    if (typeof raw !== 'object' || raw === null) {
      return { valid: false, error: 'Response is not an object' };
    }

    const doc = raw as Record<string, unknown>;

    // --- meta ---
    if (!doc.meta || typeof doc.meta !== 'object') {
      return { valid: false, error: 'Missing or invalid meta field' };
    }
    const meta = doc.meta as Record<string, unknown>;
    if (typeof meta.concept !== 'string' || !meta.concept.trim()) {
      return { valid: false, error: 'meta.concept must be a non-empty string' };
    }
    if (!VALID_LANGUAGES.includes(meta.language as string)) {
      return { valid: false, error: `meta.language must be one of: ${VALID_LANGUAGES.join(', ')}` };
    }
    if (meta.schemaVersion !== '1.0.0') {
      return { valid: false, error: 'meta.schemaVersion must be "1.0.0"' };
    }

    // --- code ---
    if (!doc.code || typeof (doc.code as Record<string, unknown>).source !== 'string') {
      return { valid: false, error: 'Missing or invalid code.source' };
    }

    // --- initialScene ---
    if (!doc.initialScene || typeof doc.initialScene !== 'object') {
      return { valid: false, error: 'Missing initialScene' };
    }
    const scene = doc.initialScene as Record<string, unknown>;
    if (!scene.entities || typeof scene.entities !== 'object') {
      return { valid: false, error: 'initialScene.entities must be an object' };
    }

    // Validate each entity in initialScene
    const entityMap = scene.entities as Record<string, unknown>;
    for (const [id, entity] of Object.entries(entityMap)) {
      const e = entity as Record<string, unknown>;
      if (e.id !== id) {
        return { valid: false, error: `Entity ID mismatch: key "${id}" but entity.id is "${e.id}"` };
      }
      if (!VALID_ENTITY_TYPES.includes(e.type as string)) {
        return { valid: false, error: `Entity "${id}" has invalid type: "${e.type}"` };
      }
      if (!e.style || typeof e.style !== 'object') {
        return { valid: false, error: `Entity "${id}" missing style` };
      }
      if (!e.position || typeof e.position !== 'object') {
        return { valid: false, error: `Entity "${id}" missing position` };
      }
    }

    // --- steps ---
    if (!Array.isArray(doc.steps)) {
      return { valid: false, error: 'steps must be an array' };
    }
    if (doc.steps.length === 0) {
      return { valid: false, error: 'steps array must not be empty' };
    }

    for (const [i, step] of (doc.steps as unknown[]).entries()) {
      const s = step as Record<string, unknown>;
      if (typeof s.id !== 'string') {
        return { valid: false, error: `Step ${i} missing id` };
      }
      if (typeof s.explanation !== 'string' || !s.explanation.trim()) {
        return { valid: false, error: `Step "${s.id}" missing explanation` };
      }
      if (!Array.isArray(s.codeLines)) {
        return { valid: false, error: `Step "${s.id}" codeLines must be an array` };
      }
      if (!Array.isArray(s.mutations)) {
        return { valid: false, error: `Step "${s.id}" mutations must be an array` };
      }

      // Validate each mutation
      for (const [j, mutation] of (s.mutations as unknown[]).entries()) {
        const m = mutation as Record<string, unknown>;
        if (!VALID_MUTATION_TYPES.includes(m.type as string)) {
          return {
            valid: false,
            error: `Step "${s.id}", mutation ${j}: invalid type "${m.type}"`,
          };
        }
        if (typeof m.targetId !== 'string') {
          return {
            valid: false,
            error: `Step "${s.id}", mutation ${j}: missing targetId`,
          };
        }
        if (m.payload === undefined || m.payload === null) {
          return {
            valid: false,
            error: `Step "${s.id}", mutation ${j}: missing payload`,
          };
        }
      }
    }

    return { valid: true, document: doc as unknown as IRDocument };

  } catch (err) {
    return {
      valid: false,
      error: `Validation threw an exception: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}