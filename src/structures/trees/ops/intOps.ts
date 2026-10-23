import type { OperationDef, ParamValues, PointerValue, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { getNode, rootPointer } from '../memory'
import type { TreeCallSlot, TreeSnapshot } from '../memory'
import { NULL_POINTER, NODE_POINTER, TreeRecorder } from './runtime'

const intValue = (value: number) => ({ kind: 'int' as const, value })

function createNode(recorder: TreeRecorder, value: number): number {
  recorder.pushFrame('creerNoeud', { valeur: intValue(value), nouveau: { kind: 'uninit' } })
  recorder.step('creerNoeud', 0, fr.trees.captions.createEntry(value))
  const node = recorder.allocateNode()
  recorder.setLocal('nouveau', NODE_POINTER(node.id))
  recorder.step('creerNoeud', 1, fr.trees.captions.allocated(node.id, node.address))
  recorder.setPayload(node.id, value)
  recorder.step('creerNoeud', 2, fr.trees.captions.assignValue(node.id, value))
  recorder.setChild(node.id, 'gauche', NULL_POINTER)
  recorder.step('creerNoeud', 3, fr.trees.captions.initChild(node.id, 'gauche'))
  recorder.setChild(node.id, 'droit', NULL_POINTER)
  recorder.step('creerNoeud', 4, fr.trees.captions.initChild(node.id, 'droit'))
  recorder.step('creerNoeud', 5, fr.trees.captions.returnCreated(node.id))
  recorder.popFrame()
  return node.id
}

export function runConstruireArbre(state: TreeSnapshot): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  const currentRoot = rootPointer(recorder.state)
  if (currentRoot.kind === 'node') {
    const currentNode = getNode(recorder.state, currentRoot.id)
    if (currentNode && !currentNode.freed) {
      recorder.step('construireArbre', 0, fr.trees.captions.alreadyBuilt)
      return recorder.steps
    }
    recorder.step('construireArbre', 0, fr.trees.captions.rootDangling)
    return recorder.steps
  }

  recorder.pushFrame('construireArbre')
  recorder.step('construireArbre', 0, fr.trees.captions.constructionEntry)
  const root = createNode(recorder, 50)
  recorder.setGlobal('racine', NODE_POINTER(root))
  recorder.step('construireArbre', 1, fr.trees.captions.setRoot(50))

  const left = createNode(recorder, 30)
  recorder.setChild(root, 'gauche', NODE_POINTER(left))
  recorder.step('construireArbre', 2, fr.trees.captions.linkChild(50, 'gauche', 30))

  const right = createNode(recorder, 70)
  recorder.setChild(root, 'droit', NODE_POINTER(right))
  recorder.step('construireArbre', 3, fr.trees.captions.linkChild(50, 'droit', 70))

  const leftLeft = createNode(recorder, 20)
  recorder.setChild(left, 'gauche', NODE_POINTER(leftLeft))
  recorder.step('construireArbre', 4, fr.trees.captions.linkChild(30, 'gauche', 20))

  const leftRight = createNode(recorder, 40)
  recorder.setChild(left, 'droit', NODE_POINTER(leftRight))
  recorder.step('construireArbre', 5, fr.trees.captions.linkChild(30, 'droit', 40))

  const rightRight = createNode(recorder, 80)
  recorder.setChild(right, 'droit', NODE_POINTER(rightRight))
  recorder.step('construireArbre', 6, fr.trees.captions.linkChild(70, 'droit', 80))
  recorder.popFrame()
  recorder.step('construireArbre', 7, fr.trees.captions.constructionDone)
  return recorder.steps
}

type TraversalOrder = 'prefixe' | 'infixe' | 'postfixe'

const traversalActions = (order: TraversalOrder) =>
  order === 'prefixe'
    ? ['visit', 'gauche', 'droit'] as const
    : order === 'infixe'
      ? ['gauche', 'visit', 'droit'] as const
      : ['gauche', 'droit', 'visit'] as const

const traversalPhases = (order: TraversalOrder) =>
  traversalActions(order).map((action) => (action === 'visit' ? 'visite' : action)) as Array<
    'visite' | 'gauche' | 'droit'
  >

function runTraversalNode(
  recorder: TreeRecorder,
  fn: string,
  order: TraversalOrder,
  pointer: PointerValue,
  nullSlot: TreeCallSlot | null = null,
): void {
  recorder.pushFrame(fn, { n: pointer })
  recorder.pushCallFrame(fn, pointer, traversalPhases(order), nullSlot)
  recorder.pauseCall(0)
  recorder.step(fn, 0, fr.trees.captions.call(fn, pointer))
  const isNull = pointer.kind !== 'node'
  recorder.pauseCall(1)
  recorder.step(fn, 1, fr.trees.captions.testNull(pointer), {
    cond: { expr: 'n == NULL', result: isNull },
  })
  if (isNull) {
    recorder.pauseCall(2)
    recorder.step(fn, 2, fr.trees.captions.nullReturn)
    recorder.popCallFrame()
    recorder.popFrame()
    return
  }

  const node = getNode(recorder.state, pointer.id)
  if (!node || node.freed || node.payload.kind !== 'int') {
    recorder.pauseCall(2)
    recorder.step(fn, 2, fr.trees.captions.invalidNode)
    recorder.popCallFrame()
    recorder.popFrame()
    return
  }
  const value = node.payload.value
  recorder.pauseCall(3)
  recorder.step(fn, 3, fr.trees.captions.continueNode(value))

  const actions = traversalActions(order)
  const lines = order === 'prefixe' ? [4, 5, 6] : order === 'infixe' ? [4, 5, 6] : [4, 5, 6]

  actions.forEach((action, index) => {
    const line = lines[index] ?? 4
    if (action === 'visit') {
      recorder.incrementTraversed()
      recorder.recordVisit(node.id)
      recorder.addConsole(`${value} `)
      recorder.beginVisit(line)
      recorder.step(fn, line, fr.trees.captions.visit(value))
      recorder.completeVisit(value, line)
      return
    }
    const child = node[action]
    recorder.beginCallPhase(action, line)
    recorder.step(fn, line, fr.trees.captions.recursiveCall(action, value))
    runTraversalNode(recorder, fn, order, child, { parentId: node.id, field: action })
    recorder.completeCallPhase(action)
  })

  recorder.pauseCall(7)
  recorder.step(fn, 7, fr.trees.captions.returnFrom(value))
  recorder.popCallFrame()
  recorder.popFrame()
}

function runTraversal(state: TreeSnapshot, order: TraversalOrder): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  recorder.beginTraversal()
  const fn = `parcours${order[0]?.toUpperCase() ?? ''}${order.slice(1)}`
  const root = rootPointer(recorder.state)
  if (root.kind === 'node' && getNode(recorder.state, root.id)?.freed) {
    recorder.step(fn, 0, fr.trees.captions.rootFreed)
    return recorder.steps
  }
  runTraversalNode(recorder, fn, order, root)
  recorder.step(fn, 7, fr.trees.captions.traversalDone(order))
  return recorder.steps
}

export const runParcoursPrefixe = (state: TreeSnapshot): Step<TreeSnapshot>[] =>
  runTraversal(state, 'prefixe')
export const runParcoursInfixe = (state: TreeSnapshot): Step<TreeSnapshot>[] =>
  runTraversal(state, 'infixe')
export const runParcoursPostfixe = (state: TreeSnapshot): Step<TreeSnapshot>[] =>
  runTraversal(state, 'postfixe')

function destroyNode(recorder: TreeRecorder, pointer: PointerValue): void {
  recorder.pushFrame('detruireArbre', { n: pointer })
  recorder.step('detruireArbre', 0, fr.trees.captions.destroyCall(pointer))
  const isNull = pointer.kind !== 'node'
  recorder.step('detruireArbre', 1, fr.trees.captions.testNull(pointer), {
    cond: { expr: 'n == NULL', result: isNull },
  })
  if (isNull) {
    recorder.step('detruireArbre', 2, fr.trees.captions.nullReturn)
    recorder.popFrame()
    return
  }
  const node = getNode(recorder.state, pointer.id)
  if (!node || node.freed) {
    recorder.step('detruireArbre', 2, fr.trees.captions.invalidNode)
    recorder.popFrame()
    return
  }
  recorder.step('detruireArbre', 3, fr.trees.captions.continueDestroy(node.payload))
  recorder.step('detruireArbre', 4, fr.trees.captions.destroyChild('gauche', node.payload))
  destroyNode(recorder, node.gauche)
  recorder.step('detruireArbre', 5, fr.trees.captions.destroyChild('droit', node.payload))
  destroyNode(recorder, node.droit)
  recorder.freeNode(node.id)
  recorder.step('detruireArbre', 6, fr.trees.captions.free(node.payload))
  recorder.step('detruireArbre', 7, fr.trees.captions.destroyReturn(node.payload))
  recorder.popFrame()
}

export function runDetruireArbre(state: TreeSnapshot): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  const root = rootPointer(recorder.state)
  if (root.kind === 'node' && getNode(recorder.state, root.id)?.freed) {
    recorder.step('detruireArbre', 0, fr.trees.captions.rootDangling)
    return recorder.steps
  }
  destroyNode(recorder, root)
  recorder.step('detruireArbre', 7, fr.trees.captions.destroyDone(root))
  return recorder.steps
}

const noParams: OperationDef<TreeSnapshot>['params'] = []
const defineOperation = (
  id: string,
  run: (state: TreeSnapshot, params: ParamValues) => Step<TreeSnapshot>[],
): OperationDef<TreeSnapshot> => ({
  id,
  label: fr.trees.operations[id as keyof typeof fr.trees.operations].label,
  params: noParams,
  complexity: fr.trees.operations[id as keyof typeof fr.trees.operations].complexity,
  complexityNote: fr.trees.operations[id as keyof typeof fr.trees.operations].note,
  inserts: id === 'construireArbre',
  showCallStack: id === 'parcoursPrefixe' || id === 'parcoursInfixe' || id === 'parcoursPostfixe',
  run,
})

export const treeOperations: OperationDef<TreeSnapshot>[] = [
  defineOperation('construireArbre', (state) => runConstruireArbre(state)),
  defineOperation('parcoursPrefixe', (state) => runParcoursPrefixe(state)),
  defineOperation('parcoursInfixe', (state) => runParcoursInfixe(state)),
  defineOperation('parcoursPostfixe', (state) => runParcoursPostfixe(state)),
  defineOperation('detruireArbre', (state) => runDetruireArbre(state)),
]

