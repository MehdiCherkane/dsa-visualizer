import { describe, expect, it } from 'vitest'
import type { OperationDef, ScenarioDef, Step } from '../../core/types'
import type { ArrowRoute, Point, Rect } from '../ldc/geometry'
import {
  NODE_H,
  NODE_W,
  circleGeometry,
  circleNodeRect,
  isRowFlipped,
  layoutNodes,
  pointerAnchor,
  routeArrow,
} from '../ldc/geometry'
import type { LdcNode, PointerField } from '../ldc/memory'
import type { LdcSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'

/**
 * These tests sample the actual SVG paths. They complement the unit tests on
 * route waypoints by checking the drawn curves against every non-endpoint
 * node and against each other, including the transient heap/row states.
 */

function operationsFor(profileId: string): OperationDef<LdcSnapshot>[] {
  return profileId === 'int' ? intOperations : studentOperations
}

function scenarioSteps(scenario: ScenarioDef<LdcSnapshot>): Step<LdcSnapshot>[] {
  const operations = operationsFor(scenario.profileId)
  let snapshot = scenario.state
  const result: Step<LdcSnapshot>[] = []
  for (const scenarioStep of scenario.steps) {
    const operation = operations.find(
      (candidate) => candidate.id === scenarioStep.operationId,
    )!
    if (scenarioStep.stateBefore) snapshot = scenarioStep.stateBefore
    const steps = operation.run(snapshot, scenarioStep.params)
    result.push(...steps)
    snapshot = steps[steps.length - 1]!.snapshot
  }
  return result
}

function samplePath(path: string, perCurve = 28): Point[] {
  const tokens = path.match(/[MLQC]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi) ?? []
  const points: Point[] = []
  let index = 0
  let cursor: Point = { x: 0, y: 0 }
  const number = (): number => Number(tokens[index++])
  while (index < tokens.length) {
    const command = tokens[index++]!
    if (command === 'M' || command === 'L') {
      cursor = { x: number(), y: number() }
      points.push(cursor)
      continue
    }
    if (command === 'Q') {
      const control = { x: number(), y: number() }
      const end = { x: number(), y: number() }
      for (let step = 1; step <= perCurve; step += 1) {
        const t = step / perCurve
        const u = 1 - t
        points.push({
          x: u * u * cursor.x + 2 * u * t * control.x + t * t * end.x,
          y: u * u * cursor.y + 2 * u * t * control.y + t * t * end.y,
        })
      }
      cursor = end
      continue
    }
    if (command === 'C') {
      const c1 = { x: number(), y: number() }
      const c2 = { x: number(), y: number() }
      const end = { x: number(), y: number() }
      for (let step = 1; step <= perCurve; step += 1) {
        const t = step / perCurve
        const u = 1 - t
        points.push({
          x:
            u * u * u * cursor.x +
            3 * u * u * t * c1.x +
            3 * u * t * t * c2.x +
            t * t * t * end.x,
          y:
            u * u * u * cursor.y +
            3 * u * u * t * c1.y +
            3 * u * t * t * c2.y +
            t * t * t * end.y,
        })
      }
      cursor = end
    }
  }
  return points
}

function inside(point: Point, rect: Rect, inset = 2): boolean {
  return (
    point.x > rect.x + inset &&
    point.x < rect.x + rect.width - inset &&
    point.y > rect.y + inset &&
    point.y < rect.y + rect.height - inset
  )
}

function distance(first: Point, second: Point): number {
  return Math.hypot(first.x - second.x, first.y - second.y)
}

interface AuditOptions {
  finalForm?: boolean
}

interface RouteEntry {
  label: string
  field: PointerField
  route: ArrowRoute
  sourceId: number
  targetId: number
  samples: Point[]
}

function auditSnapshot(
  label: string,
  snapshot: LdcSnapshot,
  options: AuditOptions = {},
): string[] {
  const nodes = snapshot.nodes.filter((node) => !node.freed)
  if (nodes.length === 0) return []
  const layout = layoutNodes(nodes, 'circle')
  const entries: RouteEntry[] = []
  for (const node of nodes) {
    const point = layout.get(node.id)
    if (!point) continue
    for (const field of ['suivant', 'precedent'] as const) {
      const pointer = node[field]
      if (pointer.kind !== 'node') continue
      const target = nodes.find((candidate) => candidate.id === pointer.id)
      if (!target) continue
      const route = routeArrow(node, field, target, layout, 'circle', nodes, {
        finalForm: options.finalForm,
      })
      if (!route) continue
      entries.push({
        label: `${node.id}(${node.lane}).${field}->${target.id}`,
        field,
        route,
        sourceId: node.id,
        targetId: target.id,
        samples: samplePath(route.path),
      })
    }
  }

  const issues: string[] = []
  for (const entry of entries) {
    for (const node of nodes) {
      if (node.id === entry.sourceId || node.id === entry.targetId) continue
      const point = layout.get(node.id)!
      const rect = circleNodeRect(point)
      const hit = entry.samples.some((sample) => inside(sample, rect))
      if (hit) issues.push(`${label}: ${entry.label} crosses node ${node.id}`)
    }
  }

  for (let first = 0; first < entries.length; first += 1) {
    for (let second = first + 1; second < entries.length; second += 1) {
      const a = entries[first]!
      const b = entries[second]!
      // Transient `precedent` links can meet at a node entry while the
      // operation is being animated. The resting form is audited separately
      // below, where even consecutive links must stay distinct.
      const connectedPrecedent =
        a.field === 'precedent' &&
        b.field === 'precedent' &&
        (a.targetId === b.sourceId || b.targetId === a.sourceId)
      if (connectedPrecedent) continue
      let close = 0
      for (const point of a.samples) {
        if (b.samples.some((other) => distance(point, other) < 2.5)) close += 1
      }
      // A single crossing touches only a few samples. A shared segment keeps
      // the two paths within the tolerance for much longer.
      if (close > 3) {
        issues.push(`${label}: ${a.label} overlaps ${b.label} (${close} samples)`)
      }
    }
  }
  return issues
}

function onBorder(point: Point, rect: Rect, epsilon = 0.5): boolean {
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

function pathCommands(path: string): string[] {
  return (path.match(/[MLQC]/gi) ?? []).map((command) => command.toUpperCase())
}

function cross(first: Point, second: Point, third: Point): number {
  return (
    (second.x - first.x) * (third.y - first.y) -
    (second.y - first.y) * (third.x - first.x)
  )
}

function segmentsCross(
  firstStart: Point,
  firstEnd: Point,
  secondStart: Point,
  secondEnd: Point,
): boolean {
  const firstSide = cross(firstStart, firstEnd, secondStart)
  const secondSide = cross(firstStart, firstEnd, secondEnd)
  const thirdSide = cross(secondStart, secondEnd, firstStart)
  const fourthSide = cross(secondStart, secondEnd, firstEnd)
  return (
    ((firstSide > 1e-6 && secondSide < -1e-6) ||
      (firstSide < -1e-6 && secondSide > 1e-6)) &&
    ((thirdSide > 1e-6 && fourthSide < -1e-6) ||
      (thirdSide < -1e-6 && fourthSide > 1e-6))
  )
}

function pathsCross(first: Point[], second: Point[]): boolean {
  for (let index = 0; index < first.length - 1; index += 1) {
    for (let other = 0; other < second.length - 1; other += 1) {
      if (
        segmentsCross(
          first[index]!,
          first[index + 1]!,
          second[other]!,
          second[other + 1]!,
        )
      ) {
        return true
      }
    }
  }
  return false
}

/** Final snapshots of a ring grown one node at a time, from one to eight. */
function growingFinalSnapshots(): LdcSnapshot[] {
  let snapshot = intScenarios.find((scenario) => scenario.id === 'vide')!.state
  const insert = intOperations.find((operation) => operation.id === 'insererEnFin')!
  const finals: LdcSnapshot[] = []
  for (let count = 1; count <= 8; count += 1) {
    const steps = insert.run(snapshot, { valeur: count })
    snapshot = steps[steps.length - 1]!.snapshot
    finals.push(snapshot)
  }
  return finals
}

/** Routes that differ between the transient routing and the resting routing. */
function routeChanges(
  label: string,
  snapshot: LdcSnapshot,
  field: PointerField,
  options: AuditOptions,
): string[] {
  const nodes = snapshot.nodes.filter((node) => !node.freed)
  const layout = layoutNodes(nodes, 'circle')
  const issues: string[] = []
  for (const node of nodes) {
    const pointer = node[field]
    if (pointer.kind !== 'node') continue
    const target = nodes.find((candidate) => candidate.id === pointer.id)
    if (!target) continue
    const animated = routeArrow(node, field, target, layout, 'circle', nodes)
    const resting = routeArrow(node, field, target, layout, 'circle', nodes, options)
    if (animated?.path !== resting?.path) {
      issues.push(`${label}: ${node.id}.${field}->${target.id} change de tracé`)
    }
  }
  return issues
}

/** Ring nodes in circular order. */
function ringRow(snapshot: LdcSnapshot): LdcNode[] {
  return snapshot.nodes
    .filter((node) => !node.freed && node.lane === 'row')
    .slice()
    .sort((first, second) => first.slot - second.slot)
}

function pairRoutes(
  nodes: LdcNode[],
  layout: Map<number, Point>,
  index: number,
): { suivant: ArrowRoute; precedent: ArrowRoute } {
  const current = nodes[index]!
  const next = nodes[(index + 1) % nodes.length]!
  const suivant = routeArrow(
    current,
    'suivant',
    next,
    layout,
    'circle',
    nodes,
  )
  const precedent = routeArrow(
    next,
    'precedent',
    current,
    layout,
    'circle',
    nodes,
  )
  if (!suivant || !precedent) {
    throw new Error(`missing pair routes for ${current.id}->${next.id}`)
  }
  return { suivant, precedent }
}

function minPathDistance(first: Point[], second: Point[]): number {
  let closest = Number.POSITIVE_INFINITY
  for (const point of first) {
    for (const other of second) {
      closest = Math.min(closest, distance(point, other))
    }
  }
  return closest
}

function pairIssues(
  label: string,
  nodes: LdcNode[],
  layout: Map<number, Point>,
  index: number,
): string[] {
  const issues: string[] = []
  const current = nodes[index]!
  const next = nodes[(index + 1) % nodes.length]!
  const { suivant, precedent } = pairRoutes(nodes, layout, index)
  const following = samplePath(suivant.path, 80)
  const previous = samplePath(precedent.path, 80)

  if (pathsCross(following, previous)) {
    issues.push(`${label}: ${current.id}.suivant croise ${next.id}.precedent`)
  }
  const gap = minPathDistance(following, previous)
  if (gap < 27.5) {
    issues.push(
      `${label}: paire ${current.id}->${next.id} à seulement ${gap.toFixed(1)} px`,
    )
  }

  for (const node of nodes) {
    if (node.id === current.id || node.id === next.id) continue
    const rect = circleNodeRect(layout.get(node.id)!)
    if (following.some((point) => inside(point, rect))) {
      issues.push(`${label}: ${current.id}.suivant traverse le nœud ${node.id}`)
    }
    if (previous.some((point) => inside(point, rect))) {
      issues.push(`${label}: ${next.id}.precedent traverse le nœud ${node.id}`)
    }
  }

  const anchors = [suivant.tail, precedent.tail, suivant.tip, precedent.tip]
  for (let first = 0; first < anchors.length; first += 1) {
    for (let second = first + 1; second < anchors.length; second += 1) {
      if (distance(anchors[first]!, anchors[second]!) < 1) {
        issues.push(
          `${label}: paire ${current.id}->${next.id} partage une ancre`,
        )
      }
    }
  }

  return issues
}

describe('routage des flèches du chapitre 5', () => {
  it('ne traverse aucun nœud et ne superpose pas deux flèches dans les scénarios', () => {
    const issues: string[] = []
    for (const scenario of [...intScenarios, ...studentScenarios]) {
      issues.push(...auditSnapshot(`${scenario.id} initial`, scenario.state))
      scenarioSteps(scenario).forEach((step, index) => {
        issues.push(
          ...auditSnapshot(
            `${scenario.id} étape ${index + 1} (${step.caption.slice(0, 40)})`,
            step.snapshot,
          ),
        )
      })
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('reste lisible jusqu’à huit nœuds et après les rotations', () => {
    const issues: string[] = []
    let growing = intScenarios.find((scenario) => scenario.id === 'vide')!.state
    const insert = intOperations.find(
      (operation) => operation.id === 'insererEnFin',
    )!
    for (let count = 1; count <= 8; count += 1) {
      const steps = insert.run(growing, { valeur: count })
      steps.forEach((step, index) => {
        issues.push(
          ...auditSnapshot(
            `croissance ${count} étape ${index + 1} (${step.caption.slice(0, 40)})`,
            step.snapshot,
          ),
        )
      })
      growing = steps[steps.length - 1]!.snapshot
    }

    const rotate = intOperations.find(
      (operation) => operation.id === 'passerAuSuivant',
    )!
    for (let turn = 1; turn <= 8; turn += 1) {
      const steps = rotate.run(growing, {})
      steps.forEach((step, index) => {
        issues.push(
          ...auditSnapshot(
            `rotation ${turn} étape ${index + 1} (${step.caption.slice(0, 40)})`,
            step.snapshot,
          ),
        )
      })
      growing = steps[steps.length - 1]!.snapshot
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('garde la forme finale lisible de deux à huit nœuds', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      issues.push(
        ...auditSnapshot(`forme finale ${count}`, finals[count - 1]!, {
          finalForm: true,
        }),
      )
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('enveloppe les deux nœuds avec deux paires d’arcs extérieurs', () => {
    const snapshot = growingFinalSnapshots()[1]!
    const nodes = ringRow(snapshot)
    expect(nodes).toHaveLength(2)
    const layout = layoutNodes(nodes, 'circle')
    const firstPoint = layout.get(nodes[0]!.id)!
    const secondPoint = layout.get(nodes[1]!.id)!
    // The two nodes face each other vertically, as in the reference drawing.
    expect(firstPoint.x).toBeCloseTo(secondPoint.x, 6)
    expect(firstPoint.y + NODE_H).toBeLessThan(secondPoint.y)

    const pairs = [0, 1].map((index) => pairRoutes(nodes, layout, index))
    for (const pair of pairs) {
      expect(pair.suivant.kind).toBe('curve')
      expect(pair.precedent.kind).toBe('curve')
      const following = samplePath(pair.suivant.path, 80)
      const previous = samplePath(pair.precedent.path, 80)
      expect(pathsCross(following, previous)).toBe(false)
      expect(minPathDistance(following, previous)).toBeGreaterThanOrEqual(27.5)
    }

    // One pair wraps around the left side, the other around the right side.
    const nodeRight = Math.max(firstPoint.x, secondPoint.x) + NODE_W
    const sides = pairs.map((pair) => {
      const xs = samplePath(pair.suivant.path, 40).map((point) => point.x)
      return Math.max(...xs) > nodeRight + 1 ? 'right' : 'left'
    })
    expect(sides.sort()).toEqual(['left', 'right'])

    // No arrow crosses the gap between the two facing nodes.
    const gap: Rect = {
      x: firstPoint.x,
      y: firstPoint.y + NODE_H,
      width: NODE_W,
      height: secondPoint.y - (firstPoint.y + NODE_H),
    }
    for (const pair of pairs) {
      for (const route of [pair.suivant, pair.precedent]) {
        expect(samplePath(route.path, 60).some((point) => inside(point, gap))).toBe(false)
      }
    }
  })

  it('trace le triangle à trois nœuds avec une paire droite et deux arcs extérieurs', () => {
    const snapshot = intScenarios.find((scenario) => scenario.id === 'cours')!
      .state
    const nodes = ringRow(snapshot)
    expect(nodes).toHaveLength(3)
    const layout = layoutNodes(nodes, 'circle')
    const centers = nodes.map((node) => {
      const point = layout.get(node.id)!
      return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
    })
    // One node on top, two nodes facing each other on the bottom.
    expect(centers[0]!.y).toBeLessThan(centers[1]!.y)
    expect(centers[1]!.y).toBeCloseTo(centers[2]!.y, 6)

    const pairs = [0, 1, 2].map((index) => pairRoutes(nodes, layout, index))
    // The bottom pair is the short, nearly straight facing pair.
    expect(pairs[1]!.suivant.kind).toBe('straight')
    expect(pairs[1]!.precedent.kind).toBe('straight')
    // The top node reaches each bottom node through an outer arc.
    expect(pairs[0]!.suivant.kind).toBe('curve')
    expect(pairs[0]!.precedent.kind).toBe('curve')
    expect(pairs[2]!.suivant.kind).toBe('curve')
    expect(pairs[2]!.precedent.kind).toBe('curve')

    const issues: string[] = []
    for (let index = 0; index < pairs.length; index += 1) {
      issues.push(...pairIssues('triangle', nodes, layout, index))
    }
    // The two wrap-around links are curved; the bottom facing pair is straight.
    for (const index of [0, 2]) {
      for (const route of [pairs[index]!.suivant, pairs[index]!.precedent]) {
        const commands = pathCommands(route.path)
        if (!commands.includes('Q') && !commands.includes('C')) {
          issues.push(`${nodes[index]!.id}: paire extérieure sans courbe (${commands.join('')})`)
        }
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('garde le même tracé pendant l’animation et au repos de deux à huit nœuds', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      issues.push(
        ...routeChanges(`forme finale ${count}`, snapshot, 'suivant', {
          finalForm: true,
        }),
      )
      issues.push(
        ...routeChanges(`forme finale ${count}`, snapshot, 'precedent', {
          finalForm: true,
        }),
      )
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('part du point de chaque pointeur et arrive sur la bordure de la cible', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = snapshot.nodes.filter((node) => !node.freed)
      const layout = layoutNodes(nodes, 'circle')
      const ring = circleGeometry(nodes)!
      for (const node of nodes) {
        const point = layout.get(node.id)!
        for (const field of ['suivant', 'precedent'] as const) {
          const pointer = node[field]
          if (pointer.kind !== 'node') continue
          const target = nodes.find((candidate) => candidate.id === pointer.id)
          if (!target) continue
          const route = routeArrow(
            node,
            field,
            target,
            layout,
            'circle',
            nodes,
            { finalForm: true },
          )
          if (!route) {
            issues.push(`${count} nœuds: ${node.id}.${field} sans tracé`)
            continue
          }
          const dot = pointerAnchor(
            node,
            point,
            field,
            isRowFlipped(node, point, ring),
          )
          if (distance(route.tail, dot) > 1e-6) {
            issues.push(
              `${count} nœuds: ${node.id}.${field} ne part pas de son point`,
            )
          }
          const targetRect = circleNodeRect(layout.get(target.id)!)
          if (!onBorder(route.tip, targetRect)) {
            issues.push(
              `${count} nœuds: ${node.id}.${field} n’arrive pas sur la bordure de ${target.id}`,
            )
          }
        }
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('laisse les liens suivant identiques entre animation et forme finale', () => {
    const finals = growingFinalSnapshots()
    const issues = finals
      .slice(1)
      .flatMap((snapshot, index) =>
        routeChanges(`forme finale ${index + 2}`, snapshot, 'suivant', {
          finalForm: true,
        }),
      )
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('ne change pas la forme finale à un seul nœud', () => {
    const one = growingFinalSnapshots()[0]!
    const issues = [
      ...routeChanges('un nœud', one, 'suivant', { finalForm: true }),
      ...routeChanges('un nœud', one, 'precedent', { finalForm: true }),
    ]
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('ignore la forme finale pendant une insertion encore dans le tas', () => {
    const finals = growingFinalSnapshots()
    const insert = intOperations.find(
      (operation) => operation.id === 'insererEnFin',
    )!
    const steps = insert.run(finals[1]!, { valeur: 3 })
    const transient = steps.find((step) =>
      step.snapshot.nodes.some(
        (node) => !node.freed && node.lane === 'heap',
      ),
    )
    expect(transient).toBeDefined()
    const snapshot = transient!.snapshot
    const issues = [
      ...routeChanges('insertion transitoire', snapshot, 'suivant', {
        finalForm: true,
      }),
      ...routeChanges('insertion transitoire', snapshot, 'precedent', {
        finalForm: true,
      }),
    ]
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('dessine chaque paire adjacente sans croisement ni chevauchement', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = ringRow(snapshot)
      const layout = layoutNodes(nodes, 'circle')
      for (let index = 0; index < nodes.length; index += 1) {
        issues.push(
          ...pairIssues(`${count} nœuds`, nodes, layout, index),
        )
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('place les nœuds dans l’ordre du cercle sans chevauchement de un à huit', () => {
    const finals = growingFinalSnapshots()
    for (let count = 1; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = ringRow(snapshot)
      expect(nodes).toHaveLength(count)
      const layout = layoutNodes(nodes, 'circle')
      const ring = circleGeometry(nodes)!
      const centers = nodes.map((node) => {
        const point = layout.get(node.id)!
        return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
      })

      for (let first = 0; first < nodes.length; first += 1) {
        for (let second = first + 1; second < nodes.length; second += 1) {
          const a = circleNodeRect(layout.get(nodes[first]!.id)!)
          const b = circleNodeRect(layout.get(nodes[second]!.id)!)
          const overlapX =
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)
          const overlapY =
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
          expect(
            overlapX > 0 && overlapY > 0,
            `${count} nœuds: ${nodes[first]!.id} et ${nodes[second]!.id} se chevauchent`,
          ).toBe(false)
        }
      }

      if (count >= 3) {
        const angles = centers.map((point) =>
          Math.atan2((point.y - ring.cy) / ring.ry, (point.x - ring.cx) / ring.rx),
        )
        for (let index = 0; index < count; index += 1) {
          const next = (index + 1) % count
          const step =
            (angles[next]! - angles[index]! + Math.PI * 2) % (Math.PI * 2)
          expect(step).toBeCloseTo((Math.PI * 2) / count, 6)
        }
      } else if (count === 2) {
        expect(centers[0]!.x).toBeCloseTo(centers[1]!.x, 6)
        expect(centers[0]!.y).not.toBeCloseTo(centers[1]!.y, 6)
      }
    }
  })

  it('dessine les deux auto-liens du nœud unique sur des côtés opposés', () => {
    const snapshot = growingFinalSnapshots()[0]!
    const nodes = ringRow(snapshot)
    expect(nodes).toHaveLength(1)
    const node = nodes[0]!
    const layout = layoutNodes(nodes, 'circle')
    const point = layout.get(node.id)!
    const suivant = routeArrow(node, 'suivant', node, layout, 'circle', nodes)
    const precedent = routeArrow(node, 'precedent', node, layout, 'circle', nodes)
    expect(suivant).not.toBeNull()
    expect(precedent).not.toBeNull()

    const following = samplePath(suivant!.path, 80)
    const previous = samplePath(precedent!.path, 80)
    expect(pathsCross(following, previous)).toBe(false)
    expect(minPathDistance(following, previous)).toBeGreaterThanOrEqual(27.5)
    // `suivant` loops above the node, `precedent` below it.
    expect(suivant!.tip.y).toBeLessThanOrEqual(point.y)
    expect(precedent!.tip.y).toBeGreaterThanOrEqual(point.y + NODE_H)
  })

  it('ferme le carré à quatre nœuds avec quatre paires droites', () => {
    const snapshot = growingFinalSnapshots()[3]!
    const nodes = ringRow(snapshot)
    expect(nodes).toHaveLength(4)
    const layout = layoutNodes(nodes, 'circle')
    const centers = nodes.map((node) => {
      const point = layout.get(node.id)!
      return { x: point.x + NODE_W / 2, y: point.y + NODE_H / 2 }
    })
    expect(centers[0]!.y).toBeCloseTo(centers[1]!.y, 6)
    expect(centers[2]!.y).toBeCloseTo(centers[3]!.y, 6)
    expect(centers[0]!.x).toBeCloseTo(centers[3]!.x, 6)
    expect(centers[1]!.x).toBeCloseTo(centers[2]!.x, 6)

    const issues: string[] = []
    for (let index = 0; index < nodes.length; index += 1) {
      const pair = pairRoutes(nodes, layout, index)
      issues.push(...pairIssues('carré', nodes, layout, index))
      if (index === 0 || index === 2) {
        // Top and bottom sides face each other: two straight arrows.
        if (pair.suivant.kind !== 'straight' || pair.precedent.kind !== 'straight') {
          issues.push(
            `${nodes[index]!.id}->${nodes[(index + 1) % nodes.length]!.id}: paire non droite`,
          )
        }
      } else {
        // Left and right sides wrap around the outside with a long straight
        // vertical run and short stubs at the pointer dots.
        for (const route of [pair.suivant, pair.precedent]) {
          const vertical = route.points.some((point, pointIndex) => {
            if (pointIndex === 0) return false
            const previous = route.points[pointIndex - 1]!
            return (
              Math.abs(point.x - previous.x) < 1e-6 &&
              Math.abs(point.y - previous.y) > NODE_H
            )
          })
          if (!vertical) {
            issues.push(
              `${nodes[index]!.id}->${nodes[(index + 1) % nodes.length]!.id}: côté sans segment vertical`,
            )
          }
        }
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('garde des paires droites et des arcs extérieurs de cinq à huit nœuds', () => {
    const finals = growingFinalSnapshots()
    for (let count = 5; count <= 8; count += 1) {
      const nodes = ringRow(finals[count - 1]!)
      const layout = layoutNodes(nodes, 'circle')
      const kinds = nodes.map((_, index) => pairRoutes(nodes, layout, index))
      const suivantKinds = kinds.map((pair) => pair.suivant.kind)
      expect(suivantKinds).toContain('straight')
      expect(suivantKinds).toContain('curve')
      for (const pair of kinds) {
        expect(pair.suivant.kind).toBe(pair.precedent.kind)
      }
    }
  })
})
