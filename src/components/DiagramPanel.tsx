/**
 * algo.viz — Diagram Panel
 * ==========================
 * Center panel that holds the SceneRenderer SVG.
 */

import { SceneRenderer } from '../renderer/SceneRenderer'
import type { Scene } from '../ir/ir.types'

type DiagramPanelProps = {
  scene: Scene
}

export function DiagramPanel({ scene }: DiagramPanelProps) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px', overflow: 'hidden',
      background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(76,29,149,0.06) 0%, transparent 70%)',
    }}>
      <SceneRenderer scene={scene} />
    </div>
  )
}
