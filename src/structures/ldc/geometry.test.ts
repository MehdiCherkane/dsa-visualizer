import { describe, expect, it } from 'vitest'
import type { Camera, Point, Rect } from './geometry'
import {
  CELL_W,
  CIRCLE_CX,
  CIRCLE_CY,
  CIRCLE_MIN_RADIUS,
  DEBUT_CELL_GAP,
  DEBUT_CELL_H,
  DEBUT_CELL_W,
  NODE_H,
  NODE_W,
  NULL_STUB,
  PIN_DEBUT_CLEARANCE,
  PIN_NULL_STUB,
  PRECEDENT_LANE,
  ROW_Y,
  SUIVANT_LANE,
  cameraAtOne,
  circleGeometry,
  debutCellGeometry,
  debutRoute,
  fitCamera,
  isNodeFlipped,
  layoutNodes,
  layoutPins,
  pointerAnchor,
  pointerSide,
  routeArrow,
  screenPoint,
  snapshotBounds,
  unionBounds,
  worldPoint,
  zoomAtCursor,
} from './geometry'
import { createSnapshot } from './memory'
import { runInsererEnTete } from './ops/intOps'
import { createCircularSnapshot } from '../lddc/memory'

function center(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x - 0.001 &&
    inner.y >= outer.y - 0.001 &&
    inner.x + inner.width <= outer.x + outer.width + 0.001 &&
    inner.y + inner.height <= outer.y + outer.height + 0.001
  )
}

describe('caméra et géométrie du canvas', () => {
  it('garde le point du monde sous le curseur pendant le zoom', () => {
    const camera: Camera = { x: 120, y: -40, k: 0.8 }
    const cursors: Point[] = [
      { x: 0, y: 0 },
      { x: 250, y: 180 },
      { x: 800, y: 500 },
    ]
    const factors = [1.12, 0.9, 1.5]

    for (const cursor of cursors) {
      for (const factor of factors) {
        const before = worldPoint(camera, cursor)
        const zoomed = zoomAtCursor(camera, cursor, factor)
        const after = worldPoint(zoomed, cursor)
        expect(Math.abs(after.x - before.x)).toBeLessThan(0.5)
        expect(Math.abs(after.y - before.y)).toBeLessThan(0.5)
      }
    }
  })

  it('respecte les bornes de zoom manuel', () => {
    const camera: Camera = { x: 40, y: 30, k: 1 }
    const cursor = { x: 300, y: 220 }
    expect(zoomAtCursor(camera, cursor, 100).k).toBe(4)
    expect(zoomAtCursor(camera, cursor, 0.0001).k).toBe(0.25)

    const high = zoomAtCursor({ ...camera, k: 3.9 }, cursor, 2)
    const before = worldPoint({ ...camera, k: 3.9 }, cursor)
    const after = worldPoint(high, cursor)
    expect(high.k).toBe(4)
    expect(after.x).toBeCloseTo(before.x, 6)
    expect(after.y).toBeCloseTo(before.y, 6)
  })

  it('centre la bbox dans le canvas pour 0, 1, 3 et 8 nœuds', () => {
    const size = { width: 1200, height: 800 }
    for (const count of [0, 1, 3, 8]) {
      const snapshot = createSnapshot(
        'int',
        Array.from({ length: count }, (_, index) => ({ kind: 'int' as const, value: index + 1 })),
      )
      const bbox = snapshotBounds(snapshot.nodes)
      const camera = fitCamera(bbox, size)
      const projected = screenPoint(camera, center(bbox))
      expect(Math.abs(projected.x - size.width / 2)).toBeLessThan(1)
      expect(Math.abs(projected.y - size.height / 2)).toBeLessThan(1)
      expect(camera.k).toBeGreaterThanOrEqual(0.25)
      expect(camera.k).toBeLessThanOrEqual(1.3)
    }
  })

  it('ajuste huit nœuds dans le canvas de 1280 px sans les rogner', () => {
    const snapshot = createSnapshot(
      'int',
      Array.from({ length: 8 }, (_, index) => ({ kind: 'int' as const, value: index + 1 })),
    )
    const bbox = snapshotBounds(snapshot.nodes)
    const size = { width: 738, height: 313 }
    const camera = fitCamera(bbox, size)
    expect(camera.k).toBeLessThan(0.4)
    expect(bbox.width * camera.k).toBeLessThanOrEqual(size.width)
  })

  it('donne un zoom de 100 % centré sur la bbox', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }])
    const bbox = snapshotBounds(snapshot.nodes)
    const size = { width: 900, height: 600 }
    const camera = cameraAtOne(bbox, size)
    expect(camera.k).toBe(1)
    const projected = screenPoint(camera, center(bbox))
    expect(projected.x).toBeCloseTo(size.width / 2, 6)
    expect(projected.y).toBeCloseTo(size.height / 2, 6)
  })

  it('contient chaque bbox d’étape dans l’union de l’opération', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }, { kind: 'int', value: 2 }, { kind: 'int', value: 5 }])
    const steps = runInsererEnTete(snapshot, { valeur: 7 })
    const boxes = steps.map((step) => snapshotBounds(step.snapshot.nodes))
    const union = unionBounds(boxes)
    for (const box of boxes) expect(contains(union, box)).toBe(true)
    expect(steps.some((step) => step.snapshot.nodes.some((node) => node.lane === 'heap'))).toBe(true)
  })

  it('pose les flèches adjacentes sur la bordure et à la hauteur du point', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }, { kind: 'int', value: 2 }, { kind: 'int', value: 5 }])
    const [first, second] = snapshot.nodes
    if (!first || !second) throw new Error('missing nodes')
    const layout = layoutNodes(snapshot.nodes)
    const firstPoint = layout.get(first.id)!
    const secondPoint = layout.get(second.id)!

    const next = routeArrow(first, 'suivant', second, layout)
    expect(next).not.toBeNull()
    expect(Math.abs(next!.tip.x - secondPoint.x)).toBeLessThan(1)
    expect(Math.abs(next!.tip.y - (firstPoint.y + 100 * 0.38))).toBeLessThan(1)

    const previous = routeArrow(second, 'precedent', first, layout)
    expect(previous).not.toBeNull()
    expect(Math.abs(previous!.tip.x - (firstPoint.x + 220))).toBeLessThan(1)
    expect(Math.abs(previous!.tip.y - (secondPoint.y + 100 * 0.72))).toBeLessThan(1)
  })

  it('contourne les nœuds intermédiaires pour un pointeur non adjacent', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }, { kind: 'int', value: 2 }, { kind: 'int', value: 5 }])
    const [first, , third] = snapshot.nodes
    if (!first || !third) throw new Error('missing nodes')
    const layout = layoutNodes(snapshot.nodes)
    const thirdPoint = layout.get(third.id)!

    const next = routeArrow(first, 'suivant', third, layout)
    expect(next).not.toBeNull()
    expect(next!.path).toContain(' C ')
    expect(Math.abs(next!.tip.x - thirdPoint.x)).toBeLessThan(1)
    expect(Math.abs(next!.tip.y - (thirdPoint.y + 100 * 0.38))).toBeLessThan(1)
  })

  it('fait partir le stub NULL de la hauteur du point', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }, { kind: 'int', value: 2 }, { kind: 'int', value: 5 }])
    const first = snapshot.nodes[0]!
    const layout = layoutNodes(snapshot.nodes)
    const point = layout.get(first.id)!
    const stub = routeArrow(first, 'precedent', null, layout)
    expect(stub).not.toBeNull()
    expect(stub!.kind).toBe('null')
    expect(stub!.tail.y).toBeCloseTo(point.y + 100 * 0.72, 6)
    expect(stub!.tip.y).toBeCloseTo(stub!.tail.y, 6)
    expect(Math.abs(stub!.tip.x - (stub!.tail.x - NULL_STUB))).toBeLessThan(1)
  })

  it('place la cellule debut au-dessus de la première case de la rangée', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }])
    const first = snapshot.nodes[0]!
    const firstPoint = layoutNodes(snapshot.nodes).get(first.id)!
    const geometry = debutCellGeometry(snapshot.nodes)
    expect(geometry.cell.width).toBe(DEBUT_CELL_W)
    expect(geometry.cell.height).toBe(DEBUT_CELL_H)
    expect(geometry.cell.y).toBe(firstPoint.y - DEBUT_CELL_GAP - DEBUT_CELL_H)
    expect(geometry.dot.x).toBe(firstPoint.x + 220 / 2)
    expect(geometry.dot.y).toBe(firstPoint.y - DEBUT_CELL_GAP)
  })

  it('garde la cellule debut sur la rangée pendant une allocation sans nœud de rangée', () => {
    const steps = runInsererEnTete(createSnapshot('int', []), { valeur: 7 })
    const heapOnly = steps
      .map((step) => step.snapshot.nodes)
      .find(
        (nodes) =>
          nodes.some((node) => node.lane === 'heap') &&
          !nodes.some((node) => node.lane === 'row'),
      )
    if (!heapOnly) throw new Error('missing heap-only step')
    const geometry = debutCellGeometry(heapOnly)
    expect(geometry.cell.y).toBeCloseTo(ROW_Y - DEBUT_CELL_GAP - DEBUT_CELL_H, 6)
  })

  it('trace la flèche debut verticalement vers le premier nœud', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }, { kind: 'int', value: 2 }])
    const first = snapshot.nodes[0]!
    const firstPoint = layoutNodes(snapshot.nodes).get(first.id)!
    const geometry = debutCellGeometry(snapshot.nodes)
    const route = debutRoute(snapshot.nodes, { kind: 'node', id: first.id })
    expect(route).not.toBeNull()
    expect(route!.kind).toBe('straight')
    expect(route!.tail.x).toBeCloseTo(geometry.dot.x, 6)
    expect(route!.tail.y).toBeCloseTo(geometry.dot.y, 6)
    expect(route!.tip.x).toBeCloseTo(geometry.dot.x, 6)
    expect(route!.tip.y).toBeCloseTo(firstPoint.y, 6)
  })

  it('trace le stub NULL verticalement sous la pastille et inclut la cellule dans la bbox', () => {
    const snapshot = createSnapshot('int', [])
    const geometry = debutCellGeometry(snapshot.nodes)
    const route = debutRoute(snapshot.nodes, { kind: 'null' })
    expect(route).not.toBeNull()
    expect(route!.kind).toBe('null')
    expect(route!.tail.x).toBeCloseTo(geometry.dot.x, 6)
    expect(route!.tail.y).toBeCloseTo(geometry.dot.y, 6)
    expect(route!.tip.x).toBeCloseTo(geometry.dot.x, 6)
    expect(route!.tip.y).toBeCloseTo(geometry.dot.y + NULL_STUB, 6)
    expect(route!.stub?.direction).toBe('down')
    const bounds = snapshotBounds(snapshot.nodes, [], { kind: 'null' })
    expect(contains(bounds, geometry.cell)).toBe(true)
    expect(contains(bounds, route!.bounds)).toBe(true)
  })

  it('garde les pastilles de nœud séparées de la cellule debut', () => {
    const snapshot = createSnapshot('int', [{ kind: 'int', value: 9 }])
    const first = snapshot.nodes[0]!
    const geometry = debutCellGeometry(snapshot.nodes)
    const [placement] = layoutPins(
      [{ name: 'courant', text: 'courant', target: 'node', targetId: first.id }],
      snapshot.nodes,
    )
    expect(placement).toBeDefined()
    expect(placement!.tag.y - (geometry.cell.y + geometry.cell.height)).toBeGreaterThanOrEqual(20)
    expect(placement!.tag.x).toBeGreaterThanOrEqual(geometry.dot.x + PIN_DEBUT_CLEARANCE)
  })

  it('rend un pointeur local NULL vertical et détaché de la liste', () => {
    const snapshot = createSnapshot('int', [
      { kind: 'int', value: 9 },
      { kind: 'int', value: 2 },
      { kind: 'int', value: 5 },
    ])
    const pin = { name: 'dernier', text: 'dernier', target: 'null' as const }
    const [placement] = layoutPins([pin], snapshot.nodes)
    expect(placement).toBeDefined()
    const stub = placement!.nullStub
    expect(stub).toBeDefined()
    expect(stub!.direction).toBe('down')
    expect(stub!.start.x).toBeCloseTo(stub!.end.x, 6)
    expect(stub!.end.y - stub!.start.y).toBeCloseTo(PIN_NULL_STUB, 6)
    expect(stub!.bounds.y + stub!.bounds.height).toBeLessThan(ROW_Y)
    const bounds = snapshotBounds(snapshot.nodes, [pin], { kind: 'null' })
    expect(contains(bounds, stub!.bounds)).toBe(true)
  })
})

describe('géométrie circulaire du chapitre 5', () => {
  const circular = () =>
    createCircularSnapshot(
      'int',
      [9, 2, 5, 7].map((value) => ({ kind: 'int' as const, value })),
    )

  it('répartit les nœuds sur un anneau sans toucher au mode ligne', () => {
    const snapshot = circular()
    const ring = circleGeometry(snapshot.nodes)
    expect(ring).not.toBeNull()
    expect(ring!.cx).toBe(CIRCLE_CX)
    expect(ring!.cy).toBe(CIRCLE_CY)

    const layout = layoutNodes(snapshot.nodes, 'circle')
    for (const node of snapshot.nodes) {
      const point = layout.get(node.id)!
      const nodeCenter = { x: point.x + 110, y: point.y + 50 }
      expect(
        Math.hypot(nodeCenter.x - ring!.cx, nodeCenter.y - ring!.cy),
      ).toBeCloseTo(ring!.radius, 6)
    }

    const first = snapshot.nodes[0]!
    const firstPoint = layout.get(first.id)!
    expect(firstPoint.x + 110).toBeCloseTo(CIRCLE_CX, 6)
    expect(firstPoint.y + 50).toBeLessThan(CIRCLE_CY)

    const rowPoint = layoutNodes(snapshot.nodes).get(first.id)!
    expect(rowPoint.y).toBe(ROW_Y)
    expect(rowPoint.x).not.toBe(firstPoint.x)
  })

  it('route suivant à l’extérieur et precedent à l’intérieur du cercle', () => {
    const snapshot = circular()
    const [first, second, , fourth] = snapshot.nodes
    if (!first || !second || !fourth) throw new Error('missing nodes')
    const layout = layoutNodes(snapshot.nodes, 'circle')
    const ring = circleGeometry(snapshot.nodes)!
    const distance = (point: Point): number =>
      Math.hypot(point.x - ring.cx, point.y - ring.cy)

    const next = routeArrow(first, 'suivant', second, layout, 'circle', snapshot.nodes)
    const previous = routeArrow(first, 'precedent', fourth, layout, 'circle', snapshot.nodes)
    expect(next).not.toBeNull()
    expect(previous).not.toBeNull()
    expect(next!.kind).toBe('curve')
    expect(previous!.kind).toBe('curve')
    expect(distance(next!.tail)).toBeGreaterThan(ring.radius)
    expect(distance(previous!.tail)).toBeLessThan(ring.radius)
  })

  it('agrandit l’anneau à partir de trois nœuds', () => {
    const three = createCircularSnapshot(
      'int',
      [9, 2, 5].map((value) => ({ kind: 'int' as const, value })),
    )
    const ring = circleGeometry(three.nodes)
    expect(ring).not.toBeNull()
    expect(ring!.count).toBe(3)
    expect(ring!.radius).toBeGreaterThanOrEqual(CIRCLE_MIN_RADIUS)
  })

  it('inverse les nœuds du bas pour orienter les pointeurs vers l’anneau', () => {
    for (const count of [3, 4, 8]) {
      const snapshot = createCircularSnapshot(
        'int',
        Array.from({ length: count }, (_, index) => ({
          kind: 'int' as const,
          value: index + 1,
        })),
      )
      const ring = circleGeometry(snapshot.nodes)!
      const layout = layoutNodes(snapshot.nodes, 'circle')

      for (const node of snapshot.nodes) {
        const point = layout.get(node.id)!
        const flipped = isNodeFlipped(point, ring)
        expect(flipped).toBe(
          point.y + NODE_H / 2 > ring.cy + 0.5,
        )
        expect(pointerSide('suivant', flipped)).toBe(
          flipped ? 'left' : 'right',
        )
        expect(pointerSide('precedent', flipped)).toBe(
          flipped ? 'right' : 'left',
        )
        const suivant = pointerAnchor(node, point, 'suivant', flipped)
        const precedent = pointerAnchor(node, point, 'precedent', flipped)
        expect(suivant.x).toBeCloseTo(
          flipped ? point.x + CELL_W / 2 : point.x + NODE_W - CELL_W / 2,
          6,
        )
        expect(precedent.x).toBeCloseTo(
          flipped ? point.x + NODE_W - CELL_W / 2 : point.x + CELL_W / 2,
          6,
        )
      }
    }
  })

  it('fait partir les flèches des points et arriver sur la bordure opposée', () => {
    for (const count of [3, 4, 8]) {
      const snapshot = createCircularSnapshot(
        'int',
        Array.from({ length: count }, (_, index) => ({
          kind: 'int' as const,
          value: index + 1,
        })),
      )
      const nodes = snapshot.nodes
      const ring = circleGeometry(nodes)!
      const layout = layoutNodes(nodes, 'circle')

      for (let index = 0; index < nodes.length; index += 1) {
        const source = nodes[index]!
        const sourcePoint = layout.get(source.id)!
        const sourceFlipped = isNodeFlipped(sourcePoint, ring)

        for (const [field, offset] of [
          ['suivant', 1],
          ['precedent', -1],
        ] as const) {
          const target = nodes[(index + offset + nodes.length) % nodes.length]!
          const targetPoint = layout.get(target.id)!
          const targetFlipped = isNodeFlipped(targetPoint, ring)
          const route = routeArrow(
            source,
            field,
            target,
            layout,
            'circle',
            nodes,
          )
          expect(route).not.toBeNull()

          const expectedTail = pointerAnchor(
            source,
            sourcePoint,
            field,
            sourceFlipped,
          )
          expect(route!.tail.x).toBeCloseTo(expectedTail.x, 6)
          expect(route!.tail.y).toBeCloseTo(expectedTail.y, 6)

          const endAtRight =
            field === 'suivant' ? targetFlipped : !targetFlipped
          const expectedTip = {
            x: endAtRight ? targetPoint.x + NODE_W : targetPoint.x,
            y:
              targetPoint.y +
              NODE_H *
                (field === 'suivant' ? PRECEDENT_LANE : SUIVANT_LANE),
          }
          expect(route!.tip.x).toBeCloseTo(expectedTip.x, 6)
          expect(route!.tip.y).toBeCloseTo(expectedTip.y, 6)
        }
      }
    }
  })

  it('garde des points de contact distincts autour de chaque nœud', () => {
    const distance = (a: Point, b: Point): number => Math.hypot(a.x - b.x, a.y - b.y)

    for (const count of [3, 4, 8]) {
      const snapshot = createCircularSnapshot(
        'int',
        Array.from({ length: count }, (_, index) => ({ kind: 'int' as const, value: index + 1 })),
      )
      const nodes = snapshot.nodes
      const layout = layoutNodes(nodes, 'circle')

      for (let index = 0; index < nodes.length; index += 1) {
        const node = nodes[index]!
        const next = nodes[(index + 1) % nodes.length]!
        const previous = nodes[(index - 1 + nodes.length) % nodes.length]!

        const outgoingNext = routeArrow(node, 'suivant', next, layout, 'circle', nodes)
        const incomingNext = routeArrow(previous, 'suivant', node, layout, 'circle', nodes)
        const outgoingPrevious = routeArrow(node, 'precedent', previous, layout, 'circle', nodes)
        const incomingPrevious = routeArrow(next, 'precedent', node, layout, 'circle', nodes)

        expect(outgoingNext).not.toBeNull()
        expect(incomingNext).not.toBeNull()
        expect(outgoingPrevious).not.toBeNull()
        expect(incomingPrevious).not.toBeNull()

        const contacts = [
          outgoingNext!.tail,
          incomingNext!.tip,
          outgoingPrevious!.tail,
          incomingPrevious!.tip,
        ]
        for (let first = 0; first < contacts.length; first += 1) {
          for (let second = first + 1; second < contacts.length; second += 1) {
            expect(
              distance(contacts[first]!, contacts[second]!),
              `nœud ${node.id}, contacts ${first} et ${second}, ${count} nœuds`,
            ).toBeGreaterThan(18)
          }
        }
      }
    }
  })

  it('place la cellule debut au-dessus du sommet de l’anneau', () => {
    const snapshot = circular()
    const first = snapshot.nodes[0]!
    const firstPoint = layoutNodes(snapshot.nodes, 'circle').get(first.id)!
    const geometry = debutCellGeometry(snapshot.nodes, 'circle')
    expect(geometry.cell.y).toBe(firstPoint.y - DEBUT_CELL_GAP - DEBUT_CELL_H)
    expect(geometry.dot.x).toBeCloseTo(firstPoint.x + 110, 6)
    const route = debutRoute(snapshot.nodes, { kind: 'node', id: first.id }, 'circle')
    expect(route).not.toBeNull()
    expect(route!.tip.y).toBeCloseTo(firstPoint.y, 6)
  })
})
