import { describe, expect, it } from 'vitest'
import {
  HEAP_STACK_X,
  NULL_STUB,
  NODE_H,
  NODE_W,
  contentBounds,
  emptyBounds,
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

function heapNode(id: number, slot: number, pointer: VizNode['pointer']): VizNode {
  return { ...node(id, slot, pointer), lane: 'heap' }
}

const nodes = [node(1, 0, { kind: 'node', id: 2 }), node(2, 1, { kind: 'null' })]
const globals: VizGlobal[] = [
  { name: 'debut', value: { kind: 'node', id: 1 }, placement: 'top' },
  { name: 'fin', value: { kind: 'node', id: 2 }, placement: 'bottom' },
]

describe('géométrie partagée des listes', () => {
  it('place debut au-dessus du premier nœud et fin sous le dernier', () => {
    const layout = layoutNodes(nodes, 'horizontal')
    const cells = layoutGlobals(globals, nodes, layout, 'horizontal')
    const first = layout.get(1)
    const last = layout.get(2)
    const debut = cells.get('debut')
    const fin = cells.get('fin')

    expect(first).toBeDefined()
    expect(last).toBeDefined()
    expect(debut?.placement).toBe('top')
    expect(debut!.rect.y).toBeLessThan(first!.y)
    expect(debut!.rect.x).toBeLessThan(first!.x)
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

  it('centre sommet dans le cadre compact quand la pile est vide', () => {
    const emptyGlobals: VizGlobal[] = [
      { name: 'sommet', value: { kind: 'null' }, placement: 'top' },
    ]
    const layout = layoutNodes([], 'vertical')
    const cells = layoutGlobals(emptyGlobals, [], layout, 'vertical')
    const sommet = cells.get('sommet')
    const bounds = emptyBounds('vertical')

    expect(sommet?.placement).toBe('top')
    expect(sommet!.rect.x).toBeGreaterThan(bounds.x)
    expect(sommet!.rect.y).toBeGreaterThan(bounds.y)
    expect(sommet!.rect.y + sommet!.rect.height).toBeLessThan(bounds.y + bounds.height)
  })

  it('place les nœuds de pile dans le TAS et le pointeur sommet dans PILE', () => {
    const heapNodes = [
      heapNode(1, 0, { kind: 'node', id: 2 }),
      heapNode(2, 1, { kind: 'null' }),
    ]
    const layout = layoutNodes(heapNodes, 'vertical')
    const pileGlobals: VizGlobal[] = [
      { name: 'sommet', value: { kind: 'node', id: 1 }, placement: 'row' },
    ]
    const cells = layoutGlobals(pileGlobals, heapNodes, layout, 'vertical')
    const sommet = cells.get('sommet')

    expect(layout.get(1)?.x).toBe(HEAP_STACK_X)
    expect(layout.get(2)?.x).toBe(HEAP_STACK_X)
    expect(layout.get(1)!.y).toBeLessThan(layout.get(2)!.y)
    expect(sommet?.placement).toBe('row')
    expect(sommet!.rect.x).toBeLessThan(HEAP_STACK_X)
    expect(sommet!.rect.y).toBeLessThan(layout.get(1)!.y)
  })

  it('accroche un global supérieur au premier nœud même sans nœud de ligne', () => {
    const heapNodes = [heapNode(1, 0, { kind: 'null' })]
    const layout = layoutNodes(heapNodes, 'vertical')
    const topGlobals: VizGlobal[] = [
      { name: 'sommet', value: { kind: 'node', id: 1 }, placement: 'top' },
    ]
    const cells = layoutGlobals(topGlobals, heapNodes, layout, 'vertical')
    const sommet = cells.get('sommet')

    expect(sommet?.placement).toBe('top')
    expect(sommet!.rect.x).toBeGreaterThanOrEqual(HEAP_STACK_X)
    expect(sommet!.rect.y).toBeLessThan(layout.get(1)!.y)
  })
})
