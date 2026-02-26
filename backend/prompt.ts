/**
 * algo.viz — IR Generation Prompt
 * =================================
 * This is the most important prompt in the system.
 * It teaches the AI exactly what our IR schema is,
 * what animation primitives exist, and how to produce
 * a valid IRDocument for any learning concept.
 *
 * Prompt engineering principles used here:
 *   - Schema is provided verbatim so the AI has no ambiguity
 *   - Examples are embedded to anchor output format
 *   - Constraints are explicit and repeated
 *   - Temperature is kept low (set in provider)
 */

export type GenerationMode = 'animation' | 'explanation';

// =============================================================================
// MODE CLASSIFIER PROMPT
// Lightweight first call — decides which mode to use
// =============================================================================

export function buildClassifierPrompt(concept: string): string {
  return `You are a learning platform that decides how to best explain concepts.

Given a user's question or concept, decide whether it benefits from:
- "animation": step-by-step visual animation (data structures, algorithms, sorting, searching, pointers, trees, graphs, recursion, code execution)
- "explanation": clear text explanation (theory questions, concepts, definitions, "why" questions, math concepts without visual state changes)

When in doubt, choose "animation" — visual explanation is our core strength.

User input: "${concept}"

Respond with exactly one JSON object, nothing else:
{"mode": "animation"} or {"mode": "explanation"}`;
}

// =============================================================================
// IR GENERATION PROMPT
// Full prompt that generates a complete IRDocument
// =============================================================================

export function buildIRGenerationPrompt(concept: string): string {
  return `You are an AI that generates structured animation documents for a learning platform called algo.viz.

Your job: take a learning concept and produce a complete IRDocument JSON object that the platform's animation engine will render as a synchronized, step-by-step visual explanation.

## THE IR SCHEMA

You must produce a JSON object that exactly matches this TypeScript schema:

\`\`\`typescript
type EntityType = 'NODE' | 'VARIABLE_LABEL' | 'ARROW' | 'ARRAY_CELL'

type LogicalPosition = {
  layout: 'linear' | 'tree'
  index?: number        // 0-based position in linear layout
  parentId?: string     // for tree layout
  childSide?: 'left' | 'right'
}

type EntityPosition = {
  logical: LogicalPosition
  absolute?: { x: number; y: number }  // optional pixel override
}

type EntityStyle = {
  highlighted?: boolean
  dimmed?: boolean
  color?: string
  label?: string
}

// NODE — rendered as a circle. For linked lists, trees, heaps.
type NodeEntity = {
  id: string; type: 'NODE'
  value: string | number
  pointsTo?: string        // logical pointer to another entity ID
  style: EntityStyle
  position: EntityPosition
}

// VARIABLE_LABEL — rendered as a labeled rectangle above a node.
type VariableLabelEntity = {
  id: string; type: 'VARIABLE_LABEL'
  name: string             // e.g. "current", "prev", "left", "mid"
  targetId: string         // ID of the entity this label points at
  style: EntityStyle
  position: EntityPosition
}

// ARROW — rendered as a directed line between two entities.
type ArrowEntity = {
  id: string; type: 'ARROW'
  fromId: string; toId: string
  bidirectional?: boolean
  style: EntityStyle
  position: EntityPosition
}

// ARRAY_CELL — rendered as a rectangle in a horizontal row.
type ArrayCellEntity = {
  id: string; type: 'ARRAY_CELL'
  value: string | number
  index: number            // 0-based
  style: EntityStyle
  position: EntityPosition
}

type Entity = NodeEntity | VariableLabelEntity | ArrowEntity | ArrayCellEntity

type Scene = {
  entities: Record<string, Entity>
}

// MUTATION TYPES
// Each mutation targets one entity by ID and changes one thing.
type Mutation =
  | { type: 'CREATE_ENTITY';       targetId: string; payload: { entity: Entity } }
  | { type: 'DESTROY_ENTITY';      targetId: string; payload: {} }
  | { type: 'HIGHLIGHT_ENTITY';    targetId: string; payload: {} }
  | { type: 'UNHIGHLIGHT_ENTITY';  targetId: string; payload: {} }
  | { type: 'DIM_ENTITY';          targetId: string; payload: {} }
  | { type: 'UNDIM_ENTITY';        targetId: string; payload: {} }
  | { type: 'UPDATE_VALUE';        targetId: string; payload: { value: string | number } }
  | { type: 'MOVE_ENTITY';         targetId: string; payload: { position: EntityPosition } }
  | { type: 'REDIRECT_ARROW';      targetId: string; payload: { toId: string } }
  | { type: 'UPDATE_TARGET';       targetId: string; payload: { targetId: string } }
  | { type: 'UPDATE_POINTER';      targetId: string; payload: { pointsTo: string | null } }

type Step = {
  id: string
  explanation: string      // What is happening and WHY — not just HOW
  codeLines: number[]      // 1-based line numbers active during this step
  mutations: Mutation[]
}

type IRDocument = {
  meta: {
    concept: string
    language: 'python' | 'javascript' | 'typescript' | 'java'
    schemaVersion: '1.0.0'
  }
  code: { source: string }  // Full code string, newline-separated
  initialScene: Scene       // Starting state before any steps
  steps: Step[]             // 4-8 steps for most concepts
}
\`\`\`

## RULES

1. Every entity ID must be unique and stable across ALL steps.
2. initialScene must contain all entities that exist at the start.
3. CREATE_ENTITY adds new entities mid-animation (e.g. pointer labels appearing).
4. DESTROY_ENTITY removes entities that are no longer relevant.
5. For linked lists: always pair REDIRECT_ARROW + UPDATE_POINTER together when reversing a pointer.
6. For arrays: use ARRAY_CELL entities with index 0, 1, 2...
7. For pointer variables: use VARIABLE_LABEL entities with targetId pointing at the current target.
8. Aim for 5-8 steps. Each step = one conceptual event.
9. Explanations must be educational — explain WHY, not just WHAT.
10. code.source must use real, correct, runnable code.
11. codeLines must be 1-based and match actual lines in code.source.
12. Use 'python' as default language unless otherwise specified.
13. NEVER include markdown, code blocks, or explanation outside the JSON.
14. Respond with ONLY the raw JSON object. No preamble. No postamble.

## EXAMPLE OUTPUT STRUCTURE

{
  "meta": { "concept": "...", "language": "python", "schemaVersion": "1.0.0" },
  "code": { "source": "def example():\\n    pass" },
  "initialScene": {
    "entities": {
      "cell_0": {
        "id": "cell_0", "type": "ARRAY_CELL", "value": 5, "index": 0,
        "style": { "highlighted": false, "dimmed": false },
        "position": { "logical": { "layout": "linear", "index": 0 } }
      }
    }
  },
  "steps": [
    {
      "id": "step_1",
      "explanation": "We begin by...",
      "codeLines": [1, 2],
      "mutations": [
        { "type": "HIGHLIGHT_ENTITY", "targetId": "cell_0", "payload": {} }
      ]
    }
  ]
}

## YOUR TASK

Generate a complete, valid IRDocument for the following concept:

"${concept}"

Remember: respond with ONLY the raw JSON object. Nothing else.`;
}

// =============================================================================
// EXPLANATION PROMPT
// For concepts that don't need animation
// =============================================================================

export function buildExplanationPrompt(concept: string): string {
  return `You are the best computer science teacher in the world. Your explanations are so clear that students never need to Google the topic again.

When explaining, you:
- Start with a one-sentence core idea (the "what")
- Follow with a real-world analogy that makes it concrete
- Explain the "why it matters" in 2-3 sentences
- Give a concrete minimal example
- End with one key insight they should remember forever

Keep the total response under 300 words. No filler. No padding. Every sentence teaches something.

Concept to explain: "${concept}"`;
}