import type {
  Badge,
  NodeOrNullPointer,
  ParamValues,
  PointerValue,
  Step,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { circularLabels } from '../code/circular'
import { payloadKey } from '../memory'
import type { LscSnapshot } from '../memory'
import { Recorder } from './runtime'

const L = circularLabels
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

function bodyCircularSupprimerEnTete(r: Recorder): boolean {
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

  const head = r.node(debut.id)
  const single = head.suivant.kind === 'node' && head.suivant.id === head.id
  conditionStep(
    r,
    fn,
    fnLabels.ifSingle.line,
    'debut->suivant == debut',
    single,
    single ? C.circularSingle : C.circularMultiple,
  )

  if (single) {
    r.declareLocal('ancien', debut)
    r.step(fn, fnLabels.declSingle.line, fr.captions.declarePointer('ancien', r.describe(debut)))
    r.setGlobal('debut', { kind: 'null' })
    r.step(fn, fnLabels.setDebutNull.line, C.circularSingleRemove, { badge: 'debut-modifie' })
    r.freeNode(head.id)
    r.step(fn, fnLabels.freeSingle.line, fr.captions.freeNodeDangling(head.id))
    r.step(fn, fnLabels.returnSingle.line, fr.captions.returnVoid)
    return true
  }

  r.declareLocal('ancienDebut', debut)
  r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(debut)))
  r.declareLocal('dernier', debut)
  r.step(fn, fnLabels.declDernier.line, fr.captions.declarePointer('dernier', r.describe(debut)))

  for (;;) {
    const dernier = pointerOf(r.local('dernier'))
    const node = dernier.kind === 'node' ? r.node(dernier.id) : null
    const atLast = Boolean(node && node.suivant.kind === 'node' && node.suivant.id === debut.id)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'dernier->suivant != debut',
      !atLast,
      atLast ? C.circularLastFound : C.circularNotLast,
    )
    if (!node || atLast) break
    const next = node.suivant
    r.setLocal('dernier', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('dernier', r.describe(next)))
  }

  const dernier = pointerOf(r.local('dernier'))
  if (dernier.kind !== 'node') throw new Error('dernier should point to the last node')
  const newHead = r.node(debut.id).suivant
  r.setGlobal('debut', newHead)
  r.step(fn, fnLabels.setDebut.line, C.circularRemoveHead, {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', newHead)],
  })
  r.setPointer(dernier.id, 'suivant', newHead)
  r.step(fn, fnLabels.linkLast.line, C.circularRelinkLast, {
    evals: [r.makeEval('debut', newHead)],
  })
  r.freeNode(debut.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(debut.id))
  return false
}

function callCircularSupprimerEnTete(r: Recorder): void {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const returnedEarly = bodyCircularSupprimerEnTete(r)
  if (!returnedEarly) r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
}

export function runCircularAfficherListe(
  state: LscSnapshot,
  _params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'afficherListe'
  const fnLabels = L.afficherListe
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

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
    r.addConsole('\n')
    r.step(fn, fnLabels.printfNewline.line, fr.captions.printfNewline)
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))
  r.step(fn, fnLabels.do.line, C.circularLoopStart)

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0
    r.addConsole(`${value} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfInt(value))

    const next = r.node(courant.id).suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))

    const nextPointer = pointerOf(r.local('courant'))
    const backToDebut = nextPointer.kind === 'node' && nextPointer.id === debut.id
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !backToDebut,
      backToDebut ? C.circularStop : C.circularContinue,
    )
    if (backToDebut) break
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runCircularInsererEnTete(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
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
  conditionStep(
    r,
    fn,
    fnLabels.ifDebutNull.line,
    'debut == NULL',
    oldDebut.kind === 'null',
    oldDebut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (oldDebut.kind === 'null') {
    r.setPointer(id, 'suivant', newPointer)
    r.step(fn, fnLabels.setSelfSuivant.line, C.circularSelfLink)
    r.setGlobal('debut', newPointer)
    r.insertRowNode(id, 0)
    r.step(fn, fnLabels.setDebutEmpty.line, C.circularNewHead, { badge: 'debut-modifie' })
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('dernier', oldDebut)
  r.step(fn, fnLabels.declDernier.line, fr.captions.declarePointer('dernier', r.describe(oldDebut)))

  for (;;) {
    const dernier = pointerOf(r.local('dernier'))
    const current = dernier.kind === 'node' ? r.node(dernier.id) : null
    const atLast = Boolean(
      current && current.suivant.kind === 'node' && current.suivant.id === oldDebut.id,
    )
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'dernier->suivant != debut',
      !atLast,
      atLast ? C.circularLastFound : C.circularNotLast,
    )
    if (!current || atLast) break
    const next = current.suivant
    r.setLocal('dernier', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('dernier', r.describe(next)))
  }

  const dernier = pointerOf(r.local('dernier'))
  if (dernier.kind !== 'node') throw new Error('dernier should point to the last node')
  r.setPointer(id, 'suivant', oldDebut)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(oldDebut)), {
    evals: [r.makeEval('debut', oldDebut)],
  })
  r.setPointer(dernier.id, 'suivant', newPointer)
  r.step(fn, fnLabels.linkLast.line, C.circularLinkLast)
  r.setGlobal('debut', newPointer)
  r.insertRowNode(id, 0)
  r.step(fn, fnLabels.setDebut.line, C.circularNewHead, {
    badge: 'debut-modifie',
    evals: [r.makeEval('nouveau', newPointer)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runCircularInsererEnFin(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
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

  const oldDebut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifDebutNull.line,
    'debut == NULL',
    oldDebut.kind === 'null',
    oldDebut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (oldDebut.kind === 'null') {
    r.setPointer(id, 'suivant', newPointer)
    r.step(fn, fnLabels.setSelfSuivant.line, C.circularSelfLink)
    r.setGlobal('debut', newPointer)
    r.insertRowNode(id, 0)
    r.step(fn, fnLabels.setDebut.line, C.circularNewHead, { badge: 'debut-modifie' })
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', oldDebut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(oldDebut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const current = courant.kind === 'node' ? r.node(courant.id) : null
    const atLast = Boolean(
      current && current.suivant.kind === 'node' && current.suivant.id === oldDebut.id,
    )
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant->suivant != debut',
      !atLast,
      atLast ? C.circularLastFound : C.circularNotLast,
    )
    if (!current || atLast) break
    const next = current.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  const courant = pointerOf(r.local('courant'))
  if (courant.kind !== 'node') throw new Error('courant should point to the last node')
  r.setPointer(courant.id, 'suivant', newPointer)
  r.step(fn, fnLabels.linkLast.line, C.circularLinkLast)
  r.setPointer(id, 'suivant', oldDebut)
  r.insertRowNode(id, rowCount)
  r.step(fn, fnLabels.linkNew.line, C.circularClose, {
    evals: [r.makeEval('debut', oldDebut)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runCircularSupprimerEnTete(
  state: LscSnapshot,
  _params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyCircularSupprimerEnTete(r)
  return r.finish(fn, fnLabels.end.line)
}

export function runCircularSupprimerValeur(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
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

  r.declareLocal('precedent', { kind: 'null' })
  r.step(
    fn,
    fnLabels.declPrecedent.line,
    fr.captions.declarePointer('precedent', fr.common.null),
  )
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))
  r.step(fn, fnLabels.do.line, C.circularLoopStart)

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') throw new Error('courant should point to a node')
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0
    const equal = value === valeur
    conditionStep(
      r,
      fn,
      fnLabels.ifValue.line,
      'courant->valeur == valeur',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, valeur)
        : fr.captions.reasonValueDiffers(node.id, value, valeur),
      equal ? 'cas-particulier' : undefined,
    )

    if (equal) {
      const headPointer = r.global('debut')
      const isHead = headPointer.kind === 'node' && headPointer.id === courant.id
      conditionStep(
        r,
        fn,
        fnLabels.ifHead.line,
        'courant == debut',
        isHead,
        isHead ? C.circularHeadDelegation : C.circularNotHead,
      )
      if (isHead) {
        r.step(fn, fnLabels.callHead.line, fr.captions.call('supprimerEnTete'))
        callCircularSupprimerEnTete(r)
        r.step(fn, fnLabels.returnFound.line, C.circularAfterHeadCall)
        return r.finish(fn, fnLabels.end.line)
      }

      const previous = pointerOf(r.local('precedent'))
      if (previous.kind !== 'node') throw new Error('precedent should point to a node')
      const next = node.suivant
      r.setPointer(previous.id, 'suivant', next)
      r.step(fn, fnLabels.unlink.line, C.circularDetach, {
        evals: [r.makeEval('courant->suivant', next)],
      })
      r.freeNode(node.id)
      r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(node.id))
      r.step(fn, fnLabels.returnFound.line, fr.captions.returnVoid)
      return r.finish(fn, fnLabels.end.line)
    }

    r.setLocal('precedent', courant)
    r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignPointerVar('precedent', r.describe(courant)))
    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))

    const nextPointer = pointerOf(r.local('courant'))
    const backToDebut = nextPointer.kind === 'node' && nextPointer.id === debut.id
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !backToDebut,
      backToDebut ? C.circularStop : C.circularContinue,
    )
    if (backToDebut) break
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runCircularRechercher(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'rechercher'
  const fnLabels = L.rechercher
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
    r.setReturnValue(0)
    r.step(fn, fnLabels.returnZeroEmpty.line, C.searchEmpty)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))
  r.step(fn, fnLabels.do.line, C.circularLoopStart)

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') throw new Error('courant should point to a node')
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

    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))

    const nextPointer = pointerOf(r.local('courant'))
    const backToDebut = nextPointer.kind === 'node' && nextPointer.id === debut.id
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !backToDebut,
      backToDebut ? C.circularStop : C.circularContinue,
    )
    if (backToDebut) {
      r.setReturnValue(0)
      r.step(fn, fnLabels.returnZero.line, C.circularNotFound)
      return r.finish(fn, fnLabels.end.line)
    }
  }
}

export function runCircularDetruireListe(
  state: LscSnapshot,
  _params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'detruireListe'
  const fnLabels = L.detruireListe
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifNull.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? C.destroyEmpty : fr.captions.reasonListNotEmpty,
  )
  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('dernier', debut)
  r.step(fn, fnLabels.declDernier.line, fr.captions.declarePointer('dernier', r.describe(debut)))

  for (;;) {
    const dernier = pointerOf(r.local('dernier'))
    const node = dernier.kind === 'node' ? r.node(dernier.id) : null
    const atLast = Boolean(node && node.suivant.kind === 'node' && node.suivant.id === debut.id)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'dernier->suivant != debut',
      !atLast,
      atLast ? C.circularLastFound : C.circularNotLast,
    )
    if (!node || atLast) break
    const next = node.suivant
    r.setLocal('dernier', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('dernier', r.describe(next)))
  }

  const dernier = pointerOf(r.local('dernier'))
  if (dernier.kind !== 'node') throw new Error('dernier should point to the last node')
  r.setPointer(dernier.id, 'suivant', { kind: 'null' })
  r.step(fn, fnLabels.breakRing.line, C.circularBreakRing)

  for (;;) {
    const head = r.global('debut')
    const notEmpty = head.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileDebut.line,
      'debut != NULL',
      notEmpty,
      notEmpty ? fr.captions.reasonListNotEmpty : C.destroyEmpty,
    )
    if (!notEmpty) break
    const node = r.node(head.id)
    r.declareLocal('ancienDebut', head)
    r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(head)))
    const next = node.suivant
    r.setGlobal('debut', next)
    r.step(fn, fnLabels.setDebut.line, C.circularDestroyHead, {
      evals: [r.makeEval('debut->suivant', next)],
    })
    r.freeNode(node.id)
    r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(node.id))
  }

  return r.finish(fn, fnLabels.end.line)
}
