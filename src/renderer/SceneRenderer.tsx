/**
 * algo.viz — Scene Renderer
 * Tokyo Night canvas with dot grid background.
 */

import type { Scene } from '../ir/ir.types';
import type {
  ArrayCellEntity, NodeEntity, ArrowEntity, VariableLabelEntity,
} from '../ir/ir.types';
import { getEntityPixelPosition, getCanvasWidth } from './layout';
import { ArrayCell }     from './entities/ArrayCell';
import { NodeCircle }    from './entities/NodeCircle';
import { ArrowLine }     from './entities/ArrowLine';
import { VariableLabel } from './entities/VariableLabel';

const CANVAS_HEIGHT = 360;

type SceneRendererProps = { scene: Scene };

export function SceneRenderer({ scene }: SceneRendererProps) {
  const entities   = Object.values(scene.entities);
  const arrows     = entities.filter(e => e.type === 'ARROW')          as ArrowEntity[];
  const arrayCells = entities.filter(e => e.type === 'ARRAY_CELL')     as ArrayCellEntity[];
  const nodes      = entities.filter(e => e.type === 'NODE')           as NodeEntity[];
  const labels     = entities.filter(e => e.type === 'VARIABLE_LABEL') as VariableLabelEntity[];

  const linearEntities = entities.filter(e => e.position.logical.layout === 'linear');
  const maxIndex = linearEntities.reduce((max, e) => {
    const idx = e.position.logical.index ?? 0;
    return idx > max ? idx : max;
  }, 6);
  const canvasWidth = getCanvasWidth(maxIndex + 1);

  return (
    <svg
      width="100%" height={CANVAS_HEIGHT}
      viewBox={`0 0 ${canvasWidth} ${CANVAS_HEIGHT}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Tokyo Night dot grid */}
        <pattern id="grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.65" fill="#292e42" />
        </pattern>

        {/* Subtle vignette */}
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stopColor="#1a1b26" stopOpacity="0"   />
          <stop offset="100%" stopColor="#16161e" stopOpacity="0.55" />
        </radialGradient>

        {/* Soft blue center tint */}
        <radialGradient id="ambientGlow" cx="50%" cy="58%" r="38%">
          <stop offset="0%"   stopColor="#3d59a1" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#3d59a1" stopOpacity="0"    />
        </radialGradient>
      </defs>

      {/* Base */}
      <rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill="#1a1b26" />
      {/* Grid */}
      <rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill="url(#grid)" />
      {/* Ambient */}
      <rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill="url(#ambientGlow)" />

      {/* Layer 1 — Arrows */}
      {arrows.map(entity => (
        <ArrowLine key={entity.id} entity={entity} scene={scene} />
      ))}

      {/* Layer 2 — Array Cells */}
      {arrayCells.map(entity => {
        const position = getEntityPixelPosition(entity, scene);
        return <ArrayCell key={entity.id} entity={entity} position={position} />;
      })}

      {/* Layer 3 — Nodes */}
      {nodes.map((entity, i) => {
        const position = getEntityPixelPosition(entity, scene);
        return <NodeCircle key={entity.id} entity={entity} position={position} index={i} />;
      })}

      {/* Layer 4 — Variable Labels */}
      {labels.map(entity => {
        const position       = getEntityPixelPosition(entity, scene);
        const target         = scene.entities[entity.targetId];
        const targetPosition = target ? getEntityPixelPosition(target, scene) : position;
        return (
          <VariableLabel
            key={entity.id}
            entity={entity}
            position={position}
            targetPosition={targetPosition}
            targetType={target?.type}
          />
        );
      })}

      {/* Vignette overlay */}
      <rect x={0} y={0} width={canvasWidth} height={CANVAS_HEIGHT} fill="url(#vignette)" />
    </svg>
  );
}
