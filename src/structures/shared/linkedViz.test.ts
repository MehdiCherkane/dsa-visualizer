import { describe, expect, it } from 'vitest'
import {
  HEAP_STACK_X,
  NULL_STUB,
  NODE_H,
  NODE_W,
  contentBounds,
  emptyBounds,
  emptyRingBand,
  isRingNodeFlipped,
  layoutGlobals,
  layoutNodes,
  ringBand,
  ringGeometry,
  routeRingField,
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

describe('anneau partagé des listes circulaires', () => {
  const ringNodes = [
    node(1, 0, { kind: 'node', id: 2 }),
    node(2, 1, { kind: 'node', id: 3 }),
    node(3, 2, { kind: 'node', id: 1 }),
  ]

  it('place les nœuds sur une ellipse sans chevauchement', () => {
    const ring = ringGeometry(ringNodes)!
    const layout = layoutNodes(ringNodes, 'horizontal', 'ring')

    expect(ring.count).toBe(3)
    expect(ring.rx).toBeGreaterThan(0)
    expect(ring.ry).toBeGreaterThan(0)
    for (const candidate of ringNodes) {
      const point = layout.get(candidate.id)!
      const cx = point.x + NODE_W / 2
      const cy = point.y + NODE_H / 2
      const onEllipse =
        ((cx - ring.cx) / ring.rx) ** 2 + ((cy - ring.cy) / ring.ry) ** 2
      expect(onEllipse).toBeCloseTo(1, 6)
    }
    for (let first = 0; first < ringNodes.length; first += 1) {
      for (let second = first + 1; second < ringNodes.length; second += 1) {
        const a = layout.get(ringNodes[first]!.id)!
        const b = layout.get(ringNodes[second]!.id)!
        expect(
          Math.abs(a.x - b.x) >= NODE_W || Math.abs(a.y - b.y) >= NODE_H,
        ).toBe(true)
      }
    }
  })

  it('grandit assez pour huit nœuds', () => {
    const eight = Array.from({ length: 8 }, (_, index) =>
      node(index + 1, index, { kind: 'node', id: ((index + 1) % 8) + 1 }),
    )
    const ring = ringGeometry(eight)!
    const layout = layoutNodes(eight, 'horizontal', 'ring')

    expect(ring.count).toBe(8)
    for (let first = 0; first < eight.length; first += 1) {
      for (let second = first + 1; second < eight.length; second += 1) {
        const a = layout.get(eight[first]!.id)!
        const b = layout.get(eight[second]!.id)!
        expect(
          Math.abs(a.x - b.x) >= NODE_W || Math.abs(a.y - b.y) >= NODE_H,
        ).toBe(true)
      }
    }
  })

  it('bascule le champ suivant sur la moitié gauche ou basse de l’anneau', () => {
    const ring = ringGeometry(ringNodes)!
    const layout = layoutNodes(ringNodes, 'horizontal', 'ring')

    expect(isRingNodeFlipped(layout.get(1)!, ring)).toBe(false)
    expect(isRingNodeFlipped(layout.get(2)!, ring)).toBe(true)
    expect(isRingNodeFlipped(layout.get(3)!, ring)).toBe(true)
  })

  it('trace les liens autour de l’anneau et une boucle pour un nœud unique', () => {
    const ring = ringGeometry(ringNodes)!
    const layout = layoutNodes(ringNodes, 'horizontal', 'ring')
    const route = routeRingField(
      ringNodes[0]!,
      ringNodes[1]!,
      layout.get(1)!,
      layout.get(2)!,
      'suivant',
      ring,
    )

    expect(route.path).toContain('C')
    expect(route.tip.y).toBeGreaterThanOrEqual(layout.get(2)!.y)
    expect(route.tip.y).toBeLessThanOrEqual(layout.get(2)!.y + NODE_H)

    const single = [node(1, 0, { kind: 'node', id: 1 })]
    const singleRing = ringGeometry(single)!
    const singleLayout = layoutNodes(single, 'horizontal', 'ring')
    const loop = routeRingField(
      single[0]!,
      single[0]!,
      singleLayout.get(1)!,
      singleLayout.get(1)!,
      'suivant',
      singleRing,
    )

    expect(loop.path).toContain('C')
    expect(loop.nullStub).toBeUndefined()
    expect(loop.tip.y).toBe(singleLayout.get(1)!.y)
  })

  it('englobe tous les nœuds dans la bande circulaire', () => {
    const ring = ringGeometry(ringNodes)!
    const band = ringBand(ring)
    const layout = layoutNodes(ringNodes, 'horizontal', 'ring')

    for (const candidate of ringNodes) {
      const point = layout.get(candidate.id)!
      expect(point.x).toBeGreaterThanOrEqual(band.rect.x)
      expect(point.y).toBeGreaterThanOrEqual(band.rect.y)
      expect(point.x + NODE_W).toBeLessThanOrEqual(band.rect.x + band.rect.width)
      expect(point.y + NODE_H).toBeLessThanOrEqual(band.rect.y + band.rect.height)
    }
    expect(emptyRingBand().rx).toBeGreaterThan(0)
    expect(emptyRingBand().ry).toBeGreaterThan(0)
  })
})
