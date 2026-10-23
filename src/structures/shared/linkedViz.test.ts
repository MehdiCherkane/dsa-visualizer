import { describe, expect, it } from 'vitest'
import {
  NULL_STUB,
  NODE_H,
  NODE_W,
  contentBounds,
  layoutGlobals,
  layoutNodes,
} from './linkedViz'
import type { VizGlobal, VizNode } from './linkedViz'

function node(id: number, slot: number, pointer: VizNode['pointer']): VizNode {
  return {
    id,
    address: `0x${id}`,
    slot,
    lane: 'row',
    freed: false,
    value: String(id),
    uninit: false,
    pointer,
    pointerUninit: false,
  }
}

const nodes = [node(1, 0, { kind: 'node', id: 2 }), node(2, 1, { kind: 'null' })]
const globals: VizGlobal[] = [
  { name: 'debut', value: { kind: 'node', id: 1 } },
  { name: 'fin', value: { kind: 'node', id: 2 }, placement: 'bottom' },
]

describe('géométrie partagée des listes', () => {
  it('place la cellule fin sous le dernier nœud', () => {
    const layout = layoutNodes(nodes, 'horizontal')
    const cells = layoutGlobals(globals, nodes, layout, 'horizontal')
    const last = layout.get(2)
    const fin = cells.get('fin')

    expect(last).toBeDefined()
    expect(fin?.placement).toBe('bottom')
    expect(fin!.rect.x).toBeGreaterThan(last!.x)
    expect(fin!.rect.y).toBeGreaterThan(last!.y + NODE_H)
  })

  it('garde la queue NULL et la cellule fin dans le cadrage', () => {
    const layout = layoutNodes(nodes, 'horizontal')
    const last = layout.get(2)!
    const bounds = contentBounds(nodes, globals, [], 'horizontal')

    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(last.x + NODE_W + NULL_STUB + 60)
    expect(bounds.y + bounds.height).toBeGreaterThan(last.y + NODE_H + 100)
  })
})
