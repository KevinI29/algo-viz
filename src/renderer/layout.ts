/**
 * algo.viz — Layout Engine
 * =========================
 * Pure TypeScript. No React. No DOM.
 *
 * Converts logical entity positions into pixel coordinates.
 * This is the only file that knows about canvas dimensions.
 */

import type { Entity, EntityId, Scene, VariableLabelEntity } from '../ir/ir.types';

// =============================================================================
// LAYOUT CONSTANTS — ARRAY CELLS
// =============================================================================

export const CELL_WIDTH    = 64;
export const CELL_HEIGHT   = 52;
export const CELL_GAP      = 10;
export const CELL_Y        = 220;          // top-left y of array cells
export const CANVAS_PADDING = 60;          // left padding before index 0

// =============================================================================
// LAYOUT CONSTANTS — NODES (circles)
// =============================================================================

export const NODE_RADIUS   = 28;
export const NODE_CY       = 170;          // center-y of all nodes in linear layout
export const NODE_H_STEP   = CELL_WIDTH + CELL_GAP; // horizontal distance between node centers

// =============================================================================
// LAYOUT CONSTANTS — VARIABLE LABELS
// =============================================================================

export const LABEL_WIDTH   = 76;
export const LABEL_HEIGHT  = 32;
export const LABEL_Y       = 72;           // top-left y of variable labels

// =============================================================================
// PIXEL POSITION TYPE
// Always represents TOP-LEFT corner for rectangles, CENTER for circles.
// =============================================================================

export type PixelPosition = {
  x: number;
  y: number;
};

// =============================================================================
// HELPERS
// =============================================================================

/** Left edge x of a linear-layout cell/node at a given index. */
export function getCellX(index: number): number {
  return CANVAS_PADDING + index * NODE_H_STEP;
}

/** Center x of a linear-layout slot at a given index. */
export function getCellCenterX(index: number): number {
  return getCellX(index) + CELL_WIDTH / 2;
}

/** Canvas width required to display entityCount linear slots. */
export function getCanvasWidth(entityCount: number): number {
  return CANVAS_PADDING * 2 + entityCount * NODE_H_STEP;
}

// =============================================================================
// ENTITY POSITION RESOLVER
// Returns:
//   ARRAY_CELL    → top-left (x, y)
//   NODE          → center   (x, y)
//   VARIABLE_LABEL → top-left (x, y), horizontally centered over target
//   ARROW         → not used here; use getArrowPoints() instead
// =============================================================================

export function getEntityPixelPosition(
  entity: Entity,
  scene: Scene
): PixelPosition {

  // Absolute override always wins
  if (entity.position.absolute) {
    return { x: entity.position.absolute.x, y: entity.position.absolute.y };
  }

  const logical = entity.position.logical;

  if (entity.type === 'ARRAY_CELL') {
    return { x: getCellX(entity.index), y: CELL_Y };
  }

  if (entity.type === 'NODE') {
    const index = logical.index ?? 0;
    return { x: getCellCenterX(index), y: NODE_CY };
  }

  if (entity.type === 'VARIABLE_LABEL') {
    const target = scene.entities[entity.targetId];
    if (!target) return { x: CANVAS_PADDING, y: LABEL_Y };

    const targetPos = getEntityPixelPosition(target, scene);

    // Center the label over the target
    const targetCenterX =
      target.type === 'NODE'
        ? targetPos.x
        : targetPos.x + CELL_WIDTH / 2;

    // Offset multiple labels targeting the same entity so they don't stack
    const allLabels = Object.values(scene.entities)
      .filter(e => e.type === 'VARIABLE_LABEL' && (e as VariableLabelEntity).targetId === entity.targetId)
      .sort((a, b) => a.id.localeCompare(b.id));
    const labelIndex = allLabels.findIndex(l => l.id === entity.id);
    const xOffset = labelIndex * (LABEL_WIDTH + 6) - ((allLabels.length - 1) * (LABEL_WIDTH + 6)) / 2;

    return {
      x: targetCenterX - LABEL_WIDTH / 2 + xOffset,
      y: LABEL_Y,
    };
  }

  return { x: CANVAS_PADDING, y: CELL_Y };
}

// =============================================================================
// ARROW POINT RESOLVER
// Returns SVG line endpoints from the EDGE of source circle to EDGE of target.
// Works for both left-to-right and right-to-left arrows.
// =============================================================================

export function getArrowPoints(
  fromId: EntityId,
  toId: EntityId,
  scene: Scene
): { x1: number; y1: number; x2: number; y2: number } | null {
  const fromEntity = scene.entities[fromId];
  const toEntity   = scene.entities[toId];
  if (!fromEntity || !toEntity) return null;

  const from = getEntityPixelPosition(fromEntity, scene);
  const to   = getEntityPixelPosition(toEntity, scene);

  // Both nodes: positions are centers. Offset to circle edges.
  if (fromEntity.type === 'NODE' && toEntity.type === 'NODE') {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / dist;
    const uy = dy / dist;

    return {
      x1: from.x + ux * NODE_RADIUS,
      y1: from.y + uy * NODE_RADIUS,
      x2: to.x   - ux * NODE_RADIUS,
      y2: to.y   - uy * NODE_RADIUS,
    };
  }

  // Fallback for mixed types (array→node etc.)
  return {
    x1: from.x + CELL_WIDTH / 2,
    y1: from.y + CELL_HEIGHT / 2,
    x2: to.x   + CELL_WIDTH / 2,
    y2: to.y   + CELL_HEIGHT / 2,
  };
}