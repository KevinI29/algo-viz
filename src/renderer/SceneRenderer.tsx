/**
 * algo.viz — Scene Renderer
 * ==========================
 * Renders a complete Scene snapshot as SVG.
 * Handles all four entity types: ARRAY_CELL, NODE, VARIABLE_LABEL, ARROW.
 *
 * Render order (back to front):
 *   1. Arrows        (behind everything)
 *   2. Array Cells
 *   3. Nodes
 *   4. Variable Labels (always on top)
 */

import type { Scene } from '../ir/ir.types';
import type {
  ArrayCellEntity,
  NodeEntity,
  ArrowEntity,
  VariableLabelEntity,
} from '../ir/ir.types';
import { getEntityPixelPosition, getCanvasWidth } from './layout';
import { ArrayCell }     from './entities/ArrayCell';
import { NodeCircle }    from './entities/NodeCircle';
import { ArrowLine }     from './entities/ArrowLine';
import { VariableLabel } from './entities/VariableLabel';

const CANVAS_HEIGHT = 340;

type SceneRendererProps = {
  scene: Scene;
};

export function SceneRenderer({ scene }: SceneRendererProps) {
  const entities = Object.values(scene.entities);

  // Separate by type for ordered rendering
  const arrows        = entities.filter(e => e.type === 'ARROW')          as ArrowEntity[];
  const arrayCells    = entities.filter(e => e.type === 'ARRAY_CELL')     as ArrayCellEntity[];
  const nodes         = entities.filter(e => e.type === 'NODE')           as NodeEntity[];
  const labels        = entities.filter(e => e.type === 'VARIABLE_LABEL') as VariableLabelEntity[];

  // Canvas width — based on the largest linear index present
  const linearEntities = entities.filter(
    e => e.position.logical.layout === 'linear'
  );
  const maxIndex = linearEntities.reduce((max, e) => {
    const idx = e.position.logical.index ?? 0;
    return idx > max ? idx : max;
  }, 6);
  const canvasWidth = getCanvasWidth(maxIndex + 1);

  return (
    <svg
      width="100%"
      height={CANVAS_HEIGHT}
      viewBox={`0 0 ${canvasWidth} ${CANVAS_HEIGHT}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background */}
      <rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill="#0f0f0f" />

      {/* Layer 1 — Arrows (behind nodes) */}
      {arrows.map(entity => (
        <ArrowLine key={entity.id} entity={entity} scene={scene} />
      ))}

      {/* Layer 2 — Array Cells */}
      {arrayCells.map(entity => {
        const position = getEntityPixelPosition(entity, scene);
        return <ArrayCell key={entity.id} entity={entity} position={position} />;
      })}

      {/* Layer 3 — Nodes (circles) */}
      {nodes.map(entity => {
        const position = getEntityPixelPosition(entity, scene);
        return <NodeCircle key={entity.id} entity={entity} position={position} />;
      })}

      {/* Layer 4 — Variable Labels (always on top) */}
      {labels.map(entity => {
        const position       = getEntityPixelPosition(entity, scene);
        const target         = scene.entities[entity.targetId];
        const targetPosition = target
          ? getEntityPixelPosition(target, scene)
          : position;
        return (
          <VariableLabel
            key={entity.id}
            entity={entity}
            position={position}
            targetPosition={targetPosition}
          />
        );
      })}
    </svg>
  );
}