/**
 * Study AI — Simulator Catalog
 * ==============================
 * Static facts about each simulator: which example-data type it consumes and
 * which visual template renders it. Shared by the frontend registry and the
 * backend validator, so it must stay free of simulator/renderer imports.
 */

import type { DataType, SimulatorId, VisualTemplate } from '../router/types';

export type CatalogEntry = {
  dataType: DataType;
  template: VisualTemplate;
};

export const SIMULATOR_CATALOG: Record<SimulatorId, CatalogEntry> = {
  'sorting.bubble':           { dataType: 'sorting',     template: 'sorting' },
  'sorting.insertion':        { dataType: 'sorting',     template: 'sorting' },
  'sorting.selection':        { dataType: 'sorting',     template: 'sorting' },
  'tree.bfs':                 { dataType: 'tree',        template: 'tree' },
  'tree.dfs_preorder':        { dataType: 'tree',        template: 'tree' },
  'tree.dfs_inorder':         { dataType: 'tree',        template: 'tree' },
  'linked_list.find_middle':  { dataType: 'linked_list', template: 'linked_list' },
  'linked_list.reverse':      { dataType: 'linked_list', template: 'linked_list' },
  'linked_list.detect_cycle': { dataType: 'linked_list', template: 'linked_list' },
  'stack.valid_parentheses':  { dataType: 'stack',       template: 'stack' },
  'stack.evaluate_postfix':   { dataType: 'stack',       template: 'stack' },
};

export const SIMULATOR_IDS = Object.keys(SIMULATOR_CATALOG) as SimulatorId[];

export function isSimulatorId(id: string): id is SimulatorId {
  return Object.hasOwn(SIMULATOR_CATALOG, id);
}

/** The visual template a simulator renders with. */
export function templateFor(id: SimulatorId): VisualTemplate {
  return SIMULATOR_CATALOG[id].template;
}
