import type {
  Badge,
  NodeOrNullPointer,
  ParamValues,
  PointerValue,
  Step,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { intLabels } from '../code/int'
import { payloadKey } from '../memory'
import type { LscSnapshot } from '../memory'
import { Recorder } from './runtime'

const L = intLabels
const C = fr.lsc.captions

function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function pointerOf(value: VarValue | undefined): NodeOrNullPointer {
  if (!value) return { kind: 'null' }
  if (value.kind === 'node' || value.kind === 'null') return value
  if (value.kind === 'uninit') return { kind: 'null' }
  throw new Error('Expected a pointer value')
}

function conditionStep(
  r: Recorder,
  fn: string,
  line: number,
  expr: string,
  result: boolean,
  reason: string,
  badge?: Badge,
): void {
  r.incrementComparisons()
  r.step(fn, line, fr.captions.condition(expr, result, reason), {
    cond: { expr, result },
    ...(badge ? { badge } : {}),
  })
}

function bodySupprimerEnTete(r: Recorder): boolean {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  const debut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )
  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return true
  }

  const oldHead = r.node(debut.id)
  r.declareLocal('ancienDebut', debut)
  r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(debut)))

  const next = oldHead.suivant
  r.setGlobal('debut', next)
  r.step(fn, fnLabels.setDebut.line, C.removeHead, {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', next)],
  })

  r.freeNode(oldHead.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(oldHead.id))
  return false
}

function callSupprimerEnTete(r: Recorder): void {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const returnedEarly = bodySupprimerEnTete(r)
  if (!returnedEarly) r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
}

export function runAfficherListe(state: LscSnapshot, _params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'afficherListe'
  const fnLabels = L.afficherListe
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const hasNode = courant.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL',
      hasNode,
      hasNode
        ? fr.captions.reasonPointer('courant', r.describe(courant))
        : fr.captions.reasonNull('courant'),
    )
    if (!hasNode) break

    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0
    r.addConsole(`${value} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfInt(value))

    const next = r.node(courant.id).suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runInsererEnTete(state: LscSnapshot, params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'insererEnTete'
  const fnLabels = L.insererEnTete
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(0)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, C.malloc(id, node.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

  const oldDebut = r.global('debut')
  r.setPointer(id, 'suivant', oldDebut)
  r.step(fn, fnLabels.setSuivant.line, C.insertHeadLink, {
    evals: [r.makeEval('debut', oldDebut)],
  })

  r.setGlobal('debut', newPointer)
  r.insertRowNode(id, 0)
  r.step(fn, fnLabels.setDebut.line, C.insertNewHead, {
    badge: 'debut-modifie',
    evals: [r.makeEval('nouveau', newPointer)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runInsererEnFin(state: LscSnapshot, params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'insererEnFin'
  const fnLabels = L.insererEnFin
  const valeur = numberParam(params, 'valeur')
  const rowCount = state.nodes.filter((node) => node.lane === 'row').length
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(rowCount)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, C.malloc(id, node.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

  r.setPointer(id, 'suivant', { kind: 'null' })
  r.step(fn, fnLabels.setSuivantNull.line, fr.captions.assignField(id, 'suivant', fr.common.null))

  const debut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifDebutNull.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (debut.kind === 'null') {
    r.setGlobal('debut', newPointer)
    r.insertRowNode(id, 0)
    r.step(fn, fnLabels.setDebut.line, C.insertTailEmpty, { badge: 'debut-modifie' })
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const currentNode = courant.kind === 'node' ? r.node(courant.id) : null
    const hasNext = Boolean(currentNode && currentNode.suivant.kind !== 'null')
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant->suivant != NULL',
      hasNext,
      currentNode
        ? hasNext
          ? fr.captions.reasonHasNext(currentNode.id)
          : fr.captions.reasonNoNext(currentNode.id)
        : fr.captions.reasonNull('courant'),
    )
    if (!currentNode || !hasNext) break
    const next = currentNode.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const courant = pointerOf(r.local('courant'))
  if (courant.kind !== 'node') throw new Error('courant should point to the last node')
  r.setPointer(courant.id, 'suivant', newPointer)
  r.insertRowNode(id, rowCount)
  r.step(fn, fnLabels.linkLast.line, C.insertTailLink, {
    evals: [r.makeEval('courant', courant)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runSupprimerEnTete(state: LscSnapshot, _params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodySupprimerEnTete(r)
  return r.finish(fn, fnLabels.end.line)
}

export function runSupprimerValeur(state: LscSnapshot, params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'supprimerValeur'
  const fnLabels = L.supprimerValeur
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )
  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, C.deleteEmpty)
    return r.finish(fn, fnLabels.end.line)
  }

  const head = r.node(debut.id)
  const headValue = payloadKey(head) ?? 0
  const isHead = headValue === valeur
  conditionStep(
    r,
    fn,
    fnLabels.ifHead.line,
    'debut->valeur == valeur',
    isHead,
    isHead
      ? fr.captions.reasonValueEquals(head.id, headValue, valeur)
      : fr.captions.reasonValueDiffers(head.id, headValue, valeur),
    isHead ? 'cas-particulier' : undefined,
  )

  if (isHead) {
    r.step(fn, fnLabels.callHead.line, fr.captions.call('supprimerEnTete'))
    callSupprimerEnTete(r)
    r.step(fn, fnLabels.returnAfterCall.line, C.afterHeadCall)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('precedent', debut)
  r.step(fn, fnLabels.declPrecedent.line, fr.captions.declarePointer('precedent', r.describe(debut)))

  const second = r.node(debut.id).suivant
  r.declareLocal('courant', second)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(second)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const value = node ? payloadKey(node) : null
    const result = Boolean(node && value !== valeur)
    const reason = !node
      ? fr.captions.reasonNotFound(valeur)
      : value === valeur
        ? fr.captions.reasonValueEquals(node.id, value ?? 0, valeur)
        : fr.captions.reasonValueDiffers(node.id, value ?? 0, valeur)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL && courant->valeur != valeur',
      result,
      reason,
    )
    if (!node || !result) break
    const next = node.suivant
    r.setLocal('precedent', courant)
    r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignPointerVar('precedent', r.describe(courant)))
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const found = pointerOf(r.local('courant'))
  const foundNode = found.kind === 'node' ? r.node(found.id) : null
  conditionStep(
    r,
    fn,
    fnLabels.ifFound.line,
    'courant != NULL',
    foundNode !== null,
    foundNode
      ? C.searchFound(foundNode.id, valeur)
      : C.deleteAbsent(valeur),
  )

  if (!foundNode) {
    return r.finish(fn, fnLabels.end.line)
  }

  const previous = pointerOf(r.local('precedent'))
  if (previous.kind !== 'node') throw new Error('precedent should point to a node')
  const next = foundNode.suivant
  r.setPointer(previous.id, 'suivant', next)
  r.step(fn, fnLabels.unlink.line, C.detachNode, {
    evals: [r.makeEval('courant->suivant', next)],
  })
  r.freeNode(foundNode.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(foundNode.id))

  return r.finish(fn, fnLabels.end.line)
}

export function runRechercher(state: LscSnapshot, params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'rechercher'
  const fnLabels = L.rechercher
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const hasNode = courant.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL',
      hasNode,
      hasNode
        ? fr.captions.reasonPointer('courant', r.describe(courant))
        : fr.captions.reasonNull('courant'),
    )
    if (!hasNode) {
      r.setReturnValue(0)
      r.step(fn, fnLabels.returnZero.line, C.searchNotFound(valeur))
      return r.finish(fn, fnLabels.end.line)
    }

    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0
    const equal = value === valeur
    conditionStep(
      r,
      fn,
      fnLabels.ifEqual.line,
      'courant->valeur == valeur',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, valeur)
        : fr.captions.reasonValueDiffers(node.id, value, valeur),
    )

    if (equal) {
      r.setReturnValue(1)
      r.step(fn, fnLabels.returnOne.line, fr.captions.foundReturn)
      return r.finish(fn, fnLabels.end.line)
    }

    const next = r.node(courant.id).suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }
}

export function runDetruireListe(state: LscSnapshot, _params: ParamValues): Step<LscSnapshot>[] {
  const fn = 'detruireListe'
  const fnLabels = L.detruireListe
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  for (;;) {
    const debut = r.global('debut')
    const notEmpty = debut.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'debut != NULL',
      notEmpty,
      notEmpty ? fr.captions.reasonListNotEmpty : C.destroyEmpty,
    )
    if (!notEmpty) break
    r.step(fn, fnLabels.callHead.line, fr.captions.call('supprimerEnTete'))
    callSupprimerEnTete(r)
    r.step(fn, fnLabels.endWhile.line, C.destroyHead)
  }

  return r.finish(fn, fnLabels.end.line)
}
