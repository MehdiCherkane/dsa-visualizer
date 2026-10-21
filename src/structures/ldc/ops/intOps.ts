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
import type { LdcSnapshot } from '../memory'
import { Recorder } from './runtime'

const L = intLabels

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
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(next)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', next)],
  })

  const newHead = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifNewHead.line,
    'debut != NULL',
    newHead.kind === 'node',
    newHead.kind === 'node'
      ? fr.captions.reasonPointer('debut', r.describe(newHead))
      : fr.captions.reasonListEmpty,
  )
  if (newHead.kind === 'node') {
    r.setPointer(newHead.id, 'precedent', { kind: 'null' })
    r.step(fn, fnLabels.newHeadPrecNull.line, fr.captions.newHeadPrecedentNull)
  }

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

function bodyInsererEnTete(r: Recorder, valeur: number): void {
  const fn = 'insererEnTete'
  const fnLabels = L.insererEnTete
  const id = r.mallocNode(0)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

  const oldDebut = r.global('debut')
  r.setPointer(id, 'suivant', oldDebut)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(oldDebut)), {
    evals: [r.makeEval('debut', oldDebut)],
  })

  r.setPointer(id, 'precedent', { kind: 'null' })
  r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignField(id, 'precedent', fr.common.null))

  conditionStep(
    r,
    fn,
    fnLabels.ifDebut.line,
    'debut != NULL',
    oldDebut.kind === 'node',
    oldDebut.kind === 'node' ? fr.captions.reasonDebutNotNull : fr.captions.reasonDebutNull,
  )

  if (oldDebut.kind === 'node') {
    r.setPointer(oldDebut.id, 'precedent', newPointer)
    r.step(
      fn,
      fnLabels.linkOldHead.line,
      fr.captions.assignField(oldDebut.id, 'precedent', r.describe(newPointer)),
      { evals: [r.makeEval('debut', oldDebut)] },
    )
  }

  r.setGlobal('debut', newPointer)
  r.insertRowNode(id, 0)
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(newPointer)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('nouveau', newPointer)],
  })
}

function callInsererEnTete(r: Recorder, valeur: number): void {
  const fn = 'insererEnTete'
  const fnLabels = L.insererEnTete
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyInsererEnTete(r, valeur)
  r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
}

export function runAfficherListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
      hasNode ? fr.captions.reasonPointer('courant', r.describe(courant)) : fr.captions.reasonNull('courant'),
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

export function runAfficherListeEnvers(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'afficherListeEnvers'
  const fnLabels = L.afficherListeEnvers
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'courant == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (debut.kind === 'null') {
    r.addConsole('\n')
    r.step(fn, fnLabels.printfNewline.line, fr.captions.printfNewline)
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const hasNext = Boolean(node && node.suivant.kind !== 'null')
    conditionStep(
      r,
      fn,
      fnLabels.forwardWhile.line,
      'courant->suivant != NULL',
      hasNext,
      node
        ? hasNext
          ? fr.captions.reasonHasNext(node.id)
          : fr.captions.reasonNoNext(node.id)
        : fr.captions.reasonNull('courant'),
    )
    if (!node || !hasNext) break
    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.forwardAdvance.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })
  }

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const hasNode = courant.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.backWhile.line,
      'courant != NULL',
      hasNode,
      hasNode ? fr.captions.reasonPointer('courant', r.describe(courant)) : fr.captions.reasonNull('courant'),
    )
    if (!hasNode) break

    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0
    r.addConsole(`${value} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfInt(value))

    const previous = r.node(courant.id).precedent
    r.setLocal('courant', previous)
    r.incrementTraversed()
    r.step(fn, fnLabels.backAdvance.line, fr.captions.advancePrevious('courant', r.describe(previous)), {
      evals: [r.makeEval('courant->precedent', previous)],
    })
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runInsererEnTete(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'insererEnTete'
  const fnLabels = L.insererEnTete
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyInsererEnTete(r, valeur)
  return r.finish(fn, fnLabels.end.line)
}

export function runInsererEnFin(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'insererEnFin'
  const fnLabels = L.insererEnFin
  const valeur = numberParam(params, 'valeur')
  const rowCount = r0RowCount(state)
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(rowCount)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

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
    r.setPointer(id, 'precedent', { kind: 'null' })
    r.step(fn, fnLabels.setPrecedentNull.line, fr.captions.assignField(id, 'precedent', fr.common.null))

    r.setGlobal('debut', newPointer)
    r.insertRowNode(id, 0)
    r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(newPointer)), {
      badge: 'debut-modifie',
    })

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
  const last = r.node(courant.id)

  r.setPointer(last.id, 'suivant', newPointer)
  r.insertRowNode(id, rowCount)
  r.step(fn, fnLabels.linkLast.line, fr.captions.tailLink, {
    evals: [r.makeEval('courant', courant)],
  })

  r.setPointer(id, 'precedent', courant)
  r.step(fn, fnLabels.setNewPrecedent.line, fr.captions.assignField(id, 'precedent', r.describe(courant)), {
    evals: [r.makeEval('courant', courant)],
  })

  return r.finish(fn, fnLabels.end.line)
}

function r0RowCount(state: LdcSnapshot): number {
  return state.nodes.filter((node) => node.lane === 'row').length
}

export function runInsererApresValeur(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'insererApresValeur'
  const fnLabels = L.insererApresValeur
  const apres = numberParam(params, 'apres')
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, {
    apres: { kind: 'int', value: apres },
    valeur: { kind: 'int', value: valeur },
  })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const value = node ? payloadKey(node) : null
    const result = Boolean(node && value !== apres)
    const reason = !node
      ? fr.captions.reasonNotFound(apres)
      : value === apres
        ? fr.captions.reasonValueEquals(node.id, value ?? 0, apres)
        : fr.captions.reasonValueDiffers(node.id, value ?? 0, apres)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL && courant->valeur != apres',
      result,
      reason,
    )
    if (!node || !result) break
    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const found = pointerOf(r.local('courant'))
  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'courant == NULL',
    found.kind === 'null',
    found.kind === 'null' ? fr.captions.reasonNotFound(apres) : fr.captions.reasonFound(apres),
  )
  if (found.kind === 'null') {
    r.step(fn, fnLabels.returnNotFound.line, fr.captions.notFoundNothing(apres))
    return r.finish(fn, fnLabels.end.line)
  }

  const courantNode = r.node(found.id)
  const targetSlot = courantNode.slot + 1
  const id = r.mallocNode(targetSlot)
  const newNode = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, newNode.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

  const next = r.node(found.id).suivant
  r.setPointer(id, 'suivant', next)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(next)), {
    evals: [r.makeEval('courant->suivant', next)],
  })

  r.setPointer(id, 'precedent', found)
  r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignField(id, 'precedent', r.describe(found)), {
    evals: [r.makeEval('courant', found)],
  })

  conditionStep(
    r,
    fn,
    fnLabels.ifNext.line,
    'courant->suivant != NULL',
    next.kind === 'node',
    next.kind === 'node' ? fr.captions.reasonNextExists : fr.captions.reasonNextNull,
  )

  if (next.kind === 'node') {
    r.setPointer(next.id, 'precedent', newPointer)
    r.step(
      fn,
      fnLabels.linkNextPrec.line,
      fr.captions.assignField(next.id, 'precedent', r.describe(newPointer)),
      { evals: [r.makeEval('courant->suivant', next)] },
    )
  }

  r.setPointer(found.id, 'suivant', newPointer)
  r.insertRowNode(id, targetSlot)
  r.step(fn, fnLabels.linkAfter.line, fr.captions.insertedAfter, {
    evals: [r.makeEval('courant', found)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runInsererAvantValeur(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'insererAvantValeur'
  const fnLabels = L.insererAvantValeur
  const avant = numberParam(params, 'avant')
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, {
    avant: { kind: 'int', value: avant },
    valeur: { kind: 'int', value: valeur },
  })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const value = node ? payloadKey(node) : null
    const result = Boolean(node && value !== avant)
    const reason = !node
      ? fr.captions.reasonNotFound(avant)
      : value === avant
        ? fr.captions.reasonValueEquals(node.id, value ?? 0, avant)
        : fr.captions.reasonValueDiffers(node.id, value ?? 0, avant)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL && courant->valeur != avant',
      result,
      reason,
    )
    if (!node || !result) break
    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const found = pointerOf(r.local('courant'))
  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'courant == NULL',
    found.kind === 'null',
    found.kind === 'null' ? fr.captions.reasonNotFound(avant) : fr.captions.reasonFound(avant),
  )
  if (found.kind === 'null') {
    r.step(fn, fnLabels.returnNotFound.line, fr.captions.notFoundNothing(avant))
    return r.finish(fn, fnLabels.end.line)
  }

  const head = r.global('debut')
  const isHead = head.kind === 'node' && head.id === found.id
  conditionStep(
    r,
    fn,
    fnLabels.ifHead.line,
    'courant == debut',
    isHead,
    isHead ? fr.captions.reasonHead('courant') : fr.captions.reasonNotHead('courant'),
    isHead ? 'cas-particulier' : undefined,
  )

  if (isHead) {
    r.step(fn, fnLabels.callHead.line, fr.captions.call('insererEnTete'))
    callInsererEnTete(r, valeur)
    r.step(fn, fnLabels.returnAfterCall.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const courantNode = r.node(found.id)
  const previous = courantNode.precedent
  if (previous.kind !== 'node') throw new Error('courant should have a previous node')
  const targetSlot = courantNode.slot
  const id = r.mallocNode(targetSlot)
  const newNode = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, newNode.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

  r.setPointer(id, 'suivant', found)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(found)), {
    evals: [r.makeEval('courant', found)],
  })

  const previousPointer = r.node(found.id).precedent
  r.setPointer(id, 'precedent', previousPointer)
  r.step(
    fn,
    fnLabels.setPrecedent.line,
    fr.captions.assignField(id, 'precedent', r.describe(previousPointer)),
    { evals: [r.makeEval('courant->precedent', previousPointer)] },
  )

  r.setPointer(previous.id, 'suivant', newPointer)
  r.insertRowNode(id, targetSlot)
  r.step(
    fn,
    fnLabels.linkPrevNext.line,
    fr.captions.insertedBefore,
    { evals: [r.makeEval('courant->precedent', previousPointer)] },
  )

  r.setPointer(found.id, 'precedent', newPointer)
  r.step(
    fn,
    fnLabels.linkCourantPrec.line,
    fr.captions.assignField(found.id, 'precedent', r.describe(newPointer)),
    { evals: [r.makeEval('courant', found)] },
  )

  return r.finish(fn, fnLabels.end.line)
}

export function runSupprimerEnTete(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodySupprimerEnTete(r)
  return r.finish(fn, fnLabels.end.line)
}

export function runSupprimerValeur(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'supprimerValeur'
  const fnLabels = L.supprimerValeur
  const valeur = numberParam(params, 'valeur')
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

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
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const found = pointerOf(r.local('courant'))
  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'courant == NULL',
    found.kind === 'null',
    found.kind === 'null' ? fr.captions.reasonNotFound(valeur) : fr.captions.reasonFound(valeur),
  )
  if (found.kind === 'null') {
    r.step(fn, fnLabels.returnNotFound.line, fr.captions.notFoundNothing(valeur))
    return r.finish(fn, fnLabels.end.line)
  }

  const head = r.global('debut')
  const isHead = head.kind === 'node' && head.id === found.id
  conditionStep(
    r,
    fn,
    fnLabels.ifHead.line,
    'courant == debut',
    isHead,
    isHead ? fr.captions.reasonHead('courant') : fr.captions.reasonNotHead('courant'),
    isHead ? 'cas-particulier' : undefined,
  )

  if (isHead) {
    r.step(fn, fnLabels.callHead.line, fr.captions.call('supprimerEnTete'))
    callSupprimerEnTete(r)
    r.step(fn, fnLabels.returnAfterCall.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const courantNode = r.node(found.id)
  const previous = courantNode.precedent
  const next = courantNode.suivant
  if (previous.kind !== 'node') throw new Error('courant should have a previous node')

  r.setPointer(previous.id, 'suivant', next)
  r.step(
    fn,
    fnLabels.unlinkPrev.line,
    next.kind === 'null' ? fr.captions.removeLast : fr.captions.removeMiddle(courantNode.id),
    {
      evals: [
        r.makeEval('courant->precedent', previous),
        r.makeEval('courant->suivant', next),
      ],
    },
  )

  conditionStep(
    r,
    fn,
    fnLabels.ifNext.line,
    'courant->suivant != NULL',
    next.kind === 'node',
    next.kind === 'node' ? fr.captions.reasonNextExists : fr.captions.reasonNextNull,
  )

  if (next.kind === 'node') {
    r.setPointer(next.id, 'precedent', previous)
    r.step(
      fn,
      fnLabels.unlinkNext.line,
      fr.captions.assignField(next.id, 'precedent', r.describe(previous)),
      { evals: [r.makeEval('courant->suivant', next)] },
    )
  }

  r.freeNode(courantNode.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(courantNode.id))
  return r.finish(fn, fnLabels.end.line)
}

export function runRechercher(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
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
      hasNode ? fr.captions.reasonPointer('courant', r.describe(courant)) : fr.captions.reasonNull('courant'),
    )
    if (!hasNode) {
      r.setReturnValue(0)
      r.step(fn, fnLabels.returnZero.line, fr.captions.notFoundReturn)
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

export function runDetruireListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
      notEmpty ? fr.captions.reasonListNotEmpty : fr.captions.reasonListEmpty,
    )
    if (!notEmpty) break
    r.step(fn, fnLabels.callHead.line, fr.captions.call('supprimerEnTete'))
    callSupprimerEnTete(r)
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runInverserListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'inverserListe'
  const fnLabels = L.inverserListe
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  r.declareLocal('dernier', { kind: 'null' })
  r.step(fn, fnLabels.declDernier.line, fr.captions.declarePointer('dernier', fr.common.null))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const hasNode = courant.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL',
      hasNode,
      hasNode ? fr.captions.reasonPointer('courant', r.describe(courant)) : fr.captions.reasonNull('courant'),
    )
    if (!hasNode) break

    const node = r.node(courant.id)
    const oldNext = node.suivant
    const oldPrevious = node.precedent

    r.declareLocal('temp', oldNext)
    r.step(fn, fnLabels.declTemp.line, fr.captions.declarePointer('temp', r.describe(oldNext)), {
      evals: [r.makeEval('courant->suivant', oldNext)],
    })

    r.setPointer(courant.id, 'suivant', oldPrevious)
    r.step(fn, fnLabels.swapSuivant.line, fr.captions.swapFields(courant.id), {
      evals: [r.makeEval('courant->precedent', oldPrevious)],
    })

    r.setPointer(courant.id, 'precedent', oldNext)
    r.step(fn, fnLabels.swapPrecedent.line, fr.captions.swapFields(courant.id), {
      evals: [r.makeEval('temp', oldNext)],
    })

    r.setLocal('dernier', courant)
    r.step(fn, fnLabels.setDernier.line, fr.captions.assignPointerVar('dernier', r.describe(courant)))

    r.setLocal('courant', oldNext)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(oldNext)), {
      evals: [r.makeEval('temp', oldNext)],
    })
  }

  const last = pointerOf(r.local('dernier'))
  r.setGlobal('debut', last)
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(last)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('dernier', last)],
  })

  r.reverseRowLayout()
  r.step(fn, fnLabels.end.line, fr.captions.relayout)

  return r.finish(fn, fnLabels.end.line)
}
