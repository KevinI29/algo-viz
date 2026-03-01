/**
 * algo.viz — Intermediate Representation (IR) Schema
 * ====================================================
 * This file is the architectural contract of the entire platform.
 * 
 * RULES:
 * - This file has ZERO imports. It is pure TypeScript types.
 * - The AI generation layer produces documents conforming to this schema.
 * - The rendering engine consumes documents conforming to this schema.
 * - Neither layer knows about the other. Only this contract connects them.
 * - Do NOT modify this file without versioning the change and updating
 *   both the AI prompt layer and the renderer simultaneously.
 *
 * VERSION: 1.1.0
 */

// =============================================================================
// SECTION 1: PRIMITIVES
// =============================================================================

/**
 * Every visual object on the canvas is an Entity.
 * Entities are identified by stable string IDs assigned at IR generation time.
 * IDs must be unique within a Scene and stable across all Steps.
 */
export type EntityId = string;

/**
 * The four entity types supported in V1.
 * This enum is the primary extension point for future domains:
 * V2+ may add: MATRIX_CELL, VECTOR, BOND, ORBITAL, etc.
 */
export type EntityType = 
  | 'NODE'           // Circle — represents a node (linked list, tree, heap)
  | 'VARIABLE_LABEL' // Labeled rectangle — represents a variable (temp, current, i)
  | 'ARROW'          // Directional line — represents a pointer or reference
  | 'ARRAY_CELL';    // Indexed rectangle — represents a slot in an array

// =============================================================================
// SECTION 2: POSITIONING
// =============================================================================

/**
 * Logical position — describes WHERE an entity lives in structural terms.
 * The renderer is responsible for computing actual pixel coordinates from this.
 *
 * layout: the structural arrangement this entity participates in.
 * index: position within a linear layout (0-based).
 * parentId: for tree layouts, the ID of this node's parent entity.
 * childSide: for binary trees, whether this node is a left or right child.
 */
export type LogicalPosition = {
  layout: 'linear' | 'tree';
  index?: number;
  parentId?: EntityId;
  childSide?: 'left' | 'right';
};

/**
 * Absolute position override — pixel coordinates relative to canvas origin.
 * Use sparingly. Only when logical layout cannot correctly describe position.
 */
export type AbsolutePosition = {
  x: number;
  y: number;
};

/**
 * Combined position type.
 * Always provide logical. Provide absolute only as an explicit override.
 */
export type EntityPosition = {
  logical: LogicalPosition;
  absolute?: AbsolutePosition;
};

// =============================================================================
// SECTION 3: STYLE
// =============================================================================

/**
 * Visual style properties for any entity.
 * 
 * highlighted: entity is in active/focus state (bright color treatment).
 * dimmed: entity is de-emphasized (reduced opacity).
 * color: explicit color override. Use only when semantic state is insufficient.
 * strokeColor: border/outline color override.
 * label: display text. For NODE this is the value. For VARIABLE_LABEL this is
 *        the variable name. For ARRAY_CELL this is the cell value.
 */
export type EntityStyle = {
  highlighted?: boolean;
  dimmed?: boolean;
  color?: string;
  strokeColor?: string;
  label?: string;
};

// =============================================================================
// SECTION 4: ENTITY DEFINITIONS
// =============================================================================

/**
 * Base fields shared by all entity types.
 */
export type BaseEntity = {
  id: EntityId;
  type: EntityType;
  style: EntityStyle;
  position: EntityPosition;
};

/**
 * NODE entity — rendered as a circle.
 * Represents a node in a linked list, tree, or heap.
 *
 * value: the data value stored in this node.
 * pointsTo: the logical pointer — ID of the entity this node's next/child
 *           pointer references. This is the structural relationship.
 *           The ARROW entity is the visual representation of this relationship.
 *           Both must be updated together in a REDIRECT_ARROW mutation.
 */
export type NodeEntity = BaseEntity & {
  type: 'NODE';
  value: string | number;
  pointsTo?: EntityId;
};

/**
 * VARIABLE_LABEL entity — rendered as a labeled rectangle above a node.
 * Represents a pointer variable in the algorithm (current, temp, prev, left, right).
 *
 * name: the variable name displayed in the label (e.g. "current").
 * targetId: the entity this variable currently points at.
 *           When the variable reassigns, this ID changes via UPDATE_TARGET mutation.
 *           The renderer positions this label above/near the target entity automatically.
 */
export type VariableLabelEntity = BaseEntity & {
  type: 'VARIABLE_LABEL';
  name: string;
  targetId: EntityId;
};

/**
 * ARROW entity — rendered as a directed line between two entities.
 * Represents a pointer or reference relationship visually.
 *
 * fromId: the entity the arrow originates from.
 * toId: the entity the arrow points to.
 * bidirectional: true for doubly linked list prev pointers (renders a back arrow).
 *
 * NOTE: For every NODE that has a pointsTo, there should be a corresponding
 * ARROW entity with matching fromId/toId. They are kept in sync by the engine.
 */
export type ArrowEntity = BaseEntity & {
  type: 'ARROW';
  fromId: EntityId;
  toId: EntityId;
  bidirectional?: boolean;
};

/**
 * ARRAY_CELL entity — rendered as a rectangle in a horizontal row.
 * Represents a slot in an array, with its index shown below.
 *
 * value: the value stored at this index.
 * index: the array index (0-based). Used for both logical position and display.
 */
export type ArrayCellEntity = BaseEntity & {
  type: 'ARRAY_CELL';
  value: string | number;
  index: number;
};

/**
 * Union type — any entity in the system.
 */
export type Entity = 
  | NodeEntity 
  | VariableLabelEntity 
  | ArrowEntity 
  | ArrayCellEntity;

// =============================================================================
// SECTION 5: SCENE
// =============================================================================

/**
 * A Scene is a complete snapshot of the canvas state at a point in time.
 * It is a flat map of all entities, keyed by their stable IDs.
 *
 * The initial Scene is defined in the IR document.
 * Each Step produces a new Scene by applying its Mutations to the previous Scene.
 * The engine maintains current Scene state. The renderer draws from it.
 */
export type Scene = {
  entities: Record<EntityId, Entity>;
};

// =============================================================================
// SECTION 6: MUTATIONS
// =============================================================================

/**
 * A Mutation is a single discrete change to Scene state.
 * Mutations are the atomic operations of the animation system.
 *
 * Each Mutation targets a specific entity by ID and carries a typed payload.
 * The engine applies Mutations in order to produce the next Scene.
 * The renderer animates the transition between the old and new Scene.
 *
 * This is the primary extension point for future animation complexity.
 */
export type MutationType =
  | 'CREATE_ENTITY'       // Add a new entity to the Scene
  | 'DESTROY_ENTITY'      // Remove an entity from the Scene
  | 'HIGHLIGHT_ENTITY'    // Set entity to highlighted state
  | 'UNHIGHLIGHT_ENTITY'  // Remove highlighted state from entity
  | 'DIM_ENTITY'          // Set entity to dimmed state
  | 'UNDIM_ENTITY'        // Remove dimmed state from entity
  | 'UPDATE_VALUE'        // Change the displayed value of a NODE or ARRAY_CELL
  | 'MOVE_ENTITY'         // Change the logical (and optionally absolute) position
  | 'REDIRECT_ARROW'      // Change an ARROW entity's toId (pointer reassignment)
  | 'UPDATE_TARGET'       // Change a VARIABLE_LABEL's targetId (variable reassignment)
  | 'UPDATE_POINTER'      // Change a NODE's pointsTo (logical pointer reassignment)
  | 'SWAP_POSITIONS'      // Atomically swap positions (and values) of two entities
  | 'UPDATE_STYLE';       // Set arbitrary style properties on an entity

export type CreateEntityMutation = {
  type: 'CREATE_ENTITY';
  targetId: EntityId;
  payload: { entity: Entity };
};

export type DestroyEntityMutation = {
  type: 'DESTROY_ENTITY';
  targetId: EntityId;
  payload: Record<string, never>;
};

export type HighlightEntityMutation = {
  type: 'HIGHLIGHT_ENTITY';
  targetId: EntityId;
  payload: Record<string, never>;
};

export type UnhighlightEntityMutation = {
  type: 'UNHIGHLIGHT_ENTITY';
  targetId: EntityId;
  payload: Record<string, never>;
};

export type DimEntityMutation = {
  type: 'DIM_ENTITY';
  targetId: EntityId;
  payload: Record<string, never>;
};

export type UndimEntityMutation = {
  type: 'UNDIM_ENTITY';
  targetId: EntityId;
  payload: Record<string, never>;
};

export type UpdateValueMutation = {
  type: 'UPDATE_VALUE';
  targetId: EntityId;
  payload: { value: string | number };
};

export type MoveEntityMutation = {
  type: 'MOVE_ENTITY';
  targetId: EntityId;
  payload: { position: EntityPosition };
};

export type RedirectArrowMutation = {
  type: 'REDIRECT_ARROW';
  targetId: EntityId; // ID of the ARROW entity
  payload: { toId: EntityId };
};

export type UpdateTargetMutation = {
  type: 'UPDATE_TARGET';
  targetId: EntityId; // ID of the VARIABLE_LABEL entity
  payload: { targetId: EntityId };
};

export type UpdatePointerMutation = {
  type: 'UPDATE_POINTER';
  targetId: EntityId; // ID of the NODE entity
  payload: { pointsTo: EntityId | null };
};

/**
 * SWAP_POSITIONS mutation — atomically swaps two entities.
 *
 * For ARRAY_CELL entities: swaps both positions AND values (the visual swap).
 * For all other entities: swaps only positions.
 *
 * This is the core sorting primitive. Without it, a swap requires 4+ mutations
 * (save value A, set A = B, set B = saved, move A, move B) which is fragile
 * and hard for the AI to get right.
 *
 * targetId: the first entity
 * payload.withId: the second entity
 */
export type SwapPositionsMutation = {
  type: 'SWAP_POSITIONS';
  targetId: EntityId;
  payload: { withId: EntityId };
};

/**
 * UPDATE_STYLE mutation — sets arbitrary style properties on an entity.
 *
 * Unlike HIGHLIGHT/DIM which are binary flags, this lets the AI express
 * semantic states like:
 *   - comparing: { color: '#ff9e64' }       (orange)
 *   - sorted:    { color: '#9ece6a' }       (green)
 *   - default:   { color: undefined }        (reset to theme default)
 *   - swapping:  { color: '#bb9af7' }       (purple)
 *
 * Only the properties present in payload.style are changed.
 * Omitted properties are left unchanged.
 */
export type UpdateStyleMutation = {
  type: 'UPDATE_STYLE';
  targetId: EntityId;
  payload: { style: Partial<EntityStyle> };
};

/**
 * Union type — any mutation in the system.
 */
export type Mutation =
  | CreateEntityMutation
  | DestroyEntityMutation
  | HighlightEntityMutation
  | UnhighlightEntityMutation
  | DimEntityMutation
  | UndimEntityMutation
  | UpdateValueMutation
  | MoveEntityMutation
  | RedirectArrowMutation
  | UpdateTargetMutation
  | UpdatePointerMutation
  | SwapPositionsMutation
  | UpdateStyleMutation;

// =============================================================================
// SECTION 7: STEP
// =============================================================================

/**
 * A Step is the atomic unit of learning — one narrative beat.
 *
 * id: stable identifier for this step.
 * explanation: the human-readable explanation shown in the explanation panel.
 *              Should describe WHAT is happening and WHY, not just HOW.
 * codeLines: the 1-based line numbers in the code string that are active during
 *            this step. Multiple lines may be active simultaneously.
 * mutations: the ordered list of Mutations that transform the current Scene
 *            into the next Scene. Applied in array order.
 */
export type Step = {
  id: string;
  explanation: string;
  codeLines: number[];
  mutations: Mutation[];
};

// =============================================================================
// SECTION 8: METADATA AND CODE
// =============================================================================

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'java';

export type IRMeta = {
  concept: string;           // e.g. "Binary Search", "Reverse a Linked List"
  language: SupportedLanguage;
  schemaVersion: '1.0.0' | '1.1.0';   // Bump on breaking changes. 1.1.0 adds SWAP_POSITIONS + UPDATE_STYLE.
};

/**
 * The code representation.
 * source: the full code string, with newlines separating lines.
 *         Line numbers in Step.codeLines are 1-based indices into this string.
 */
export type IRCode = {
  source: string;
};

// =============================================================================
// SECTION 9: THE IR DOCUMENT (ROOT TYPE)
// =============================================================================

/**
 * IRDocument is the complete output of the AI generation layer
 * and the complete input to the animation engine.
 *
 * This is the contract. This is what everything is built around.
 */
export type IRDocument = {
  meta: IRMeta;
  code: IRCode;
  initialScene: Scene;
  steps: Step[];
};