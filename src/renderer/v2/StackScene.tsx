/**
 * Study AI — Stack Scene (v2)
 * ==============================
 * Renders stack visualization: input string in center,
 * scan arrow above, stack container on the right.
 */

import type { AnimationFrame, StringDisplayState, StackContainerState } from '../../templates/types';
import { StringDisplay } from './StringDisplay';
import { StackContainer, CONTAINER_W, CONTAINER_H } from './StackContainer';

const CANVAS_W = 700;
const CANVAS_H = 300;
const STRING_Y = 130;
const STRING_CX = 300;
const STACK_X = 560;
const STACK_Y = 50;

type Props = {
  frame: AnimationFrame;
};

export function StackScene({ frame }: Props) {
  const entities = frame.entities;

  const stringDisp = Object.values(entities).find(
    (e): e is StringDisplayState => e.entityType === 'string_display'
  );

  const stackContainer = Object.values(entities).find(
    (e): e is StackContainerState => e.entityType === 'stack_container'
  );

  return (
    <svg
      width="100%" height={CANVAS_H}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      style={{ overflow: 'visible', maxWidth: 700 }}
    >
      <defs>
        <pattern id="stack-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.5" fill="#292e42" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill="#1a1b26" />
      <rect width={CANVAS_W} height={CANVAS_H} fill="url(#stack-grid)" />

      {/* String display with scan arrow */}
      {stringDisp && (
        <StringDisplay
          display={stringDisp}
          x={STRING_CX}
          y={STRING_Y}
        />
      )}

      {/* Stack container */}
      {stackContainer && (
        <StackContainer
          stack={stackContainer}
          x={STACK_X}
          y={STACK_Y}
        />
      )}
    </svg>
  );
}