import { describe, expect, it } from 'vitest'
import {
  HEAP_STACK_X,
  NULL_STUB,
  NODE_H,
  NODE_W,
  STACK_SLIDE,
  STACK_TOP,
  contentBounds,
  emptyBounds,
  layoutGlobals,
  layoutNodes,
  layoutPins,
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
  { name: 'debut', value: { kind: 'node', id: 1 }, placement: 'top-center' },
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
    expect(debut?.placement).toBe('top-center')
    expect(debut!.rect.y + debut!.rect.height).toBeLessThan(first!.y)
    expect(debut!.rect.x + debut!.rect.width / 2).toBeCloseTo(first!.x + NODE_W / 2)
    expect(fin?.placement).toBe('bottom')
    expect(fin!.rect.x + fin!.rect.width / 2).toBeCloseTo(last!.x + NODE_W / 2)
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

  it('place un nouveau sommet dans un slot négatif au-dessus de la pile', () => {
    const heapNodes = [
      heapNode(1, -1, { kind: 'node', id: 2 }),
      heapNode(2, 0, { kind: 'null' }),
    ]
    const layout = layoutNodes(heapNodes, 'vertical')

    expect(layout.get(1)!.y).toBe(STACK_TOP - STACK_SLIDE)
    expect(layout.get(2)!.y).toBe(STACK_TOP)
    expect(layout.get(1)!.y).toBeLessThan(layout.get(2)!.y)
  })

  it('sépare debut et fin quand la file est vide', () => {
    const emptyGlobals: VizGlobal[] = [
      { name: 'debut', value: { kind: 'null' }, placement: 'top-center' },
      { name: 'fin', value: { kind: 'null' }, placement: 'bottom' },
    ]
    const cells = layoutGlobals(emptyGlobals, [], new Map(), 'horizontal')
    const debut = cells.get('debut')
    const fin = cells.get('fin')

    expect(debut?.placement).toBe('top-center')
    expect(fin?.placement).toBe('top')
    expect(fin!.rect.x).toBeGreaterThan(debut!.rect.x + debut!.rect.width)
    expect(fin!.rect.y).toBe(debut!.rect.y)
  })

  it('suit le nœud ciblé par debut et fin', () => {
    const layout = layoutNodes(nodes, 'horizontal')
    const target = layout.get(2)!
    const cells = layoutGlobals(
      [
        { name: 'debut', value: { kind: 'node', id: 2 }, placement: 'top-center' },
        { name: 'fin', value: { kind: 'node', id: 2 }, placement: 'bottom' },
      ],
      nodes,
      layout,
      'horizontal',
    )

    expect(cells.get('debut')!.rect.x + cells.get('debut')!.rect.width / 2).toBeCloseTo(
      target.x + NODE_W / 2,
    )
    expect(cells.get('fin')!.rect.x + cells.get('fin')!.rect.width / 2).toBeCloseTo(
      target.x + NODE_W / 2,
    )
  })

  it('écarte les étiquettes de file à gauche et à droite des nœuds', () => {
    const layout = layoutNodes(nodes, 'horizontal')
    const placements = layoutPins(
      [
        { name: 'ancienDebut', value: { kind: 'node', id: 1 } },
        { name: 'nouveau', value: { kind: 'node', id: 2 } },
      ],
      nodes,
      layout,
      'horizontal',
      'right',
    )
    const oldTag = placements.find((placement) => placement.pin.name === 'ancienDebut')!
    const newTag = placements.find((placement) => placement.pin.name === 'nouveau')!

    expect(oldTag.tag.x + oldTag.tag.width).toBeLessThanOrEqual(layout.get(1)!.x)
    expect(newTag.tag.x).toBeGreaterThan(layout.get(2)!.x + NODE_W)
  })

  it('peut cadrer uniquement le contenu visible', () => {
    const heapNodes = [heapNode(1, -2, { kind: 'null' })]
    const withEmpty = contentBounds(heapNodes, [], [], 'vertical')
    const withoutEmpty = contentBounds(heapNodes, [], [], 'vertical', 'center', false)

    expect(withoutEmpty.height).toBeLessThan(withEmpty.height)
  })
})
