/**
 * Study AI — Animation Demo (Phase 2 Test Harness)
 * ===================================================
 * Renders all 4 concept types with hardcoded data.
 * Verifies the full pipeline: simulator → template → renderer.
 *
 * Usage: Import and render <AnimationDemo /> in App.tsx
 */

import { useState, useEffect } from 'react';
import { runSimulator } from '../../simulator/runner';
import { compileTimeline } from '../../templates/registry';
import { useAnimationPlayer } from '../../engine/useAnimationPlayer';
import { SceneRenderer } from './SceneRenderer';
import { PlaybackControls } from './PlaybackControls';
import type { LessonPlan, SortingData, TreeData, LinkedListData, StackData } from '../../router/types';
import type { AnimationTimeline } from '../../templates/types';

// =============================================================================
// DEMO LESSON PLANS
// =============================================================================

const DEMOS: Record<string, LessonPlan> = {
  'Bubble Sort': {
    simulator: 'sorting.bubble',
    visualTemplate: 'sorting',
    codePosition: 'alongside',
    concept: 'Bubble Sort',
    category: 'sorting',
    exampleData: { type: 'sorting', array: [4, 2, 6, 5, 1, 3] } as SortingData,
    code: {
      source: `def bubble_sort(my_list):
    for i in range(len(my_list) - 1, 0, -1):
        for j in range(i):
            if my_list[j] > my_list[j+1]:
                temp = my_list[j]
                my_list[j] = my_list[j+1]
                my_list[j+1] = temp
    return my_list`,
      language: 'python',
    },
    title: 'How does it work?',
    setupExplanation: 'Bubble sort repeatedly steps through the list, compares adjacent elements, and swaps them if they\'re in the wrong order.',
    phaseExplanations: {
      pass_1: 'Pass 1: Compare each pair and bubble the largest to the end',
      pass_2: 'Pass 2: The last element is sorted, now bubble the next largest',
      pass_3: 'Pass 3: Two elements are in place, continue with the rest',
    },
    insightText: 'Bubble sort has O(n²) time complexity. Simple but inefficient for large lists.',
  },

  'BFS': {
    simulator: 'tree.bfs',
    visualTemplate: 'tree',
    codePosition: 'after',
    concept: 'BFS (Breadth-First Search)',
    category: 'tree',
    exampleData: {
      type: 'tree',
      root: {
        id: 'n47', value: 47,
        left: {
          id: 'n21', value: 21,
          left: { id: 'n18', value: 18 },
          right: { id: 'n27', value: 27 },
        },
        right: {
          id: 'n76', value: 76,
          left: { id: 'n52', value: 52 },
          right: { id: 'n82', value: 82 },
        },
      },
    } as TreeData,
    code: {
      source: `def bfs(root):
    queue = [root]
    results = []
    while queue:
        node = queue.pop(0)
        results.append(node.value)
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return results`,
      language: 'python',
    },
    title: 'BFS on a Binary Tree',
    setupExplanation: 'BFS visits nodes level by level using a queue.',
    phaseExplanations: {},
    insightText: 'BFS guarantees shortest path in unweighted graphs. O(V + E) time.',
  },

  'Find Middle': {
    simulator: 'linked_list.find_middle',
    visualTemplate: 'linked_list',
    codePosition: 'after',
    concept: 'Find Middle Node',
    category: 'linked_list',
    exampleData: {
      type: 'linked_list',
      values: [1, 2, 3, 4, 5],
      pointers: { slow: 0, fast: 0 },
    } as LinkedListData,
    code: {
      source: `def find_middle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow`,
      language: 'python',
    },
    title: 'Find Middle Node',
    setupExplanation: 'Use the slow/fast pointer technique: slow moves 1 step, fast moves 2.',
    phaseExplanations: {
      walk: 'slow moves 1 step, fast moves 2 steps. When fast reaches the end, slow is at the middle.',
    },
    insightText: 'The two-pointer technique finds the middle in O(n) time with O(1) space.',
  },

  'Valid Parens': {
    simulator: 'stack.valid_parentheses',
    visualTemplate: 'stack',
    codePosition: 'after',
    concept: 'Valid Parentheses',
    category: 'stack',
    exampleData: { type: 'stack', input: '(())' } as StackData,
    code: {
      source: `def is_valid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in '([{':
            stack.append(char)
        elif char in pairs:
            if not stack or stack[-1] != pairs[char]:
                return False
            stack.pop()
    return len(stack) == 0`,
      language: 'python',
    },
    title: 'Valid Parentheses',
    setupExplanation: 'Check if brackets are balanced using a stack.',
    phaseExplanations: {
      scan: 'Scan each character. Push openers onto the stack, pop when we find a matching closer.',
    },
    insightText: 'Stack-based matching runs in O(n) time. Classic interview problem.',
  },
};

// =============================================================================
// DEMO COMPONENT
// =============================================================================

export function AnimationDemo() {
  const [activeDemo, setActiveDemo] = useState<string>('Bubble Sort');
  const [timeline, setTimeline] = useState<AnimationTimeline | null>(null);
  const player = useAnimationPlayer();

  // Build timeline when demo changes
  useEffect(() => {
    const plan = DEMOS[activeDemo];
    if (!plan || !plan.simulator) return;

    const events = runSimulator(plan.simulator, plan.exampleData);
    if (!events) return;

    const tl = compileTimeline(plan, events);
    setTimeline(tl);
    player.load(tl);
  }, [activeDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ') { e.preventDefault(); player.togglePlay(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); player.nextFrame(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); player.prevFrame(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [player]);

  const plan = DEMOS[activeDemo];
  const frame = player.state.currentFrame;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: '#1a1b26', color: '#c0caf5',
      fontFamily: 'Syne, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '14px 24px', borderBottom: '1px solid rgba(65,72,104,0.35)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 600, color: '#a9b1d6' }}>Study</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>AI</span>
        <div style={{ flex: 1 }} />

        {/* Demo selector */}
        {Object.keys(DEMOS).map(name => (
          <button
            key={name}
            onClick={() => setActiveDemo(name)}
            style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
              fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
              border: `1px solid ${name === activeDemo ? '#73daca' : 'rgba(65,72,104,0.4)'}`,
              background: name === activeDemo ? 'rgba(115,218,202,0.1)' : 'transparent',
              color: name === activeDemo ? '#73daca' : '#565f89',
              transition: 'all 0.2s',
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '24px 24px 120px',
      }}>
        {/* Title */}
        <h2 style={{
          fontSize: 26, fontWeight: 700, color: '#e2e8f0',
          marginBottom: 8, letterSpacing: '-0.02em',
        }}>
          {plan?.title}
        </h2>

        {/* Setup explanation */}
        <p style={{
          fontSize: 13, color: '#a9b1d6', marginBottom: 24,
          fontFamily: 'JetBrains Mono, monospace',
          maxWidth: 600, textAlign: 'center', lineHeight: 1.7,
        }}>
          {plan?.setupExplanation}
        </p>

        {/* Visualization */}
        <div style={{ width: '100%', maxWidth: 720, marginBottom: 12 }}>
          {frame && plan && (
            <SceneRenderer
              frame={frame}
              template={plan.visualTemplate}
            />
          )}
        </div>

        {/* Step explanation */}
        <div style={{
          width: '100%', maxWidth: 720, minHeight: 48,
          marginBottom: 8,
        }}>
          <p style={{
            fontSize: 13, color: '#a9b1d6', lineHeight: 1.8,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {frame?.explanation ?? ''}
          </p>
        </div>

        {/* Playback controls */}
        <div style={{ width: '100%', maxWidth: 720 }}>
          <PlaybackControls
            state={player.state}
            onTogglePlay={player.togglePlay}
            onNext={player.nextFrame}
            onPrev={player.prevFrame}
            onGoToFrame={player.goToFrame}
            onSetSpeed={player.setSpeed}
          />
        </div>

        {/* Timeline stats */}
        {timeline && (
          <div style={{
            marginTop: 20, fontSize: 11, color: '#3b4261',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {timeline.meta.frameCount} frames · {(timeline.meta.estimatedDuration / 1000).toFixed(1)}s · {timeline.meta.visualTemplate}
          </div>
        )}
      </div>
    </div>
  );
}