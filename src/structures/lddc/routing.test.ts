import { describe, expect, it } from 'vitest'
import type { OperationDef, ScenarioDef, Step } from '../../core/types'
import type { ArrowRoute, Point, Rect } from '../ldc/geometry'
import {
  circleGeometry,
  circleNodeRect,
  isRowFlipped,
  layoutNodes,
  pointerAnchor,
  routeArrow,
  PRECEDENT_LANE,
} from '../ldc/geometry'
import type { PointerField } from '../ldc/memory'
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

  it('enveloppe les flèches precedent finales de deux nœuds avec une courbe douce', () => {
    const snapshot = growingFinalSnapshots()[1]!
    const nodes = snapshot.nodes.filter((node) => !node.freed)
    const layout = layoutNodes(nodes, 'circle')
    const routes = nodes.flatMap((node) => {
      const pointer = node.precedent
      if (pointer.kind !== 'node') return []
      const target = nodes.find((candidate) => candidate.id === pointer.id)
      if (!target) return []
      const route = routeArrow(
        node,
        'precedent',
        target,
        layout,
        'circle',
        nodes,
        { finalForm: true },
      )
      return route ? [route] : []
    })

    expect(routes).toHaveLength(2)
    const details = routes.map((route) => {
      const [tail, first, second, tip] = route.points
      if (!tail || !first || !second || !tip) {
        throw new Error('missing cubic control points')
      }
      const midpointX = (tail.x + 3 * first.x + 3 * second.x + tip.x) / 8
      const centerline = (tail.x + tip.x) / 2
      const entryAngle = Math.atan2(
        Math.abs(tip.x - second.x),
        Math.abs(tip.y - second.y),
      )
      return { bulge: Math.abs(midpointX - centerline), entryAngle }
    })

    for (const detail of details) {
      // The resting link wraps around the outside of the node pair and enters
      // the lateral border horizontally, as in the reference sketch.
      expect(detail.bulge).toBeGreaterThan(80)
      expect(detail.entryAngle).toBeGreaterThan(Math.PI / 3)
    }
  })

  it('trace les liens suivant du cercle à trois nœuds sans coude', () => {
    const snapshot = intScenarios.find((scenario) => scenario.id === 'cours')!
      .state
    const nodes = snapshot.nodes.filter((node) => !node.freed)
    const layout = layoutNodes(nodes, 'circle')
    const ring = circleGeometry(nodes)!
    const issues: string[] = []
    for (const node of nodes) {
      const pointer = node.suivant
      if (pointer.kind !== 'node') continue
      const target = nodes.find((candidate) => candidate.id === pointer.id)
      if (!target) continue
      const route = routeArrow(node, 'suivant', target, layout, 'circle', nodes)
      if (!route) {
        issues.push(`${node.id}: aucun tracé`)
        continue
      }
      // The dot-to-border approach and the ring arc must be a single cubic:
      // a straight line followed by a quadratic leaves a visible elbow where
      // the two tangents disagree.
      const commands = route.path.match(/[MLQC]/gi) ?? []
      if (commands.some((command) => command !== 'M' && command !== 'C')) {
        issues.push(`${node.id}: segments droits ou quadratiques (${route.path})`)
      }
      const samples = samplePath(route.path, 160)
      let sharpest = 0
      let farthest = 0
      for (let index = 1; index < samples.length - 1; index += 1) {
        const before = samples[index - 1]!
        const current = samples[index]!
        const after = samples[index + 1]!
        farthest = Math.max(
          farthest,
          Math.hypot(current.x - ring.cx, current.y - ring.cy),
        )
        const incoming = Math.atan2(
          current.y - before.y,
          current.x - before.x,
        )
        const outgoing = Math.atan2(after.y - current.y, after.x - current.x)
        let turn = Math.abs(outgoing - incoming)
        if (turn > Math.PI) turn = Math.PI * 2 - turn
        sharpest = Math.max(sharpest, turn)
      }
      if (sharpest > (12 * Math.PI) / 180) {
        issues.push(
          `${node.id}: coude de ${((sharpest * 180) / Math.PI).toFixed(1)}°`,
        )
      }
      // The link must bow around the ring, not cut straight from one node to
      // the next: the curve reaches well beyond the node centres.
      if (farthest < ring.radius + 70) {
        issues.push(
          `${node.id}: courbe trop plate (${farthest.toFixed(1)} < ${ring.radius + 70})`,
        )
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('utilise le routage de repos pour les liens precedent de deux à huit nœuds', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = snapshot.nodes.filter((node) => !node.freed)
      const layout = layoutNodes(nodes, 'circle')
      const changed = nodes.some((node) => {
        const pointer = node.precedent
        if (pointer.kind !== 'node') return false
        const target = nodes.find((candidate) => candidate.id === pointer.id)
        if (!target) return false
        const animated = routeArrow(
          node,
          'precedent',
          target,
          layout,
          'circle',
          nodes,
        )
        const resting = routeArrow(
          node,
          'precedent',
          target,
          layout,
          'circle',
          nodes,
          { finalForm: true },
        )
        return animated?.path !== resting?.path
      })
      if (!changed) {
        issues.push(`${count} nœuds: aucun lien precedent ne change de tracé`)
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })

  it('part du point ou du bord extérieur et arrive sur la voie precedent', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = snapshot.nodes.filter((node) => !node.freed)
      const layout = layoutNodes(nodes, 'circle')
      const ring = circleGeometry(nodes)!
      for (const node of nodes) {
        const pointer = node.precedent
        if (pointer.kind !== 'node') continue
        const target = nodes.find((candidate) => candidate.id === pointer.id)
        if (!target) continue
        const route = routeArrow(
          node,
          'precedent',
          target,
          layout,
          'circle',
          nodes,
          { finalForm: true },
        )
        if (!route) continue
        const point = layout.get(node.id)!
        const sourceRect = circleNodeRect(point)
        const targetRect = circleNodeRect(layout.get(target.id)!)
        const dot = pointerAnchor(
          node,
          point,
          'precedent',
          isRowFlipped(node, point, ring),
        )
        if (
          distance(route.tail, dot) > 1e-6 &&
          !onBorder(route.tail, sourceRect)
        ) {
          issues.push(
            `${count} nœuds: queue de ${node.id} ni sur le point ni sur le bord`,
          )
        }
        const lateral =
          Math.abs(route.tip.x - targetRect.x) < 1e-6 ||
          Math.abs(route.tip.x - (targetRect.x + targetRect.width)) < 1e-6
        const lane = targetRect.y + targetRect.height * PRECEDENT_LANE
        if (!lateral || Math.abs(route.tip.y - lane) > 1e-6) {
          issues.push(
            `${count} nœuds: pointe vers ${target.id} hors de la voie precedent`,
          )
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

  it('dessine chaque lien precedent final comme une seule courbe, sans croisement', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = snapshot.nodes.filter((node) => !node.freed)
      const layout = layoutNodes(nodes, 'circle')
      const routes: Array<{
        label: string
        sourceId: number
        targetId: number
        route: ArrowRoute
        samples: Point[]
      }> = []
      for (const node of nodes) {
        const pointer = node.precedent
        if (pointer.kind !== 'node') continue
        const target = nodes.find((candidate) => candidate.id === pointer.id)
        if (!target) continue
        const route = routeArrow(
          node,
          'precedent',
          target,
          layout,
          'circle',
          nodes,
          { finalForm: true },
        )
        if (!route) continue
        const commands = pathCommands(route.path)
        if (commands.length !== 2 || commands[0] !== 'M' || commands[1] !== 'C') {
          issues.push(
            `${count} nœuds: ${node.id}.precedent n'est pas une seule courbe (${commands.join('')})`,
          )
        }
        const samples = samplePath(route.path)
        // The resting link may start at the pointer dot inside its own node,
        // so only flag a re-entry after the curve has left the source.
        const sourceRect = circleNodeRect(layout.get(node.id)!)
        let exited = false
        for (const sample of samples) {
          if (!exited) {
            if (!inside(sample, sourceRect, 1)) exited = true
            continue
          }
          if (inside(sample, sourceRect, 1)) {
            issues.push(
              `${count} nœuds: ${node.id}.precedent rentre dans son nœud`,
            )
            break
          }
        }
        for (const other of nodes) {
          if (other.id === node.id) continue
          const rect = circleNodeRect(layout.get(other.id)!)
          if (samples.some((sample) => inside(sample, rect, 1))) {
            issues.push(
              `${count} nœuds: ${node.id}.precedent entre dans le nœud ${other.id}`,
            )
          }
        }
        routes.push({
          label: `${node.id}.precedent->${target.id}`,
          sourceId: node.id,
          targetId: target.id,
          route,
          samples,
        })
      }

      for (let first = 0; first < routes.length; first += 1) {
        for (let second = first + 1; second < routes.length; second += 1) {
          const a = routes[first]!
          const b = routes[second]!
          if (pathsCross(a.samples, b.samples)) {
            issues.push(`${count} nœuds: ${a.label} croise ${b.label}`)
          }
        }
      }

      for (const node of nodes) {
        const anchors = routes.flatMap((entry) => {
          const result: Point[] = []
          if (entry.sourceId === node.id) result.push(entry.route.tail)
          if (entry.targetId === node.id) result.push(entry.route.tip)
          return result
        })
        for (let first = 0; first < anchors.length; first += 1) {
          for (let second = first + 1; second < anchors.length; second += 1) {
            if (distance(anchors[first]!, anchors[second]!) < 1) {
              issues.push(
                `${count} nœuds: deux flèches precedent partagent une ancre sur ${node.id}`,
              )
            }
          }
        }
      }
    }
    expect(issues, issues.join('\n')).toEqual([])
  })
})
