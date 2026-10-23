import { describe, expect, it } from 'vitest'
import type { Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import {
  layoutTree,
  measureTree,
  NULL_GROUND_BOUNDS,
  placeEdgeLabels,
  ROOT_ARROW_MARKER,
  rootPointerGeometry,
  TREE_NODE_RADIUS,
} from './geometry'
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

  it('garde l’ordre des phases dans chaque cadre, pour les trois parcours', () => {
    const expectedPhases: Record<TraversalOrder, string[]> = {
      prefixe: ['visite', 'gauche', 'droit'],
      infixe: ['gauche', 'visite', 'droit'],
      postfixe: ['gauche', 'droit', 'visite'],
    }
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      for (const step of runners[order](courseTreeSnapshot())) {
        for (const frame of step.snapshot.callStack?.frames ?? []) {
          expect(frame.phases.map((phase) => phase.name), order).toEqual(expectedPhases[order])
        }
      }
    }
  })

  it('ne termine la visite postfixe qu’au retour du cadre', () => {
    const steps = runners.postfixe(courseTreeSnapshot())
    for (const step of steps) {
      const top = step.snapshot.callStack?.frames.at(-1)
      const visit = top?.phases.find((phase) => phase.name === 'visite')
      if (visit?.state === 'done') {
        expect(top?.line).toBe(7)
        expect(top?.status).toBe('active')
      }
      if (visit?.state === 'current') {
        expect(top?.line).toBe(6)
      }
    }
    const firstTop = steps[0]!.snapshot.callStack?.frames.at(-1)
    expect(firstTop?.phases.at(-1)?.name).toBe('visite')
  })

  it('relie chaque appel NULL à la case enfant qui l’a produit', () => {
    for (const order of Object.keys(runners) as TraversalOrder[]) {
      const steps = runners[order](courseTreeSnapshot())
      for (const step of steps) {
        for (const frame of step.snapshot.callStack?.frames ?? []) {
          if (frame.nodeId !== null) {
            expect(frame.nullSlot, order).toBeNull()
            continue
          }
          expect(frame.nullSlot, order).not.toBeNull()
          const parent = getNode(step.snapshot, frame.nullSlot!.parentId)
          expect(parent).toBeDefined()
          expect(parent![frame.nullSlot!.field].kind).toBe('null')
        }
      }
    }

    const step46 = runners.prefixe(courseTreeSnapshot())[45]!
    const top46 = step46.snapshot.callStack!.frames.at(-1)!
    expect(top46.nodeId).toBeNull()
    expect(top46.nullSlot).toEqual({ parentId: 3, field: 'gauche' })
    expect(getNode(step46.snapshot, 3)?.payload).toEqual({ kind: 'int', value: 70 })
  })

  it('respecte frames = profondeur + 1 à chaque étape', () => {
    for (const snapshot of [courseTreeSnapshot(), exerciseTreeSnapshot()]) {
      const depths = new Map(layoutTree(snapshot).nodes.map((node) => [node.node.id, node.depth]))
      for (const order of Object.keys(runners) as TraversalOrder[]) {
        let observedMax = 0
        for (const [index, step] of runners[order](snapshot).entries()) {
          const stack = step.snapshot.callStack!
          observedMax = Math.max(observedMax, stack.frames.length)
          const top = stack.frames.at(-1)
          if (!top) continue
          if (top.nodeId !== null) {
            expect(stack.frames.length, `${order} étape ${index + 1}`).toBe(
              (depths.get(top.nodeId) ?? -1) + 1,
            )
          } else {
            expect(top.nullSlot, `${order} étape ${index + 1}`).not.toBeNull()
            expect(stack.frames.length, `${order} étape ${index + 1}`).toBe(
              (depths.get(top.nullSlot!.parentId) ?? -1) + 2,
            )
          }
        }
        expect(observedMax).toBe(runners[order](snapshot).at(-1)!.snapshot.callStack!.maxDepth)
      }
    }
  })

  it('place les étiquettes d’arête hors des nœuds, des NULL et des autres étiquettes', () => {
    const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a): boolean =>
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2

    for (const snapshot of [courseTreeSnapshot(), exerciseTreeSnapshot()]) {
      const layout = layoutTree(snapshot)
      for (const scale of [0.25, 0.379, 0.498, 0.75, 1, 1.2, 2, 3]) {
        const labels = [...placeEdgeLabels(layout, scale, fr.trees.fields).values()]
        expect(labels, `échelle ${scale}`).toHaveLength(layout.edges.length)
        for (const label of labels) {
          for (const node of layout.nodes) {
            const nodeRect = {
              x: node.x,
              y: node.y,
              width: TREE_NODE_RADIUS * 2,
              height: TREE_NODE_RADIUS * 2,
            }
            expect(
              overlaps(label, nodeRect),
              `échelle ${scale}, étiquette ${label.text}`,
            ).toBe(false)
          }
          for (const symbol of layout.nulls) {
            const nullRect = {
              x: symbol.x,
              y: symbol.y + (NULL_GROUND_BOUNDS.top + NULL_GROUND_BOUNDS.bottom) / 2,
              width: NULL_GROUND_BOUNDS.halfWidth * 2,
              height: NULL_GROUND_BOUNDS.bottom - NULL_GROUND_BOUNDS.top,
            }
            expect(overlaps(label, nullRect), `échelle ${scale}, ${label.text}/NULL`).toBe(false)
          }
          for (const other of labels) {
            if (other === label) continue
            expect(overlaps(label, other), `échelle ${scale}, ${label.text}/${other.text}`).toBe(false)
          }
        }
      }
    }
  })

  it('nomme la pile sans la confondre avec la hauteur de l’arbre', () => {
    expect(fr.callStack.summary(1, 4)).toBe('Pile : 1 appel · max 4')
    expect(fr.callStack.summary(3, 4)).toBe('Pile : 3 appels · max 4')
  })

  it('trace un pointeur racine vertical jusqu’au bord du nœud', () => {
    const layout = layoutTree(courseTreeSnapshot())
    const pointer = rootPointerGeometry(layout)
    expect(pointer.x).toBe(layout.nodes[0]!.x)
    expect(pointer.tipY).toBe(layout.nodes[0]!.y - TREE_NODE_RADIUS - 1.25)
    expect(pointer.pinBottom).toBe(pointer.tipY - 16)
    expect(pointer.pinTop).toBe(pointer.pinBottom - 34)
    expect(pointer.pinTop).toBeLessThan(pointer.pinBottom)
    expect(pointer.pinBottom).toBeLessThan(pointer.tipY)
  })

  it('trace le pointeur racine vers le NULL de l’arbre vide', () => {
    const layout = layoutTree(emptyTreeSnapshot())
    const pointer = rootPointerGeometry(layout)
    expect(pointer.x).toBe(layout.width / 2)
    expect(pointer.tipY).toBe(layout.height / 2 - 72 - 1.5)
    expect(pointer.pinBottom).toBe(pointer.tipY - 16)
  })

  it('oriente la tête de la racine vers le bas avec la taille du trait', () => {
    expect(ROOT_ARROW_MARKER.path).toBe('M 0 0 L 8 4 L 0 8 z')
    expect(ROOT_ARROW_MARKER.refX).toBe(8)
    expect(ROOT_ARROW_MARKER.refY).toBe(4)
    expect(ROOT_ARROW_MARKER.orient).toBe('auto')
    expect(ROOT_ARROW_MARKER.markerUnits).toBe('strokeWidth')
    expect(ROOT_ARROW_MARKER.markerWidth).toBeGreaterThan(0)
    expect(ROOT_ARROW_MARKER.markerHeight).toBe(ROOT_ARROW_MARKER.markerWidth)
  })
})
