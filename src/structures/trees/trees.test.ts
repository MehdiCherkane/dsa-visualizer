import { describe, expect, it } from 'vitest'
import type { Step } from '../../core/types'
import { measureTree } from './geometry'
import {
  courseTreeSnapshot,
  emptyTreeSnapshot,
  exerciseTreeSnapshot,
  getNode,
} from './memory'
import type { TreeSnapshot } from './memory'
import {
  runParcoursInfixe,
  runParcoursPostfixe,
  runParcoursPrefixe,
  treeOperations,
} from './ops/intOps'

type TraversalOrder = 'prefixe' | 'infixe' | 'postfixe'

const runners: Record<TraversalOrder, (state: TreeSnapshot) => Step<TreeSnapshot>[]> = {
  prefixe: runParcoursPrefixe,
  infixe: runParcoursInfixe,
  postfixe: runParcoursPostfixe,
}

const expectedOrders: Record<TraversalOrder, number[]> = {
  prefixe: [50, 30, 20, 40, 70, 80],
  infixe: [20, 30, 40, 50, 70, 80],
  postfixe: [20, 40, 30, 80, 70, 50],
}

const expectedExerciseOrders: Record<TraversalOrder, number[]> = {
  prefixe: [15, 8, 4, 10, 22, 30],
  infixe: [4, 8, 10, 15, 22, 30],
  postfixe: [4, 10, 8, 30, 22, 15],
}

function visitedValues(snapshot: TreeSnapshot): number[] {
  return (snapshot.traversal?.visitedNodeIds ?? []).map((id) => {
    const node = getNode(snapshot, id)
    return node?.payload.kind === 'int' ? node.payload.value : -1
  })
}

function pushedFrames(steps: Step<TreeSnapshot>[]): Map<number, number | null> {
  const pushed = new Map<number, number | null>()
  for (const step of steps) {
    for (const frame of step.snapshot.callStack?.frames ?? []) {
      if (!pushed.has(frame.id)) pushed.set(frame.id, frame.nodeId)
    }
  }
  return pushed
}

describe('chapitre 6 — parcours récursifs', () => {
  it('produit l’ordre du cours en préfixe, infixe et postfixe', () => {
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const steps = runners[order](courseTreeSnapshot())
      const last = steps.at(-1)!
      expect(visitedValues(last.snapshot)).toEqual(expectedOrders[order])
      expect(last.console.output.trim()).toBe(expectedOrders[order].join(' '))
    }
  })

  it('produit l’ordre de l’arbre d’exercice', () => {
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const last = runners[order](exerciseTreeSnapshot()).at(-1)!
      expect(visitedValues(last.snapshot)).toEqual(expectedExerciseOrders[order])
    }
  })

  it('termine avec une pile vide sur un arbre vide', () => {
    const steps = runners.prefixe(emptyTreeSnapshot())
    expect(steps).toHaveLength(4)
    const last = steps.at(-1)!
    expect(last.snapshot.callStack?.frames).toEqual([])
    expect(last.snapshot.traversal?.visitedNodeIds).toEqual([])
    expect(last.console.output).toBe('')
    expect(last.snapshot.callStack?.maxDepth).toBe(1)
    expect(last.snapshot.callStack?.maxNonNullDepth).toBe(0)
  })

  it('vide la pile à la dernière étape et empile chaque nœud une seule fois', () => {
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const steps = runners[order](courseTreeSnapshot())
      expect(steps.at(-1)!.snapshot.callStack?.frames).toEqual([])

      const pushed = pushedFrames(steps)
      const nodeIds = [...pushed.values()].filter((id): id is number => id !== null)
      expect(new Set(nodeIds).size).toBe(nodeIds.length)
      expect(new Set(nodeIds)).toEqual(new Set([1, 2, 3, 4, 5, 6]))
      // Six real nodes plus the seven empty children always push a NULL frame.
      expect(pushed.size - nodeIds.length).toBe(7)
    }
  })

  it('mesure une profondeur maximale cohérente avec la hauteur de l’arbre', () => {
    const state = courseTreeSnapshot()
    const height = measureTree(state).height
    expect(height).toBe(2)
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const steps = runners[order](state)
      const last = steps.at(-1)!
      const observedHeight = Math.max(
        ...steps.map((step) => step.snapshot.callStack?.frames.length ?? 0),
      )
      const observedNonNull = Math.max(
        ...steps.map(
          (step) =>
            step.snapshot.callStack?.frames.filter((frame) => frame.nodeId !== null).length ?? 0,
        ),
      )
      expect(observedHeight).toBe(height + 2)
      expect(observedNonNull).toBe(height + 1)
      expect(last.snapshot.callStack?.maxDepth).toBe(height + 2)
      expect(last.snapshot.callStack?.maxNonNullDepth).toBe(height + 1)
    }
  })

  it('garde les phases dans l’ordre du parcours et marque visite comme courante', () => {
    const expectedPhases: Record<TraversalOrder, string[]> = {
      prefixe: ['visite', 'gauche', 'droit'],
      infixe: ['gauche', 'visite', 'droit'],
      postfixe: ['gauche', 'droit', 'visite'],
    }
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const steps = runners[order](courseTreeSnapshot())
      const firstFrame = steps[0]?.snapshot.callStack?.frames.at(-1)
      expect(firstFrame).toBeDefined()
      expect(firstFrame?.phases.map((phase) => phase.name)).toEqual(expectedPhases[order])
      expect(firstFrame?.phases.every((phase) => phase.state === 'pending')).toBe(true)

      for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index]!
        const previousOutput = index === 0 ? '' : steps[index - 1]!.console.output
        if (step.console.output.length <= previousOutput.length) continue

        const top = step.snapshot.callStack?.frames.at(-1)
        const phase = top?.phases.find((entry) => entry.name === 'visite')
        expect(phase?.state, `${order} étape ${index}`).toBe('current')
        expect(phase?.value).toBeUndefined()

        const after = steps[index + 1]
        expect(after, `${order} étape ${index} sans suite`).toBeDefined()
        const sameFrame = after!.snapshot.callStack?.frames.find((frame) => frame.id === top?.id)
        const done = sameFrame?.phases.find((entry) => entry.name === 'visite')
        expect(done?.state, `${order} étape ${index + 1}`).toBe('done')
        expect(done?.value).toBe(Number(step.console.output.trim().split(/\s+/).at(-1)))
      }
    }
  })

  it('ne change pas le nombre d’étapes des parcours ni de la construction', () => {
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      expect(runners[order](courseTreeSnapshot()), order).toHaveLength(64)
      expect(runners[order](exerciseTreeSnapshot()), order).toHaveLength(64)
      expect(runners[order](emptyTreeSnapshot()), order).toHaveLength(4)
    }
    const build = treeOperations.find((operation) => operation.id === 'construireArbre')!
    expect(build.run(emptyTreeSnapshot(), {})).toHaveLength(44)
  })

  it('fige chaque pile d’appels et ne réutilise jamais le même objet', () => {
    const steps = runners.infixe(courseTreeSnapshot())
    for (let index = 0; index < steps.length; index += 1) {
      const callStack = steps[index]!.snapshot.callStack
      if (!callStack) continue
      expect(Object.isFrozen(callStack)).toBe(true)
      expect(Object.isFrozen(callStack.frames)).toBe(true)
      for (const frame of callStack.frames) {
        expect(Object.isFrozen(frame)).toBe(true)
        expect(Object.isFrozen(frame.phases)).toBe(true)
      }
      if (index > 0) {
        expect(callStack).not.toBe(steps[index - 1]!.snapshot.callStack)
      }
    }
  })

  it('réserve la pile d’appels aux trois parcours', () => {
    const flagged = treeOperations.filter((operation) => operation.showCallStack)
    expect(flagged.map((operation) => operation.id)).toEqual([
      'parcoursPrefixe',
      'parcoursInfixe',
      'parcoursPostfixe',
    ])
  })
})
