import type { OperationDef, ParamValues, PointerValue, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { callArgument, callTarget, countTreeNodes, getNode, requireNode, rootPointer } from '../../trees/memory'
import type { TreeCallSlot, TreeNode, TreeSnapshot } from '../../trees/memory'
import { runParcoursInfixe } from '../../trees/ops/intOps'
import { NULL_POINTER, NODE_POINTER, TreeRecorder } from '../../trees/ops/runtime'
import { inorderValues } from '../memory'

const intValue = (value: number) => ({ kind: 'int' as const, value })

function liveNode(recorder: TreeRecorder, pointer: PointerValue): TreeNode | null {
  if (pointer.kind !== 'node') return null
  const node = getNode(recorder.state, pointer.id)
  return node && !node.freed ? node : null
}

function nodeValue(node: TreeNode): number | null {
  return node.payload.kind === 'int' ? node.payload.value : null
}

function samePointer(a: PointerValue, b: PointerValue): boolean {
  if (a.kind === 'node' && b.kind === 'node') return a.id === b.id
  return a.kind === b.kind
}

function createNode(recorder: TreeRecorder, value: number): number {
  recorder.pushFrame(
    'creerNoeud',
    { numero: intValue(value), nouveau: { kind: 'uninit' } },
    `creerNoeud(${value})`,
  )
  recorder.step('creerNoeud', 0, fr.abr.captions.createEntry(value))
  const node = recorder.allocateNode()
  recorder.setLocal('nouveau', NODE_POINTER(node.id))
  recorder.step('creerNoeud', 1, fr.abr.captions.allocated(node.address))
  recorder.setPayload(node.id, value)
  recorder.step('creerNoeud', 2, fr.abr.captions.assignValue(value))
  recorder.setChild(node.id, 'gauche', NULL_POINTER)
  recorder.step('creerNoeud', 3, fr.abr.captions.initChild('gauche'))
  recorder.setChild(node.id, 'droit', NULL_POINTER)
  recorder.step('creerNoeud', 4, fr.abr.captions.initChild('droit'))
  recorder.step('creerNoeud', 5, fr.abr.captions.returnCreated(value))
  recorder.popFrame()
  return node.id
}

function rechercherABR(
  recorder: TreeRecorder,
  pointer: PointerValue,
  wanted: number,
  nullSlot: TreeCallSlot | null = null,
): boolean {
  const isNull = pointer.kind !== 'node'
  recorder.pushFrame(
    'rechercherABR',
    { n: pointer, valeur: intValue(wanted) },
    `rechercherABR(${callArgument(recorder.state, pointer)}, ${wanted})`,
  )
  recorder.pushCallFrame('rechercherABR', pointer, ['comparaison'], nullSlot)
  recorder.pauseCall(0)
  recorder.step('rechercherABR', 0, fr.abr.captions.searchCall(callTarget(recorder.state, pointer)))
  recorder.pauseCall(1)
  recorder.step('rechercherABR', 1, fr.abr.captions.searchNullTest(isNull), {
    cond: { expr: 'n == NULL', result: isNull },
  })
  if (isNull) {
    recorder.addConsole(fr.abr.console.absent(wanted))
    recorder.step('rechercherABR', 1, fr.abr.captions.searchAbsent(wanted))
    recorder.popCallFrame()
    recorder.popFrame()
    return false
  }
  const node = liveNode(recorder, pointer)
  const value = node ? nodeValue(node) : null
  if (!node || value === null) {
    recorder.step('rechercherABR', 0, fr.abr.captions.invalidNode)
    recorder.popCallFrame()
    recorder.popFrame()
    return false
  }

  recorder.recordVisit(node.id)
  recorder.incrementComparisons()
  const equal = wanted === value
  recorder.beginPhase('comparaison', 2)
  recorder.step('rechercherABR', 2, fr.abr.captions.searchEqual(wanted, value, equal), {
    cond: { expr: 'valeur == n->valeur', result: equal },
  })
  recorder.completePhase('comparaison')
  if (equal) {
    recorder.addConsole(fr.abr.console.found(wanted))
    recorder.step('rechercherABR', 2, fr.abr.captions.searchFound(wanted))
    recorder.popCallFrame()
    recorder.popFrame()
    return true
  }

  recorder.incrementComparisons()
  const goLeft = wanted < value
  recorder.beginPhase('comparaison', 3)
  recorder.step('rechercherABR', 3, fr.abr.captions.searchDirection(wanted, value, goLeft), {
    cond: { expr: 'valeur < n->valeur', result: goLeft },
  })
  recorder.completePhase('comparaison')
  const field = goLeft ? 'gauche' : 'droit'
  const line = goLeft ? 4 : 6
  recorder.pauseCall(line, goLeft ? 'wait-left' : 'wait-right')
  recorder.step('rechercherABR', line, fr.abr.captions.searchRecurse(field, value))
  const found = rechercherABR(recorder, node[field], wanted, { parentId: node.id, field })
  recorder.pauseCall(line)
  recorder.step('rechercherABR', line, fr.abr.captions.searchReturn(wanted, found))
  recorder.popCallFrame()
  recorder.popFrame()
  return found
}

function insererABR(
  recorder: TreeRecorder,
  pointer: PointerValue,
  wanted: number,
  nullSlot: TreeCallSlot | null = null,
): PointerValue {
  const isNull = pointer.kind !== 'node'
  recorder.pushFrame(
    'insererABR',
    { n: pointer, valeur: intValue(wanted) },
    `insererABR(${callArgument(recorder.state, pointer)}, ${wanted})`,
  )
  recorder.pushCallFrame('insererABR', pointer, ['comparaison', 'gauche', 'droit'], nullSlot)
  recorder.pauseCall(0)
  recorder.step('insererABR', 0, fr.abr.captions.insertCall(callTarget(recorder.state, pointer)))
  recorder.pauseCall(1)
  recorder.step('insererABR', 1, fr.abr.captions.insertNullTest(isNull), {
    cond: { expr: 'n == NULL', result: isNull },
  })
  if (isNull) {
    recorder.step('insererABR', 1, fr.abr.captions.insertSlot(wanted))
    const id = createNode(recorder, wanted)
    recorder.step('insererABR', 1, fr.abr.captions.insertCreated(wanted))
    recorder.popCallFrame()
    recorder.popFrame()
    return NODE_POINTER(id)
  }
  const node = liveNode(recorder, pointer)
  const value = node ? nodeValue(node) : null
  if (!node || value === null) {
    recorder.step('insererABR', 0, fr.abr.captions.invalidNode)
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }

  recorder.recordVisit(node.id)
  recorder.incrementComparisons()
  const less = wanted < value
  recorder.beginPhase('comparaison', 2)
  recorder.step('insererABR', 2, fr.abr.captions.insertCompare(wanted, value, less), {
    cond: { expr: 'valeur < n->valeur', result: less },
  })
  recorder.completePhase('comparaison')
  if (wanted === value) {
    recorder.incrementComparisons()
    recorder.beginPhase('comparaison', 4)
    recorder.step('insererABR', 4, fr.abr.captions.insertDuplicateTest(wanted, value), {
      cond: { expr: 'valeur > n->valeur', result: false },
    })
    recorder.completePhase('comparaison')
    recorder.step('insererABR', 7, fr.abr.captions.insertDuplicate(wanted))
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }

  if (less) {
    recorder.beginPhase('gauche', 3, 'wait-left')
    recorder.step('insererABR', 3, fr.abr.captions.insertRecurse('gauche', value))
    const returned = insererABR(recorder, node.gauche, wanted, { parentId: node.id, field: 'gauche' })
    recorder.setChild(node.id, 'gauche', returned)
    recorder.step('insererABR', 3, fr.abr.captions.insertReassign('gauche', value))
    recorder.completePhase('gauche')
  } else {
    recorder.incrementComparisons()
    recorder.beginPhase('comparaison', 4)
    recorder.step('insererABR', 4, fr.abr.captions.insertGreaterTest(wanted, value), {
      cond: { expr: 'valeur > n->valeur', result: true },
    })
    recorder.completePhase('comparaison')
    recorder.beginPhase('droit', 5, 'wait-right')
    recorder.step('insererABR', 5, fr.abr.captions.insertRecurse('droit', value))
    const returned = insererABR(recorder, node.droit, wanted, { parentId: node.id, field: 'droit' })
    recorder.setChild(node.id, 'droit', returned)
    recorder.step('insererABR', 5, fr.abr.captions.insertReassign('droit', value))
    recorder.completePhase('droit')
  }

  recorder.pauseCall(7)
  recorder.step('insererABR', 7, fr.abr.captions.insertReturn(value))
  recorder.popCallFrame()
  recorder.popFrame()
  return pointer
}

function inscrireEtudiant(recorder: TreeRecorder, numero: number): void {
  recorder.pushFrame('inscrireEtudiant', { numero: intValue(numero) }, `inscrireEtudiant(${numero})`)
  recorder.step('inscrireEtudiant', 0, fr.abr.captions.insertEntry(numero))
  if (countTreeNodes(recorder.state) >= recorder.state.maxNodes) {
    recorder.step('inscrireEtudiant', 1, fr.abr.captions.maxNodes(recorder.state.maxNodes))
    recorder.popFrame()
    return
  }
  const root = rootPointer(recorder.state)
  recorder.step('inscrireEtudiant', 1, fr.abr.captions.insertWrapper(numero))
  const returned = insererABR(recorder, root, numero)
  if (!samePointer(root, returned)) recorder.setGlobal('racine', returned)
  recorder.step(
    'inscrireEtudiant',
    1,
    fr.abr.captions.insertRoot(
      callArgument(recorder.state, returned),
      callArgument(recorder.state, root),
    ),
  )
  recorder.step('inscrireEtudiant', 2, fr.abr.captions.insertDone(numero))
  recorder.popFrame()
}

export function runEstInscrit(
  state: TreeSnapshot,
  params: ParamValues,
): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  recorder.beginTraversal()
  const numero = Number(params.numero)
  recorder.pushFrame('estInscrit', { numero: intValue(numero) }, `estInscrit(${numero})`)
  recorder.step('estInscrit', 0, fr.abr.captions.searchEntry(numero))
  const root = rootPointer(recorder.state)
  if (root.kind === 'node' && !liveNode(recorder, root)) {
    recorder.step('estInscrit', 1, fr.abr.captions.rootFreed)
    recorder.popFrame()
    return recorder.steps
  }
  recorder.step('estInscrit', 1, fr.abr.captions.searchWrapper(numero))
  const found = rechercherABR(recorder, root, numero)
  recorder.step('estInscrit', 2, fr.abr.captions.searchDone(numero, found))
  recorder.popFrame()
  return recorder.steps
}

export function runInscrireEtudiant(
  state: TreeSnapshot,
  params: ParamValues,
): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  recorder.beginTraversal()
  const numero = Number(params.numero)
  const root = rootPointer(recorder.state)
  if (root.kind === 'node' && !liveNode(recorder, root)) {
    recorder.step('inscrireEtudiant', 1, fr.abr.captions.rootFreed)
    return recorder.steps
  }
  inscrireEtudiant(recorder, numero)
  return recorder.steps
}

const REGISTRE = [205, 150, 260, 120, 180, 240, 280]

export function runConstruireRegistre(state: TreeSnapshot): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  recorder.beginTraversal()
  const root = rootPointer(recorder.state)
  if (root.kind === 'node') {
    recorder.step(
      'construireRegistre',
      0,
      liveNode(recorder, root)
        ? fr.abr.captions.registerAlready
        : fr.abr.captions.rootFreed,
    )
    return recorder.steps
  }
  recorder.pushFrame('construireRegistre', {}, 'construireRegistre()')
  recorder.step('construireRegistre', 0, fr.abr.captions.registerEntry)
  REGISTRE.forEach((numero, index) => {
    recorder.step('construireRegistre', index + 1, fr.abr.captions.registerCall(numero))
    inscrireEtudiant(recorder, numero)
  })
  recorder.step(
    'construireRegistre',
    8,
    fr.abr.captions.registerDone(inorderValues(recorder.state).join(' ')),
  )
  recorder.popFrame()
  return recorder.steps
}

function trouverMin(recorder: TreeRecorder, pointer: PointerValue): number | null {
  const node = liveNode(recorder, pointer)
  if (!node) return null
  recorder.pushFrame(
    'trouverMin',
    { n: pointer },
    `trouverMin(${callArgument(recorder.state, pointer)})`,
  )
  recorder.pushCallFrame('trouverMin', pointer, ['minimum'])
  recorder.pauseCall(0)
  recorder.step('trouverMin', 0, fr.abr.captions.minEntry(nodeValue(node) ?? 0))
  let current = node
  let value = nodeValue(current) ?? 0
  let hasLeft = liveNode(recorder, current.gauche) !== null
  recorder.setCallNode(current.id, 1)
  recorder.beginPhase('minimum', 1)
  recorder.step('trouverMin', 1, fr.abr.captions.minLoop(value, hasLeft), {
    cond: { expr: 'n->gauche != NULL', result: hasLeft },
  })
  while (hasLeft) {
    const next = liveNode(recorder, current.gauche)
    if (!next) break
    current = next
    value = nodeValue(current) ?? 0
    recorder.setLocal('n', NODE_POINTER(current.id))
    recorder.setCallNode(current.id, 2)
    recorder.step('trouverMin', 2, fr.abr.captions.minDescend(value))
    hasLeft = liveNode(recorder, current.gauche) !== null
    recorder.setCallNode(current.id, 1)
    recorder.step('trouverMin', 1, fr.abr.captions.minLoop(value, hasLeft), {
      cond: { expr: 'n->gauche != NULL', result: hasLeft },
    })
  }
  recorder.completePhase('minimum')
  recorder.pauseCall(4)
  recorder.step('trouverMin', 4, fr.abr.captions.minFound(value))
  recorder.popCallFrame()
  recorder.popFrame()
  return current.id
}

function supprimerABR(
  recorder: TreeRecorder,
  pointer: PointerValue,
  wanted: number,
  nullSlot: TreeCallSlot | null = null,
): PointerValue {
  const isNull = pointer.kind !== 'node'
  recorder.pushFrame(
    'supprimerABR',
    { n: pointer, valeur: intValue(wanted) },
    `supprimerABR(${callArgument(recorder.state, pointer)}, ${wanted})`,
  )
  recorder.pushCallFrame(
    'supprimerABR',
    pointer,
    ['comparaison', 'suppression', 'minimum'],
    nullSlot,
  )
  recorder.pauseCall(0)
  recorder.step('supprimerABR', 0, fr.abr.captions.deleteCall(callTarget(recorder.state, pointer)))
  recorder.pauseCall(1)
  recorder.step('supprimerABR', 1, fr.abr.captions.deleteNullTest(isNull), {
    cond: { expr: 'n == NULL', result: isNull },
  })
  if (isNull) {
    recorder.step('supprimerABR', 1, fr.abr.captions.deleteAbsent(wanted))
    recorder.popCallFrame()
    recorder.popFrame()
    return NULL_POINTER
  }
  const node = liveNode(recorder, pointer)
  const value = node ? nodeValue(node) : null
  if (!node || value === null) {
    recorder.step('supprimerABR', 0, fr.abr.captions.invalidNode)
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }

  recorder.recordVisit(node.id)
  recorder.incrementComparisons()
  const less = wanted < value
  recorder.beginPhase('comparaison', 2)
  recorder.step('supprimerABR', 2, fr.abr.captions.deleteCompare(wanted, value, less), {
    cond: { expr: 'valeur < n->valeur', result: less },
  })
  recorder.completePhase('comparaison')
  if (less) {
    recorder.pauseCall(2, 'wait-left')
    recorder.step('supprimerABR', 2, fr.abr.captions.deleteRecurse('gauche', value))
    const returned = supprimerABR(recorder, node.gauche, wanted, {
      parentId: node.id,
      field: 'gauche',
    })
    recorder.setChild(node.id, 'gauche', returned)
    recorder.pauseCall(2)
    recorder.step('supprimerABR', 2, fr.abr.captions.deleteReassign('gauche', value))
    recorder.pauseCall(23)
    recorder.step('supprimerABR', 23, fr.abr.captions.deleteReturn(value))
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }

  recorder.incrementComparisons()
  const greater = wanted > value
  recorder.beginPhase('comparaison', 3)
  recorder.step('supprimerABR', 3, fr.abr.captions.deleteGreater(wanted, value, greater), {
    cond: { expr: 'valeur > n->valeur', result: greater },
  })
  recorder.completePhase('comparaison')
  if (greater) {
    recorder.pauseCall(3, 'wait-right')
    recorder.step('supprimerABR', 3, fr.abr.captions.deleteRecurse('droit', value))
    const returned = supprimerABR(recorder, node.droit, wanted, {
      parentId: node.id,
      field: 'droit',
    })
    recorder.setChild(node.id, 'droit', returned)
    recorder.pauseCall(3)
    recorder.step('supprimerABR', 3, fr.abr.captions.deleteReassign('droit', value))
    recorder.pauseCall(23)
    recorder.step('supprimerABR', 23, fr.abr.captions.deleteReturn(value))
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }

  recorder.beginPhase('suppression', 4)
  recorder.step('supprimerABR', 4, fr.abr.captions.deleteFound(wanted), {
    badge: 'cas-particulier',
  })
  const left = liveNode(recorder, node.gauche)
  const right = liveNode(recorder, node.droit)
  if (!left && !right) {
    recorder.pauseCall(5)
    recorder.step('supprimerABR', 5, fr.abr.captions.deleteLeafTest(wanted), {
      cond: { expr: 'n->gauche == NULL && n->droit == NULL', result: true },
    })
    recorder.freeNode(node.id)
    recorder.step('supprimerABR', 6, fr.abr.captions.deleteFree(wanted))
    recorder.completePhase('suppression')
    recorder.pauseCall(7)
    recorder.step('supprimerABR', 7, fr.abr.captions.deleteReturnNull)
    recorder.popCallFrame()
    recorder.popFrame()
    return NULL_POINTER
  }
  if (!left) {
    recorder.pauseCall(9)
    recorder.step('supprimerABR', 9, fr.abr.captions.deleteLeftNullTest, {
      cond: { expr: 'n->gauche == NULL', result: true },
    })
    recorder.declareLocal('temp', node.droit)
    recorder.step('supprimerABR', 10, fr.abr.captions.deleteTemp('droit'))
    recorder.freeNode(node.id)
    recorder.step('supprimerABR', 11, fr.abr.captions.deleteFree(wanted))
    recorder.completePhase('suppression')
    recorder.pauseCall(12)
    recorder.step('supprimerABR', 12, fr.abr.captions.deleteReturnChild)
    recorder.popCallFrame()
    recorder.popFrame()
    return node.droit
  }
  if (!right) {
    recorder.pauseCall(14)
    recorder.step('supprimerABR', 14, fr.abr.captions.deleteRightNullTest, {
      cond: { expr: 'n->droit == NULL', result: true },
    })
    recorder.declareLocal('temp', node.gauche)
    recorder.step('supprimerABR', 15, fr.abr.captions.deleteTemp('gauche'))
    recorder.freeNode(node.id)
    recorder.step('supprimerABR', 16, fr.abr.captions.deleteFree(wanted))
    recorder.completePhase('suppression')
    recorder.pauseCall(17)
    recorder.step('supprimerABR', 17, fr.abr.captions.deleteReturnChild)
    recorder.popCallFrame()
    recorder.popFrame()
    return node.gauche
  }

  recorder.beginPhase('minimum', 19)
  recorder.pauseCall(19)
  recorder.step('supprimerABR', 19, fr.abr.captions.deleteSuccessorCall(wanted))
  const successorId = trouverMin(recorder, node.droit)
  if (successorId === null) {
    recorder.step('supprimerABR', 19, fr.abr.captions.invalidNode)
    recorder.popCallFrame()
    recorder.popFrame()
    return pointer
  }
  const successor = requireNode(recorder.state, successorId)
  const successorValue = nodeValue(successor) ?? 0
  recorder.completePhase('minimum')
  recorder.step('supprimerABR', 19, fr.abr.captions.deleteSuccessor(successorValue))
  recorder.pauseCall(20)
  recorder.setPayload(node.id, successorValue)
  recorder.step('supprimerABR', 20, fr.abr.captions.deleteCopy(wanted, successorValue), {
    badge: 'cas-particulier',
  })
  recorder.pauseCall(21)
  recorder.step('supprimerABR', 21, fr.abr.captions.deleteSuccessorRecurse(successorValue))
  const returned = supprimerABR(recorder, node.droit, successorValue, {
    parentId: node.id,
    field: 'droit',
  })
  recorder.setChild(node.id, 'droit', returned)
  recorder.pauseCall(21)
  recorder.step('supprimerABR', 21, fr.abr.captions.deleteReassign('droit', successorValue))
  recorder.completePhase('suppression')
  recorder.pauseCall(23)
  recorder.step('supprimerABR', 23, fr.abr.captions.deleteReturn(successorValue))
  recorder.popCallFrame()
  recorder.popFrame()
  return pointer
}

function radierEtudiant(recorder: TreeRecorder, numero: number): void {
  const root = rootPointer(recorder.state)
  recorder.pushFrame('radierEtudiant', { numero: intValue(numero) }, `radierEtudiant(${numero})`)
  recorder.step('radierEtudiant', 0, fr.abr.captions.deleteEntry(numero))
  recorder.step('radierEtudiant', 1, fr.abr.captions.deleteWrapper(numero))
  const returned = supprimerABR(recorder, root, numero)
  if (!samePointer(root, returned)) recorder.setGlobal('racine', returned)
  recorder.step(
    'radierEtudiant',
    1,
    fr.abr.captions.deleteRoot(
      callArgument(recorder.state, returned),
      callArgument(recorder.state, root),
    ),
  )
  recorder.step('radierEtudiant', 2, fr.abr.captions.deleteDone(numero))
  recorder.popFrame()
}

export function runRadierEtudiant(
  state: TreeSnapshot,
  params: ParamValues,
): Step<TreeSnapshot>[] {
  const recorder = new TreeRecorder(state)
  recorder.beginTraversal()
  const numero = Number(params.numero)
  const root = rootPointer(recorder.state)
  if (root.kind === 'node' && !liveNode(recorder, root)) {
    recorder.step('radierEtudiant', 1, fr.abr.captions.rootFreed)
    return recorder.steps
  }
  radierEtudiant(recorder, numero)
  return recorder.steps
}

const numeroParam = (defaultValue: number): OperationDef<TreeSnapshot>['params'] => [
  {
    name: 'numero',
    kind: 'number',
    label: fr.abr.params.numero,
    defaultValue,
    target: true,
  },
]

const noParams: OperationDef<TreeSnapshot>['params'] = []

function defineOperation(
  id: keyof typeof fr.abr.operations,
  run: (state: TreeSnapshot, params: ParamValues) => Step<TreeSnapshot>[],
  options: { params?: OperationDef<TreeSnapshot>['params']; inserts?: boolean } = {},
): OperationDef<TreeSnapshot> {
  return {
    id,
    label: fr.abr.operations[id].label,
    params: options.params ?? noParams,
    complexity: fr.abr.operations[id].complexity,
    complexityNote: fr.abr.operations[id].note,
    inserts: options.inserts ?? false,
    showCallStack: true,
    run,
  }
}

export const abrOperations: OperationDef<TreeSnapshot>[] = [
  defineOperation('construireRegistre', runConstruireRegistre, { inserts: true }),
  defineOperation('estInscrit', runEstInscrit, { params: numeroParam(180) }),
  defineOperation('inscrireEtudiant', runInscrireEtudiant, {
    params: numeroParam(200),
    inserts: true,
  }),
  defineOperation('radierEtudiant', runRadierEtudiant, { params: numeroParam(205) }),
  defineOperation('parcoursInfixe', (state) => runParcoursInfixe(state)),
]
