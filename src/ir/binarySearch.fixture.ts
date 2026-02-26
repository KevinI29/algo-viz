/**
 * algo.viz — Hand-Authored IR Fixture: Binary Search
 * ====================================================
 * This is a manually crafted IRDocument.
 * It is the ground truth for testing the engine and renderer.
 * 
 * Algorithm: Binary Search
 * Array: [2, 5, 8, 12, 16, 23, 38]
 * Target: 23
 * 
 * Teaching story:
 * Step 1 — Initialize left and right pointers
 * Step 2 — Compute mid, check arr[mid] vs target. Too small, go right.
 * Step 3 — Move left pointer past mid
 * Step 4 — Recompute mid, check arr[mid] vs target. Match found.
 * Step 5 — Return mid index. Done.
 */

import type { IRDocument } from '../ir/ir.types';

export const binarySearchFixture: IRDocument = {
  meta: {
    concept: 'Binary Search',
    language: 'python',
    schemaVersion: '1.0.0',
  },

  code: {
    source: `def binary_search(arr, target):
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = (left + right) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`,
  },

  // -------------------------------------------------------------------------
  // INITIAL SCENE
  // Seven array cells. No labels yet — they appear in Step 1.
  // -------------------------------------------------------------------------
  initialScene: {
    entities: {
      cell_0: {
        id: 'cell_0',
        type: 'ARRAY_CELL',
        value: 2,
        index: 0,
        style: { highlighted: false, dimmed: false, label: '2' },
        position: { logical: { layout: 'linear', index: 0 } },
      },
      cell_1: {
        id: 'cell_1',
        type: 'ARRAY_CELL',
        value: 5,
        index: 1,
        style: { highlighted: false, dimmed: false, label: '5' },
        position: { logical: { layout: 'linear', index: 1 } },
      },
      cell_2: {
        id: 'cell_2',
        type: 'ARRAY_CELL',
        value: 8,
        index: 2,
        style: { highlighted: false, dimmed: false, label: '8' },
        position: { logical: { layout: 'linear', index: 2 } },
      },
      cell_3: {
        id: 'cell_3',
        type: 'ARRAY_CELL',
        value: 12,
        index: 3,
        style: { highlighted: false, dimmed: false, label: '12' },
        position: { logical: { layout: 'linear', index: 3 } },
      },
      cell_4: {
        id: 'cell_4',
        type: 'ARRAY_CELL',
        value: 16,
        index: 4,
        style: { highlighted: false, dimmed: false, label: '16' },
        position: { logical: { layout: 'linear', index: 4 } },
      },
      cell_5: {
        id: 'cell_5',
        type: 'ARRAY_CELL',
        value: 23,
        index: 5,
        style: { highlighted: false, dimmed: false, label: '23' },
        position: { logical: { layout: 'linear', index: 5 } },
      },
      cell_6: {
        id: 'cell_6',
        type: 'ARRAY_CELL',
        value: 38,
        index: 6,
        style: { highlighted: false, dimmed: false, label: '38' },
        position: { logical: { layout: 'linear', index: 6 } },
      },
    },
  },

  // -------------------------------------------------------------------------
  // STEPS
  // -------------------------------------------------------------------------
  steps: [

    // -----------------------------------------------------------------------
    // STEP 1 — Initialize left = 0, right = 6
    // Code line 2: left, right = 0, len(arr) - 1
    // -----------------------------------------------------------------------
    {
      id: 'step_1',
      explanation:
        'We start by setting two pointers. `left` points to the first element (index 0) and `right` points to the last element (index 6). These define our current search range — the entire array.',
      codeLines: [2],
      mutations: [
        // Create left label pointing at cell_0
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_left',
          payload: {
            entity: {
              id: 'label_left',
              type: 'VARIABLE_LABEL',
              name: 'left',
              targetId: 'cell_0',
              style: { highlighted: true, label: 'left' },
              position: { logical: { layout: 'linear', index: 0 } },
            },
          },
        },
        // Create right label pointing at cell_6
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_right',
          payload: {
            entity: {
              id: 'label_right',
              type: 'VARIABLE_LABEL',
              name: 'right',
              targetId: 'cell_6',
              style: { highlighted: true, label: 'right' },
              position: { logical: { layout: 'linear', index: 6 } },
            },
          },
        },
        // Highlight the boundary cells
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_0', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_6', payload: {} },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 2 — Compute mid = (0 + 6) // 2 = 3
    // Code line 4: mid = (left + right) // 2
    // arr[3] = 12. Target is 23. 12 < 23, so we go right.
    // -----------------------------------------------------------------------
    {
      id: 'step_2',
      explanation:
        '`mid` is calculated as the midpoint of `left` and `right`: (0 + 6) // 2 = 3. We check `arr[3]` which is 12. Since 12 < 23 (our target), the answer must be in the right half. We can eliminate everything to the left of `mid`.',
      codeLines: [4, 7, 8],
      mutations: [
        // Create mid label pointing at cell_3
        {
          type: 'CREATE_ENTITY',
          targetId: 'label_mid',
          payload: {
            entity: {
              id: 'label_mid',
              type: 'VARIABLE_LABEL',
              name: 'mid',
              targetId: 'cell_3',
              style: { highlighted: true, label: 'mid' },
              position: { logical: { layout: 'linear', index: 3 } },
            },
          },
        },
        // Highlight mid cell
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_3', payload: {} },
        // Unhighlight boundary cells — focus is on mid now
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'cell_0', payload: {} },
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'cell_6', payload: {} },
        // Dim the left half — eliminated
        { type: 'DIM_ENTITY', targetId: 'cell_0', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'cell_1', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'cell_2', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'cell_3', payload: {} },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 3 — Move left to mid + 1 = 4
    // Code line 9: left = mid + 1
    // New search range is indices 4–6
    // -----------------------------------------------------------------------
    {
      id: 'step_3',
      explanation:
        'Since `arr[mid]` was too small, we move `left` to `mid + 1` (index 4). The left half is now eliminated. Our new search range is just [16, 23, 38] — three elements.',
      codeLines: [9],
      mutations: [
        // Move left label to cell_4
        {
          type: 'UPDATE_TARGET',
          targetId: 'label_left',
          payload: { targetId: 'cell_4' },
        },
        // Highlight the new boundary cells
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_4', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_6', payload: {} },
        // Unhighlight mid — it's no longer active
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'label_mid', payload: {} },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 4 — Recompute mid = (4 + 6) // 2 = 5
    // Code line 4: mid = (left + right) // 2
    // arr[5] = 23. Target is 23. Match found!
    // -----------------------------------------------------------------------
    {
      id: 'step_4',
      explanation:
        'We loop again. New `mid` = (4 + 6) // 2 = 5. We check `arr[5]` which is 23. That equals our target! We found it.',
      codeLines: [4, 6],
      mutations: [
        // Move mid label to cell_5
        {
          type: 'UPDATE_TARGET',
          targetId: 'label_mid',
          payload: { targetId: 'cell_5' },
        },
        // Highlight mid cell — this is the match
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_5', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'label_mid', payload: {} },
        // Unhighlight boundaries — focus is on the match
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'cell_4', payload: {} },
        { type: 'UNHIGHLIGHT_ENTITY', targetId: 'cell_6', payload: {} },
      ],
    },

    // -----------------------------------------------------------------------
    // STEP 5 — Return mid = 5
    // Code line 7: return mid
    // -----------------------------------------------------------------------
    {
      id: 'step_5',
      explanation:
        '`arr[mid] == target`, so we return `mid` which is 5. Binary Search found 23 at index 5 in just 2 iterations — compared to up to 7 iterations with linear search. This is the power of O(log n).',
      codeLines: [7],
      mutations: [
        // Dim everything except the found cell
        { type: 'DIM_ENTITY', targetId: 'cell_4', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'cell_6', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'label_left', payload: {} },
        { type: 'DIM_ENTITY', targetId: 'label_right', payload: {} },
        // Keep cell_5 and label_mid highlighted — the answer
        { type: 'HIGHLIGHT_ENTITY', targetId: 'cell_5', payload: {} },
        { type: 'HIGHLIGHT_ENTITY', targetId: 'label_mid', payload: {} },
      ],
    },
  ],
};