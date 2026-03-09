/**
 * Study AI — Scene Renderer (v2)
 * =================================
 * Dispatches to the correct scene component based on visual template.
 * This is the single entry point for all animation rendering.
 */

import type { AnimationFrame } from '../../templates/types';
import type { VisualTemplate } from '../../router/types';
import { SortingScene } from './SortingScene';
import { TreeScene } from './TreeScene';
import { LinkedListScene } from './LinkedListScene';
import { StackScene } from './StackScene';

type Props = {
  frame: AnimationFrame;
  template: VisualTemplate;
};

export function SceneRenderer({ frame, template }: Props) {
  switch (template) {
    case 'sorting':
      return <SortingScene frame={frame} />;
    case 'tree':
      return <TreeScene frame={frame} />;
    case 'linked_list':
      return <LinkedListScene frame={frame} />;
    case 'stack':
      return <StackScene frame={frame} />;
    default:
      return (
        <div style={{
          padding: 40, textAlign: 'center',
          color: '#565f89', fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
        }}>
          Visual template "{template}" not yet supported
        </div>
      );
  }
}