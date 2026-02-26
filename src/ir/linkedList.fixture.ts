/**
 * algo.viz — Hand-Authored IR Fixture: Reverse a Linked List
 * ===========================================================
 * Algorithm : Reverse a Singly Linked List
 * Nodes     : 1 → 2 → 3 → 4 → 5
 * Pointers  : prev, current, next_node
 *
 * Teaching story:
 *   Step 1 — Initialize prev=None, current=head
 *   Step 2 — Iteration 1: reverse node1, advance pointers
 *   Step 3 — Iteration 2: reverse node2, advance pointers
 *   Step 4 — Iteration 3: reverse node3, advance pointers
 *   Step 5 — Iteration 4: reverse node4, advance pointers
 *   Step 6 — Iteration 5: reverse node5, current=None
 *   Step 7 — Return prev — node5 is the new head
 */

import type { IRDocument } from '../ir/ir.types';

export const linkedListFixture: IRDocument = {
  meta: {
    concept: 'Reverse a Linked List',
    language: 'python',
    schemaVersion: '1.0.0',
  },

  code: {
    source: `def reverse_linked_list(head):
    prev = None
    current = head

    while current is not None:
        next_node = current.next
        current.next = prev
        prev = current
        current = next_node

    return prev`,
  },

  // ---------------------------------------------------------------------------
  // INITIAL SCENE
  // null_node + 5 nodes + 4 forward arrows
  // null_node uses absolute positioning (left of node1)
  // ---------------------------------------------------------------------------
  initialScene: {
    entities: {

      // Null sentinel — represents None/null pointer target
      null_node: {
        id: 'null_node',
        type: 'NODE',
        value: '∅',
        style: { highlighted: false, dimmed: false },
        position: {
          logical: { layout: 'linear', index: 0 },
          absolute: { x: 18, y: 170 },   // center of circle; to the left of node1
        },
      },

      node1: {
        id: 'node1', type: 'NODE', value: 1,
        pointsTo: 'node2',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 0 } },
      },
      node2: {
        id: 'node2', type: 'NODE', value: 2,
        pointsTo: 'node3',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 1 } },
      },
      node3: {
        id: 'node3', type: 'NODE', value: 3,
        pointsTo: 'node4',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 2 } },
      },
      node4: {
        id: 'node4', type: 'NODE', value: 4,
        pointsTo: 'node5',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 3 } },
      },
      node5: {
        id: 'node5', type: 'NODE', value: 5,
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 4 } },
      },

      // Forward arrows
      arrow_1_2: {
        id: 'arrow_1_2', type: 'ARROW',
        fromId: 'node1', toId: 'node2',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 0 } },
      },
      arrow_2_3: {
        id: 'arrow_2_3', type: 'ARROW',
        fromId: 'node2', toId: 'node3',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 1 } },
      },
      arrow_3_4: {
        id: 'arrow_3_4', type: 'ARROW',
        fromId: 'node3', toId: 'node4',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 2 } },
      },
      arrow_4_5: {
        id: 'arrow_4_5', type: 'ARROW',
        fromId: 'node4', toId: 'node5',
        style: { highlighted: false, dimmed: false },
        position: { logical: { layout: 'linear', index: 3 } },
      },
    },
  },

  steps: [

    // -------------------------------------------------------------------------
    // STEP 1 — Initialize: prev = None, current = head (node1)
    // -------------------------------------------------------------------------
    {
      id: 'step_1',
      explanation:
        'We initialize two pointers. `prev` starts as None — there is nothing behind the head yet. `current` starts at the head (node 1). We will walk forward through the list, reversing one pointer at a time.',
      codeLines: [2, 3],
      mutations: [
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_prev',
          payload: {
            entity: {
              id: 'label_prev', type: 'VARIABLE_LABEL', name: 'prev',
              targetId: 'null_node',
              style: { highlighted: false, label: 'prev' },
              position: { logical: { layout: 'linear', index: 0 } },
            },
          },
        },
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_current',
          payload: {
            entity: {
              id: 'label_current', type: 'VARIABLE_LABEL', name: 'current',
              targetId: 'node1',
              style: { highlighted: true, label: 'current' },
              position: { logical: { layout: 'linear', index: 0 } },
            },
          },
        },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'node1', payload: {} },
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 2 — Iteration 1: save next=node2, reverse node1→∅, advance
    // -------------------------------------------------------------------------
    {
      id: 'step_2',
      explanation:
        'First iteration. We save `next_node = node2` so we don\'t lose the rest of the list. Then we reverse: `node1.next = prev` (None). We advance `prev` to node1 and `current` to node2. Node1\'s arrow now points backward to ∅.',
      codeLines: [5, 6, 7, 8, 9],
      mutations: [
        // Show next_node label briefly on node2
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_next',
          payload: {
            entity: {
              id: 'label_next', type: 'VARIABLE_LABEL', name: 'next',
              targetId: 'node2',
              style: { highlighted: true, label: 'next' },
              position: { logical: { layout: 'linear', index: 1 } },
            },
          },
        },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'node2', payload: {} },
        // Destroy forward arrow 1→2, create reverse arrow 1→null
        { type: 'DESTROY_ENTITY', targetId: 'arrow_1_2', payload: {} },
        {
          type: 'CREATE_ENTITY',
          targetId: 'arrow_1_null',
          payload: {
            entity: {
              id: 'arrow_1_null', type: 'ARROW',
              fromId: 'node1', toId: 'null_node',
              style: { highlighted: false, dimmed: false },
              position: { logical: { layout: 'linear', index: 0 } },
            },
          },
        },
        // Update logical pointer on node1
        { type: 'UPDATE_POINTER', targetId: 'node1', payload: { pointsTo: 'null_node' } },
        // Advance prev → node1, current → node2
        { type: 'UPDATE_TARGET', targetId: 'label_prev', payload: { targetId: 'node1' } },
        { type: 'UPDATE_TARGET', targetId: 'label_current', payload: { targetId: 'node2' } },
        { type: 'UPDATE_TARGET', targetId: 'label_next', payload: { targetId: 'node3' } },
        // Visual state updates
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'node1', payload: {} },
        { type: 'HIGHLIGHT_ENTITY',   targetId: 'node2', payload: {} },
        { type: 'DIM_ENTITY',         targetId: 'node1', payload: {} },
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 3 — Iteration 2: reverse node2→node1, advance
    // -------------------------------------------------------------------------
    {
      id: 'step_3',
      explanation:
        'Second iteration. `next_node` is now node3. We reverse `node2.next = prev` (node1). Then `prev` moves to node2 and `current` moves to node3. The reversed section now has two nodes: 2→1→∅.',
      codeLines: [5, 6, 7, 8, 9],
      mutations: [
        { type: 'DESTROY_ENTITY', targetId: 'arrow_2_3', payload: {} },
        {
          type: 'CREATE_ENTITY',
          targetId: 'arrow_2_1',
          payload: {
            entity: {
              id: 'arrow_2_1', type: 'ARROW',
              fromId: 'node2', toId: 'node1',
              style: { highlighted: false, dimmed: false },
              position: { logical: { layout: 'linear', index: 1 } },
            },
          },
        },
        { type: 'UPDATE_POINTER', targetId: 'node2', payload: { pointsTo: 'node1' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_prev',    payload: { targetId: 'node2' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_current', payload: { targetId: 'node3' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_next',    payload: { targetId: 'node4' } },
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'node2', payload: {} },
        { type: 'HIGHLIGHT_ENTITY',   targetId: 'node3', payload: {} },
        { type: 'DIM_ENTITY',         targetId: 'node2', payload: {} },
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 4 — Iteration 3: reverse node3→node2, advance
    // -------------------------------------------------------------------------
    {
      id: 'step_4',
      explanation:
        'Third iteration. `next_node` is node4. We reverse `node3.next = prev` (node2). `prev` moves to node3, `current` moves to node4. Reversed chain is now 3→2→1→∅.',
      codeLines: [5, 6, 7, 8, 9],
      mutations: [
        { type: 'DESTROY_ENTITY', targetId: 'arrow_3_4', payload: {} },
        {
          type: 'CREATE_ENTITY',
          targetId: 'arrow_3_2',
          payload: {
            entity: {
              id: 'arrow_3_2', type: 'ARROW',
              fromId: 'node3', toId: 'node2',
              style: { highlighted: false, dimmed: false },
              position: { logical: { layout: 'linear', index: 2 } },
            },
          },
        },
        { type: 'UPDATE_POINTER', targetId: 'node3', payload: { pointsTo: 'node2' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_prev',    payload: { targetId: 'node3' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_current', payload: { targetId: 'node4' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_next',    payload: { targetId: 'node5' } },
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'node3', payload: {} },
        { type: 'HIGHLIGHT_ENTITY',   targetId: 'node4', payload: {} },
        { type: 'DIM_ENTITY',         targetId: 'node3', payload: {} },
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 5 — Iteration 4: reverse node4→node3, advance
    // -------------------------------------------------------------------------
    {
      id: 'step_5',
      explanation:
        'Fourth iteration. `next_node` is node5. We reverse `node4.next = prev` (node3). `prev` moves to node4, `current` moves to node5. Almost done — reversed chain is 4→3→2→1→∅.',
      codeLines: [5, 6, 7, 8, 9],
      mutations: [
        { type: 'DESTROY_ENTITY', targetId: 'arrow_4_5', payload: {} },
        {
          type: 'CREATE_ENTITY',
          targetId: 'arrow_4_3',
          payload: {
            entity: {
              id: 'arrow_4_3', type: 'ARROW',
              fromId: 'node4', toId: 'node3',
              style: { highlighted: false, dimmed: false },
              position: { logical: { layout: 'linear', index: 3 } },
            },
          },
        },
        { type: 'UPDATE_POINTER', targetId: 'node4', payload: { pointsTo: 'node3' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_prev',    payload: { targetId: 'node4' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_current', payload: { targetId: 'node5' } },
        { type: 'DESTROY_ENTITY', targetId: 'label_next',    payload: {} },
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'node4', payload: {} },
        { type: 'HIGHLIGHT_ENTITY',   targetId: 'node5', payload: {} },
        { type: 'DIM_ENTITY',         targetId: 'node4', payload: {} },
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 6 — Iteration 5: reverse node5→node4, current becomes None
    // -------------------------------------------------------------------------
    {
      id: 'step_6',
      explanation:
        'Final iteration. `next_node` is None. We reverse `node5.next = prev` (node4). We advance `prev` to node5 and `current` to None. The while loop exits — `current is None`.',
      codeLines: [5, 6, 7, 8, 9],
      mutations: [
        {
          type: 'CREATE_ENTITY',
          targetId: 'arrow_5_4',
          payload: {
            entity: {
              id: 'arrow_5_4', type: 'ARROW',
              fromId: 'node5', toId: 'node4',
              style: { highlighted: true, dimmed: false },
              position: { logical: { layout: 'linear', index: 4 } },
            },
          },
        },
        { type: 'UPDATE_POINTER', targetId: 'node5', payload: { pointsTo: 'node4' } },
        { type: 'UPDATE_TARGET',  targetId: 'label_prev', payload: { targetId: 'node5' } },
        // current is now None — remove the label
        { type: 'DESTROY_ENTITY', targetId: 'label_current', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'node5', payload: {} },
        { type: 'DIM_ENTITY',       targetId: 'node5', payload: {} }, // will re-highlight in step 7
      ],
    },

    // -------------------------------------------------------------------------
    // STEP 7 — Return prev — node5 is the new head
    // -------------------------------------------------------------------------
    {
      id: 'step_7',
      explanation:
        'We return `prev`, which now points to node5. The list has been fully reversed: 5→4→3→2→1→∅. Node5 is the new head. Every arrow that pointed right now points left. The algorithm runs in O(n) time and O(1) space.',
      codeLines: [11],
      mutations: [
        // Spotlight the new head
        { type: 'UNDIM_ENTITY',     targetId: 'node5', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'node5', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'label_prev', payload: {} },
        // Dim null node — it's no longer the focus
        { type: 'DIM_ENTITY', targetId: 'null_node', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'label_prev', payload: {} },
      ],
    },
  ],
};