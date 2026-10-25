import { describe, expect, it } from 'vitest'
import type { OperationDef, ScenarioDef, Step } from '../../core/types'
import type { ArrowRoute, Point, Rect } from '../ldc/geometry'
import {
  circleNodeRect,
  layoutNodes,
  routeArrow,
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
      // Consecutive resting `precedent` links share their radial connector at
      // the node they meet; that is the intended continuous inner loop, not
      // two arrows running side by side.
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

  it('attache les liens precedent de la forme finale aux bords des nœuds', () => {
    const finals = growingFinalSnapshots()
    const issues: string[] = []
    for (let count = 2; count <= 8; count += 1) {
      const snapshot = finals[count - 1]!
      const nodes = snapshot.nodes.filter((node) => !node.freed)
      const layout = layoutNodes(nodes, 'circle')
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
        const sourceRect = circleNodeRect(layout.get(node.id)!)
        const targetRect = circleNodeRect(layout.get(target.id)!)
        if (!onBorder(route.tail, sourceRect)) {
          issues.push(`${count} nœuds: queue de ${node.id} hors du bord`)
        }
        if (!onBorder(route.tip, targetRect)) {
          issues.push(`${count} nœuds: pointe vers ${target.id} hors du bord`)
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
})
