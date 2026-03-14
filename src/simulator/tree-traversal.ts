/**
 * Study AI — Tree Traversal Simulators
 * ======================================
 * BFS and DFS generators that yield events matching the tree visual template.
 *
 * The BFS reference video shows:
 * - Dequeue node → highlight on tree → add to results → enqueue children
 * - Values visually fly from tree into queue/results displays
 */

import type { SimEvent } from './events';
import type { TreeNodeData } from '../router/types';

// =============================================================================
// BFS (Breadth-First Search)
// =============================================================================

export function* bfs(root: TreeNodeData): Generator<SimEvent> {
  const queue: TreeNodeData[] = [root];

  yield { type: 'phase.start', name: 'init',
          explanation: `Start by adding the root node ${root.value} to the queue` };
  yield { type: 'tree.enqueue', nodeId: root.id, value: root.value };
  yield { type: 'phase.end', name: 'init' };

  let step = 0;
  while (queue.length > 0) {
    step++;
    const node = queue.shift()!;

    yield { type: 'phase.start', name: `visit_${node.id}`,
            explanation: `Dequeue ${node.value} and visit it` };

    // Dequeue and visit
    yield { type: 'tree.dequeue', nodeId: node.id, value: node.value };
    yield { type: 'tree.visit', nodeId: node.id, value: node.value };
    yield { type: 'tree.add_result', value: node.value };

    // Check left child
    if (node.left) {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: node.left.id, side: 'left', value: node.left.value };
      queue.push(node.left);
      yield { type: 'tree.enqueue', nodeId: node.left.id, value: node.left.value };
    } else {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: null, side: 'left' };
    }

    // Check right child
    if (node.right) {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: node.right.id, side: 'right', value: node.right.value };
      queue.push(node.right);
      yield { type: 'tree.enqueue', nodeId: node.right.id, value: node.right.value };
    } else {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: null, side: 'right' };
    }

    yield { type: 'phase.end', name: `visit_${node.id}` };
  }

  yield { type: 'tree.done' };
}

// =============================================================================
// DFS — Pre-order
// =============================================================================

export function* dfsPreorder(root: TreeNodeData): Generator<SimEvent> {
  const stack: TreeNodeData[] = [root];

  yield { type: 'phase.start', name: 'init',
          explanation: `Start DFS pre-order from root node ${root.value}` };
  yield { type: 'tree.enqueue', nodeId: root.id, value: root.value };

  while (stack.length > 0) {
    const node = stack.pop()!;

    // Dequeue triggers the pink highlight in the template mapper
    yield { type: 'tree.dequeue', nodeId: node.id, value: node.value };
    yield { type: 'tree.visit', nodeId: node.id, value: node.value };
    yield { type: 'tree.add_result', value: node.value };

    // Check children — push right first so left is processed first (LIFO)
    if (node.right) {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: node.right.id, side: 'right', value: node.right.value };
      stack.push(node.right);
      yield { type: 'tree.enqueue', nodeId: node.right.id, value: node.right.value };
    } else {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: null, side: 'right' };
    }

    if (node.left) {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: node.left.id, side: 'left', value: node.left.value };
      stack.push(node.left);
      yield { type: 'tree.enqueue', nodeId: node.left.id, value: node.left.value };
    } else {
      yield { type: 'tree.check_child', parentId: node.id,
              childId: null, side: 'left' };
    }
  }

  yield { type: 'phase.end', name: 'init' };
  yield { type: 'tree.done' };
}

// =============================================================================
// DFS — In-order
// =============================================================================

export function* dfsInorder(root: TreeNodeData): Generator<SimEvent> {
  yield { type: 'phase.start', name: 'traverse',
          explanation: `In-order traversal: visit left subtree, then node, then right subtree` };

  function* walk(node: TreeNodeData | undefined): Generator<SimEvent> {
    if (!node) return;

    yield* walk(node.left);

    // Dequeue triggers pink highlight, visit transitions to visited grey
    yield { type: 'tree.dequeue', nodeId: node.id, value: node.value };
    yield { type: 'tree.visit', nodeId: node.id, value: node.value };
    yield { type: 'tree.add_result', value: node.value };

    yield* walk(node.right);
  }

  yield* walk(root);

  yield { type: 'phase.end', name: 'traverse' };
  yield { type: 'tree.done' };
}