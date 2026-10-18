/**
 * Study AI — LessonPlan Validation
 * ==================================
 * Runtime validation for LLM-produced lesson plans. Used by the backend
 * (/api/teach) before replying and by the frontend before running anything.
 *
 * Strategy:
 * - Cosmetic fields (category, codePosition, title…) are lenient: bad values
 *   fall back to safe defaults rather than failing the whole plan.
 * - Anything that drives a simulator (simulator id, example data) is strict
 *   and size-capped, so a bad plan can't crash or hang the engine.
 * - visualTemplate is derived from the simulator, never trusted from the LLM.
 */

import { z } from 'zod';
import type {
  ExampleData, LessonExample, LessonPlan, SimulatorId, TreeNodeData,
} from '../router/types';
import { SIMULATOR_CATALOG, SIMULATOR_IDS, isSimulatorId, templateFor } from './catalog';

// =============================================================================
// CAPS — shared with the renderer (canvas sizing) and the teacher prompt
// =============================================================================

export const LESSON_CAPS = {
  sortingMinLength: 2,
  sortingMaxLength: 12,
  sortingMinValue: 0,
  sortingMaxValue: 99,
  treeMaxDepth: 4,
  treeMaxNodes: 15,
  linkedListMinLength: 1,
  linkedListMaxLength: 8,
  stackInputMaxLength: 24,
  nodeValueMin: -999,
  nodeValueMax: 999,
  additionalExamplesMax: 3,
  textMaxLength: 2000,
  codeMaxLength: 4000,
  phaseExplanationsMax: 50,
} as const;

const C = LESSON_CAPS;

// =============================================================================
// EXAMPLE DATA SCHEMAS
// =============================================================================

const nodeValue = z.int().min(C.nodeValueMin).max(C.nodeValueMax);

const SortingDataSchema = z.object({
  type: z.literal('sorting'),
  array: z.array(z.int().min(C.sortingMinValue).max(C.sortingMaxValue))
    .min(C.sortingMinLength).max(C.sortingMaxLength),
});

// Raw tree node as the LLM writes it: ids optional, children may be null.
type RawTreeNode = {
  id?: string;
  value: number;
  left?: RawTreeNode | null;
  right?: RawTreeNode | null;
};

const RawTreeNodeSchema: z.ZodType<RawTreeNode> = z.lazy(() => z.object({
  id: z.string().min(1).max(32).optional(),
  value: nodeValue,
  left: RawTreeNodeSchema.nullish(),
  right: RawTreeNodeSchema.nullish(),
}));

/** Normalise a raw tree: drop null children, ensure unique ids. */
function normaliseTree(root: RawTreeNode): TreeNodeData {
  const used = new Set<string>();
  let counter = 0;

  function walk(node: RawTreeNode): TreeNodeData {
    let id = node.id ?? `n${node.value}`;
    while (used.has(id)) id = `n${node.value}_${++counter}`;
    used.add(id);

    const out: TreeNodeData = { id, value: node.value };
    if (node.left) out.left = walk(node.left);
    if (node.right) out.right = walk(node.right);
    return out;
  }
  return walk(root);
}

function treeStats(node: RawTreeNode | null | undefined, depth = 1): { nodes: number; depth: number } {
  if (!node) return { nodes: 0, depth: 0 };
  const l = treeStats(node.left, depth + 1);
  const r = treeStats(node.right, depth + 1);
  return { nodes: 1 + l.nodes + r.nodes, depth: Math.max(depth, l.depth, r.depth) };
}

const TreeDataSchema = z.object({
  type: z.literal('tree'),
  root: RawTreeNodeSchema,
}).superRefine((data, ctx) => {
  const { nodes, depth } = treeStats(data.root);
  if (depth > C.treeMaxDepth) {
    ctx.addIssue({ code: 'custom', path: ['root'], message: `tree depth ${depth} exceeds ${C.treeMaxDepth}` });
  }
  if (nodes > C.treeMaxNodes) {
    ctx.addIssue({ code: 'custom', path: ['root'], message: `tree has ${nodes} nodes, max ${C.treeMaxNodes}` });
  }
}).transform(data => ({ type: 'tree' as const, root: normaliseTree(data.root) }));

const LinkedListDataSchema = z.object({
  type: z.literal('linked_list'),
  values: z.array(nodeValue).min(C.linkedListMinLength).max(C.linkedListMaxLength),
  pointers: z.record(z.string().min(1).max(16), z.int().min(0)).optional(),
  cycleAt: z.int().min(0).optional(),
}).superRefine((data, ctx) => {
  const n = data.values.length;
  if (data.cycleAt !== undefined && data.cycleAt >= n) {
    ctx.addIssue({ code: 'custom', path: ['cycleAt'], message: `cycleAt ${data.cycleAt} is outside the list (length ${n})` });
  }
  for (const [name, index] of Object.entries(data.pointers ?? {})) {
    if (index >= n) {
      ctx.addIssue({ code: 'custom', path: ['pointers', name], message: `pointer ${name}=${index} is outside the list (length ${n})` });
    }
  }
}).transform(data => ({ ...data, pointers: data.pointers ?? {} }));

const StackDataSchema = z.object({
  type: z.literal('stack'),
  input: z.string().min(1).max(C.stackInputMaxLength),
});

const ExampleDataSchema = z.discriminatedUnion('type', [
  SortingDataSchema, TreeDataSchema, LinkedListDataSchema, StackDataSchema,
]);

// =============================================================================
// LESSON PLAN SCHEMA (shape only — simulator-specific checks below)
// =============================================================================

// Long explanations are truncated rather than rejected
const text = z.string().transform(s => s.slice(0, C.textMaxLength));

const BasePlanSchema = z.object({
  simulator: z.string().nullish().transform(v => v ?? null),
  visualTemplate: z.enum(['sorting', 'tree', 'linked_list', 'stack']).catch('sorting'),
  codePosition: z.enum(['alongside', 'after', 'none']).catch('after'),
  concept: z.string().trim().min(1).max(200),
  category: z.enum(['sorting', 'tree', 'linked_list', 'stack', 'general']).catch('general'),
  textOnly: z.boolean().optional().catch(undefined),
  exampleData: z.unknown().optional(),
  additionalExamples: z.array(z.object({
    label: z.string().max(100).catch('Another example'),
    data: z.unknown(),
  })).max(C.additionalExamplesMax).optional(),
  code: z.object({
    source: z.string().max(C.codeMaxLength),
    language: z.string().max(20).catch('python'),
  }).optional().catch(undefined),
  title: text.optional().catch(undefined),
  setupExplanation: text.catch(''),
  phaseExplanations: z.record(z.string().max(64), text)
    .refine(r => Object.keys(r).length <= C.phaseExplanationsMax, 'too many phase explanations')
    .optional().catch(undefined),
  insightText: text.catch(''),
  complexityNote: z.string().max(200).optional().catch(undefined),
});

// =============================================================================
// PUBLIC API
// =============================================================================

export type LessonPlanParseResult =
  | { ok: true; plan: LessonPlan }
  | { ok: false; error: string };

function formatIssues(prefix: string, error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map(i => `${prefix}${i.path.length ? i.path.join('.') : '(root)'}: ${i.message}`)
    .join('; ');
}

function parseExample(
  simulator: SimulatorId,
  data: unknown,
  label: string,
): { ok: true; data: ExampleData } | { ok: false; error: string } {
  const parsed = ExampleDataSchema.safeParse(data);
  if (!parsed.success) return { ok: false, error: formatIssues(`${label}.`, parsed.error) };

  const expected = SIMULATOR_CATALOG[simulator].dataType;
  if (parsed.data.type !== expected) {
    return { ok: false, error: `${label}.type: simulator ${simulator} needs "${expected}" data, got "${parsed.data.type}"` };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Validate and normalise an untrusted lesson plan.
 * Returns a short, LLM-readable error summary on failure (used for retries).
 */
export function parseLessonPlan(raw: unknown): LessonPlanParseResult {
  const base = BasePlanSchema.safeParse(raw);
  if (!base.success) return { ok: false, error: formatIssues('', base.error) };
  const p = base.data;

  // ── Text-only / no-simulator plans: nothing will run, so ignore example data ──
  if (p.simulator === null) {
    return {
      ok: true,
      plan: {
        simulator: null,
        visualTemplate: p.visualTemplate,
        codePosition: p.codePosition,
        concept: p.concept,
        category: p.category,
        textOnly: p.textOnly,
        code: p.code,
        title: p.title ?? p.concept,
        setupExplanation: p.setupExplanation,
        phaseExplanations: p.phaseExplanations,
        insightText: p.insightText,
        complexityNote: p.complexityNote,
      },
    };
  }

  if (!isSimulatorId(p.simulator)) {
    return { ok: false, error: `simulator: unknown id "${p.simulator}". Use one of: ${SIMULATOR_IDS.join(', ')}, or null` };
  }
  const simulator = p.simulator;

  const primary = parseExample(simulator, p.exampleData, 'exampleData');
  if (!primary.ok) return primary;

  const additionalExamples: LessonExample[] = [];
  for (const [i, ex] of (p.additionalExamples ?? []).entries()) {
    const parsed = parseExample(simulator, ex.data, `additionalExamples.${i}.data`);
    if (!parsed.ok) return parsed;
    additionalExamples.push({ label: ex.label, data: parsed.data });
  }

  return {
    ok: true,
    plan: {
      simulator,
      visualTemplate: templateFor(simulator),
      codePosition: p.codePosition,
      concept: p.concept,
      category: p.category,
      textOnly: p.textOnly,
      exampleData: primary.data,
      additionalExamples: additionalExamples.length ? additionalExamples : undefined,
      code: p.code,
      title: p.title ?? p.concept,
      setupExplanation: p.setupExplanation,
      phaseExplanations: p.phaseExplanations,
      insightText: p.insightText,
      complexityNote: p.complexityNote,
    },
  };
}
