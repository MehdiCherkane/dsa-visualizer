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
  emptyRingBand,
  isRingNodeFlipped,
  layoutGlobals,
  layoutNodes,
  layoutPins,
  ringBand,
  ringGeometry,
  routeRingField,
} from './linkedViz'
import type { Point, Rect, VizGlobal, VizNode } from './linkedViz'

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

function samplePath(path: string, perSegment = 24): Point[] {
  const tokens = path.match(/[MLQ]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []
  const points: Point[] = []
  let index = 0
  let cursor: Point = { x: 0, y: 0 }
  const number = (): number => Number(tokens[index++])
  while (index < tokens.length) {
    const command = tokens[index++]!
    if (command === 'M') {
      cursor = { x: number(), y: number() }
      points.push(cursor)
      continue
    }
    if (command === 'L') {
      const start = cursor
      const end = { x: number(), y: number() }
      for (let step = 1; step <= perSegment; step += 1) {
        const t = step / perSegment
        points.push({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        })
      }
      cursor = end
      continue
    }
    if (command === 'Q') {
      const control = { x: number(), y: number() }
      const end = { x: number(), y: number() }
      for (let step = 1; step <= perSegment; step += 1) {
        const t = step / perSegment
        const u = 1 - t
        points.push({
          x: u * u * cursor.x + 2 * u * t * control.x + t * t * end.x,
          y: u * u * cursor.y + 2 * u * t * control.y + t * t * end.y,
        })
      }
      cursor = end
      continue
    }
  }
  return points
}

function cardOf(point: Point): Rect {
  return { x: point.x, y: point.y, width: NODE_W, height: NODE_H }
}

function onBorder(point: Point, rect: Rect, epsilon = 0.75): boolean {
  const insideX =
    point.x >= rect.x - epsilon && point.x <= rect.x + rect.width + epsilon
  const insideY =
    point.y >= rect.y - epsilon && point.y <= rect.y + rect.height + epsilon
  const onVertical =
    Math.abs(point.x - rect.x) <= epsilon ||
    Math.abs(point.x - (rect.x + rect.width)) <= epsilon
  const onHorizontal =
    Math.abs(point.y - rect.y) <= epsilon ||
    Math.abs(point.y - (rect.y + rect.height)) <= epsilon
  return insideX && insideY && (onVertical || onHorizontal)
}

function pathLength(path: string): number {
  const points = samplePath(path)
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(
      points[index]!.x - points[index - 1]!.x,
      points[index]!.y - points[index - 1]!.y,
    )
  }
  return total
}

function ringNodesOf(count: number): VizNode[] {
  return Array.from({ length: count }, (_, index) =>
    node(index + 1, index, { kind: 'node', id: ((index + 1) % count) + 1 }),
  )
}

function crossesCard(points: Point[], rect: Rect): boolean {
  const inset = 0.5
  const left = rect.x + inset
  const right = rect.x + rect.width - inset
  const top = rect.y + inset
  const bottom = rect.y + rect.height - inset
  return points.some(
    (point) =>
      point.x > left && point.x < right && point.y > top && point.y < bottom,
  )
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
    const withoutEmpty = contentBounds(heapNodes, [], [], 'vertical', null, 'center', false)

    expect(withoutEmpty.height).toBeLessThan(withEmpty.height)
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

  it('bascule le champ suivant vers le successeur ou vers l’extérieur', () => {
    const ring = ringGeometry(ringNodes)!
    const layout = layoutNodes(ringNodes, 'horizontal', 'ring')

    expect(
      isRingNodeFlipped(layout.get(1)!, ring, layout.get(2)!),
    ).toBe(false)
    expect(
      isRingNodeFlipped(layout.get(2)!, ring, layout.get(3)!),
    ).toBe(true)
    expect(
      isRingNodeFlipped(layout.get(3)!, ring, layout.get(1)!),
    ).toBe(true)
  })

  it('garde les motifs de bascule attendus de deux à huit nœuds', () => {
    const expected: Record<number, string> = {
      2: 'RL',
      3: 'RLL',
      4: 'RRLL',
      5: 'RLLLR',
      6: 'RRLLLR',
      7: 'RRLLLRR',
      8: 'RRRLLLLR',
    }
    for (const [count, pattern] of Object.entries(expected)) {
      const ringNodes = ringNodesOf(Number(count))
      const ring = ringGeometry(ringNodes)!
      const layout = layoutNodes(ringNodes, 'horizontal', 'ring')
      const flips = ringNodes.map((source, index) => {
        const target = ringNodes[(index + 1) % ringNodes.length]!
        return isRingNodeFlipped(
          layout.get(source.id)!,
          ring,
          layout.get(target.id)!,
        )
      })
      expect(
        flips.map((flip) => (flip ? 'L' : 'R')).join(''),
        `${count} nœuds`,
      ).toBe(pattern)
    }
  })

  it('boucle un nœud unique à l’extérieur de sa carte', () => {
    const single = [node(1, 0, { kind: 'node', id: 1 })]
    const ring = ringGeometry(single)!
    const layout = layoutNodes(single, 'horizontal', 'ring')
    const point = layout.get(1)!
    const route = routeRingField(
      single[0]!,
      single[0]!,
      point,
      point,
      'suivant',
      ring,
    )

    expect(route.path).not.toContain('C')
    expect(route.path).toContain('Q')
    expect(route.nullStub).toBeUndefined()
    expect(onBorder(route.tip, cardOf(point))).toBe(true)
    const points = samplePath(route.path)
    const rect = cardOf(point)
    expect(Math.max(...points.map((candidate) => candidate.x))).toBeGreaterThan(
      rect.x + rect.width,
    )
    expect(Math.min(...points.map((candidate) => candidate.y))).toBeLessThan(
      rect.y,
    )
    let hasLeft = false
    for (const candidate of points) {
      const inside =
        candidate.x > rect.x + 1 &&
        candidate.x < rect.x + rect.width - 1 &&
        candidate.y > rect.y + 1 &&
        candidate.y < rect.y + rect.height - 1
      if (!inside) hasLeft = true
      expect(hasLeft && inside).toBe(false)
    }
  })

  it('dessine deux arcs extérieurs opposés pour deux nœuds', () => {
    const two = ringNodesOf(2)
    const ring = ringGeometry(two)!
    const layout = layoutNodes(two, 'horizontal', 'ring')
    const routes = two.map((source, index) => {
      const target = two[(index + 1) % two.length]!
      const sourcePoint = layout.get(source.id)!
      const targetPoint = layout.get(target.id)!
      return routeRingField(
        source,
        target,
        sourcePoint,
        targetPoint,
        'suivant',
        ring,
        isRingNodeFlipped(sourcePoint, ring, targetPoint),
      )
    })

    expect(routes[0]!.path).toContain('Q')
    expect(routes[1]!.path).toContain('Q')
    expect(routes[0]!.tip.x).toBeCloseTo(layout.get(2)!.x + NODE_W, 6)
    expect(routes[1]!.tip.x).toBeCloseTo(layout.get(1)!.x, 6)
    expect(routes[0]!.tip.x).toBeGreaterThan(routes[1]!.tip.x)
    const top = cardOf(layout.get(1)!)
    const bottom = cardOf(layout.get(2)!)
    expect(crossesCard(samplePath(routes[0]!.path), bottom)).toBe(false)
    expect(crossesCard(samplePath(routes[1]!.path), top)).toBe(false)
    // Nothing runs through the vertical gap between the two cards.
    const gapTop = top.y + top.height
    const gapBottom = bottom.y
    for (const route of routes) {
      for (const candidate of samplePath(route.path)) {
        const inGap = candidate.y > gapTop && candidate.y < gapBottom
        const insideColumns =
          candidate.x > top.x && candidate.x < top.x + top.width
        expect(inGap && insideColumns).toBe(false)
      }
    }
  })

  it('relie les deux nœuds du bas du triangle par un tracé court', () => {
    const three = ringNodesOf(3)
    const ring = ringGeometry(three)!
    const layout = layoutNodes(three, 'horizontal', 'ring')
    const source = three[1]!
    const target = three[2]!
    const sourcePoint = layout.get(source.id)!
    const targetPoint = layout.get(target.id)!
    const route = routeRingField(
      source,
      target,
      sourcePoint,
      targetPoint,
      'suivant',
      ring,
      isRingNodeFlipped(sourcePoint, ring, targetPoint),
    )

    expect(route.path).not.toContain('Q')
    expect(route.path).not.toContain('C')
    expect(route.tip.x).toBeCloseTo(targetPoint.x + NODE_W, 6)
    expect(route.tip.y).toBeCloseTo(targetPoint.y + NODE_H / 2, 6)
    expect(pathLength(route.path)).toBeLessThan(320)
    expect(
      crossesCard(samplePath(route.path), cardOf(layout.get(1)!)),
    ).toBe(false)
  })

  it('contourne le triangle par l’extérieur et ferme par un arc', () => {
    const three = ringNodesOf(3)
    const ring = ringGeometry(three)!
    const layout = layoutNodes(three, 'horizontal', 'ring')
    const debut = layoutGlobals(
      [{ name: 'debut', value: { kind: 'node', id: 1 }, placement: 'top' }],
      three,
      layout,
      'horizontal',
      ring,
    ).get('debut')!

    const routes = three.map((source, index) => {
      const target = three[(index + 1) % three.length]!
      const sourcePoint = layout.get(source.id)!
      const targetPoint = layout.get(target.id)!
      return routeRingField(
        source,
        target,
        sourcePoint,
        targetPoint,
        'suivant',
        ring,
        isRingNodeFlipped(sourcePoint, ring, targetPoint),
      )
    })

    expect(routes[0]!.path).toContain('Q')
    expect(routes[1]!.path).not.toContain('Q')
    expect(routes[2]!.path).toContain('Q')
    expect(routes[0]!.tip.x).toBeCloseTo(layout.get(2)!.x + NODE_W, 6)
    expect(routes[2]!.tip.x).toBeCloseTo(layout.get(1)!.x, 6)
    expect(crossesCard(samplePath(routes[0]!.path), debut.rect)).toBe(false)
    // The closing arc goes around the left side of the triangle.
    const closing = samplePath(routes[2]!.path)
    expect(Math.min(...closing.map((candidate) => candidate.x))).toBeLessThan(
      layout.get(3)!.x,
    )
    for (const [index, route] of routes.entries()) {
      const target = three[(index + 1) % three.length]!
      for (const [otherIndex, other] of three.entries()) {
        if (
          otherIndex === index ||
          otherIndex === (index + 1) % three.length
        ) {
          continue
        }
        expect(
          crossesCard(samplePath(route.path), cardOf(layout.get(other.id)!)),
        ).toBe(false)
      }
      expect(onBorder(route.tip, cardOf(layout.get(target.id)!))).toBe(true)
    }
  })

  it('forme un rectangle de quatre côtés droits pour quatre nœuds', () => {
    const four = ringNodesOf(4)
    const ring = ringGeometry(four)!
    const layout = layoutNodes(four, 'horizontal', 'ring')
    const routes = four.map((source, index) => {
      const target = four[(index + 1) % four.length]!
      const sourcePoint = layout.get(source.id)!
      const targetPoint = layout.get(target.id)!
      return routeRingField(
        source,
        target,
        sourcePoint,
        targetPoint,
        'suivant',
        ring,
        isRingNodeFlipped(sourcePoint, ring, targetPoint),
      )
    })

    for (const [index, route] of routes.entries()) {
      const target = four[(index + 1) % four.length]!
      expect(route.path).not.toContain('Q')
      expect(route.path).not.toContain('C')
      const axisAligned =
        Math.abs(route.tail.x - route.tip.x) < 1e-6 ||
        Math.abs(route.tail.y - route.tip.y) < 1e-6
      expect(axisAligned).toBe(true)
      expect(onBorder(route.tip, cardOf(layout.get(target.id)!))).toBe(true)
      for (const [otherIndex, other] of four.entries()) {
        if (
          otherIndex === index ||
          otherIndex === (index + 1) % four.length
        ) {
          continue
        }
        expect(
          crossesCard(samplePath(route.path), cardOf(layout.get(other.id)!)),
        ).toBe(false)
      }
    }
    // The closing link is the fourth side, not a wrap-around arc.
    expect(routes[3]!.tip.x).toBeCloseTo(routes[3]!.tail.x, 6)
    expect(routes[3]!.tip.y).toBeCloseTo(layout.get(1)!.y + NODE_H, 6)
  })

  it('relie cinq à huit nœuds par des segments droits', () => {
    for (const count of [5, 6, 7, 8]) {
      const ringNodes = ringNodesOf(count)
      const ring = ringGeometry(ringNodes)!
      const layout = layoutNodes(ringNodes, 'horizontal', 'ring')
      for (let index = 0; index < count; index += 1) {
        const source = ringNodes[index]!
        const target = ringNodes[(index + 1) % count]!
        const sourcePoint = layout.get(source.id)!
        const targetPoint = layout.get(target.id)!
        const route = routeRingField(
          source,
          target,
          sourcePoint,
          targetPoint,
          'suivant',
          ring,
          isRingNodeFlipped(sourcePoint, ring, targetPoint),
        )
        expect(route.path).not.toContain('Q')
        expect(route.path).not.toContain('C')
        expect(onBorder(route.tip, cardOf(targetPoint))).toBe(true)
        for (let other = 0; other < count; other += 1) {
          if (other === index || other === (index + 1) % count) continue
          expect(
            crossesCard(
              samplePath(route.path),
              cardOf(layout.get(ringNodes[other]!.id)!),
            ),
          ).toBe(false)
        }
      }
    }
  })

  it('place chaque pointe sur la bordure de la cible pour zéro à huit nœuds', () => {
    expect(ringGeometry([])).toBeNull()
    for (const count of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const ringNodes = ringNodesOf(count)
      const ring = ringGeometry(ringNodes)!
      const layout = layoutNodes(ringNodes, 'horizontal', 'ring')
      for (let index = 0; index < count; index += 1) {
        const source = ringNodes[index]!
        const target = ringNodes[(index + 1) % count]!
        const sourcePoint = layout.get(source.id)!
        const targetPoint = layout.get(target.id)!
        const route = routeRingField(
          source,
          target,
          sourcePoint,
          targetPoint,
          'suivant',
          ring,
          isRingNodeFlipped(sourcePoint, ring, targetPoint),
        )
        expect(onBorder(route.tip, cardOf(targetPoint))).toBe(true)
        const points = samplePath(route.path)
        for (let other = 0; other < count; other += 1) {
          if (other === index || other === (index + 1) % count) continue
          expect(
            crossesCard(
              points,
              cardOf(layout.get(ringNodes[other]!.id)!),
            ),
          ).toBe(false)
        }
      }
    }
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

  it('réserve la place des arcs extérieurs dans le cadrage', () => {
    const ring = ringGeometry(ringNodes)!
    const band = ringBand(ring)
    const bounds = contentBounds(ringNodes, globals, [], 'horizontal', ring)
    const routePad = 60

    expect(bounds.width).toBeGreaterThanOrEqual(band.rect.width + routePad * 2)
    expect(bounds.height).toBeGreaterThanOrEqual(band.rect.height + routePad * 2)
  })
})
