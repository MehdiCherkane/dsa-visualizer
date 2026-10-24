import type {
  Badge,
  NodeOrNullPointer,
  ParamValues,
  PointerValue,
  Step,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { Recorder } from '../../ldc/ops/runtime'
import { intLabels } from '../code/int'
import { payloadKey } from '../memory'
import type { LdcSnapshot } from '../memory'
import { rotateRowToHead } from './rotate'

const L = intLabels
const C = fr.lddc.captions

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
  r.step(fn, line, fr.captions.condition(expr, result, reason), {
    cond: { expr, result },
    ...(badge ? { badge } : {}),
  })
}

function rowCount(state: LdcSnapshot): number {
  return state.nodes.filter((node) => node.lane === 'row').length
}

function sameNode(a: PointerValue, b: PointerValue): boolean {
  return a.kind === 'node' && b.kind === 'node' && a.id === b.id
}

function nodePointer(id: number): PointerValue {
  return { kind: 'node', id }
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

  const head = r.node(debut.id)
  const single = sameNode(head.suivant, debut)
  conditionStep(
    r,
    fn,
    fnLabels.ifSingle.line,
    'debut->suivant == debut',
    single,
    single ? C.reasonSingleNode : C.reasonMultipleNodes,
  )

  if (single) {
    r.declareLocal('ancien', debut)
    r.step(fn, fnLabels.declSingle.line, fr.captions.declarePointer('ancien', r.describe(debut)))
    r.setGlobal('debut', { kind: 'null' })
    r.step(fn, fnLabels.setDebutNull.line, fr.captions.assignGlobalDebut(fr.common.null), {
      badge: 'debut-modifie',
    })
    r.freeNode(head.id)
    r.step(fn, fnLabels.freeSingle.line, C.removeSingleNode)
    r.step(fn, fnLabels.returnSingle.line, fr.captions.returnVoid)
    return true
  }

  r.declareLocal('ancienDebut', debut)
  r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(debut)))

  const last = head.precedent
  r.declareLocal('dernier', last)
  r.step(fn, fnLabels.declDernier.line, C.lastFromPrecedent, {
    evals: [r.makeEval('debut->precedent', last)],
  })

  const next = head.suivant
  r.setGlobal('debut', next)
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(next)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', next)],
  })

  if (next.kind === 'node') {
    r.setPointer(next.id, 'precedent', last)
    r.step(
      fn,
      fnLabels.newHeadPrecedent.line,
      fr.captions.assignField(next.id, 'precedent', r.describe(last)),
      { evals: [r.makeEval('debut->precedent', last)] },
    )
  }

  if (last.kind === 'node') {
    r.setPointer(last.id, 'suivant', next)
    r.step(
      fn,
      fnLabels.linkLast.line,
      fr.captions.assignField(last.id, 'suivant', r.describe(next)),
      { evals: [r.makeEval('dernier->suivant', next)] },
    )
  }

  r.freeNode(head.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(head.id))
  return false
}

export function runAfficherListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })

    const stop = sameNode(next, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.circularStop : C.circularContinue,
    )
    if (stop) break
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

  const head = r.node(debut.id)
  const last = head.precedent
  r.declareLocal('dernier', last)
  r.step(fn, fnLabels.declDernier.line, C.lastFromPrecedent, {
    evals: [r.makeEval('debut->precedent', last)],
  })

  r.declareLocal('courant', last)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(last)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break

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

    const stop = sameNode(previous, last)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != dernier',
      !stop,
      stop ? C.circularStop : C.circularContinue,
    )
    if (stop) break
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

  const id = r.mallocNode(0)
  const node = r.node(id)
  const nouveau = nodePointer(id)
  r.declareLocal('nouveau', nouveau)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

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
    r.setPointer(id, 'suivant', nouveau)
    r.step(fn, fnLabels.setSelfSuivant.line, C.selfLinks)
    r.setPointer(id, 'precedent', nouveau)
    r.step(fn, fnLabels.setSelfPrecedent.line, C.selfLinks)

    r.insertRowNode(id, 0)
    r.setGlobal('debut', nouveau)
    r.step(fn, fnLabels.setDebutEmpty.line, fr.captions.assignGlobalDebut(r.describe(nouveau)), {
      badge: 'debut-modifie',
      evals: [r.makeEval('nouveau', nouveau)],
    })
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const head = r.node(debut.id)
  const last = head.precedent
  r.declareLocal('dernier', last)
  r.step(fn, fnLabels.declDernier.line, C.lastFromPrecedent, {
    evals: [r.makeEval('debut->precedent', last)],
  })

  r.setPointer(id, 'suivant', debut)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(debut)), {
    evals: [r.makeEval('debut', debut)],
  })

  r.setPointer(id, 'precedent', last)
  r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignField(id, 'precedent', r.describe(last)), {
    evals: [r.makeEval('dernier', last)],
  })

  if (last.kind === 'node') {
    r.setPointer(last.id, 'suivant', nouveau)
    r.step(
      fn,
      fnLabels.linkLast.line,
      fr.captions.assignField(last.id, 'suivant', r.describe(nouveau)),
      { evals: [r.makeEval('dernier->suivant', nouveau)] },
    )
  }

  r.setPointer(debut.id, 'precedent', nouveau)
  r.step(
    fn,
    fnLabels.linkOldHead.line,
    fr.captions.assignField(debut.id, 'precedent', r.describe(nouveau)),
    { evals: [r.makeEval('debut->precedent', nouveau)] },
  )

  r.insertRowNode(id, 0)
  r.setGlobal('debut', nouveau)
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(nouveau)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('nouveau', nouveau)],
  })
  return r.finish(fn, fnLabels.end.line)
}

export function runInsererEnFin(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'insererEnFin'
  const fnLabels = L.insererEnFin
  const valeur = numberParam(params, 'valeur')
  const slots = rowCount(state)
  const r = new Recorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(slots)
  const node = r.node(id)
  const nouveau = nodePointer(id)
  r.declareLocal('nouveau', nouveau)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

  r.setPayload(id, { kind: 'int', value: valeur })
  r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

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
    r.setPointer(id, 'suivant', nouveau)
    r.step(fn, fnLabels.setSelfSuivant.line, C.selfLinks)
    r.setPointer(id, 'precedent', nouveau)
    r.step(fn, fnLabels.setSelfPrecedent.line, C.selfLinks)

    r.insertRowNode(id, 0)
    r.setGlobal('debut', nouveau)
    r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(nouveau)), {
      badge: 'debut-modifie',
      evals: [r.makeEval('nouveau', nouveau)],
    })
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const last = r.node(debut.id).precedent
  r.declareLocal('dernier', last)
  r.step(fn, fnLabels.declDernier.line, C.lastFromPrecedent, {
    evals: [r.makeEval('debut->precedent', last)],
  })

  r.setPointer(id, 'suivant', debut)
  r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(debut)), {
    evals: [r.makeEval('debut', debut)],
  })

  r.setPointer(id, 'precedent', last)
  r.step(fn, fnLabels.setPrecedent.line, fr.captions.assignField(id, 'precedent', r.describe(last)), {
    evals: [r.makeEval('dernier', last)],
  })

  if (last.kind === 'node') {
    r.setPointer(last.id, 'suivant', nouveau)
    r.step(
      fn,
      fnLabels.linkLast.line,
      fr.captions.assignField(last.id, 'suivant', r.describe(nouveau)),
      { evals: [r.makeEval('dernier->suivant', nouveau)] },
    )
  }

  r.setPointer(debut.id, 'precedent', nouveau)
  r.step(
    fn,
    fnLabels.linkOldHead.line,
    fr.captions.assignField(debut.id, 'precedent', r.describe(nouveau)),
    { evals: [r.makeEval('debut->precedent', nouveau)] },
  )

  r.insertRowNode(id, slots)
  return r.finish(fn, fnLabels.end.line)
}

export function runInsererApresValeur(
  state: LdcSnapshot,
  params: ParamValues,
): Step<LdcSnapshot>[] {
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
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0

    const equal = value === apres
    r.incrementComparisons()
    conditionStep(
      r,
      fn,
      fnLabels.checkValue.line,
      'courant->valeur == apres',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, apres)
        : fr.captions.reasonValueDiffers(node.id, value, apres),
    )

    if (equal) {
      const id = r.mallocNode(node.slot + 1)
      const newNode = r.node(id)
      const nouveau = nodePointer(id)
      r.declareLocal('nouveau', nouveau)
      r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, newNode.address))

      r.setPayload(id, { kind: 'int', value: valeur })
      r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

      const next = r.node(courant.id).suivant
      r.setPointer(id, 'suivant', next)
      r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(next)), {
        evals: [r.makeEval('courant->suivant', next)],
      })

      r.setPointer(id, 'precedent', courant)
      r.step(
        fn,
        fnLabels.setPrecedent.line,
        fr.captions.assignField(id, 'precedent', r.describe(courant)),
        { evals: [r.makeEval('courant', courant)] },
      )

      if (next.kind !== 'node') {
        throw new Error('A circular list must have a next node')
      }
      r.setPointer(next.id, 'precedent', nouveau)
      r.step(
        fn,
        fnLabels.linkNextPrec.line,
        fr.captions.assignField(next.id, 'precedent', r.describe(nouveau)),
        { evals: [r.makeEval('courant->suivant', next)] },
      )

      r.setPointer(courant.id, 'suivant', nouveau)
      r.insertRowNode(id, node.slot + 1)
      r.step(fn, fnLabels.linkAfter.line, C.insertedAfter, {
        evals: [r.makeEval('courant', courant)],
      })

      r.step(fn, fnLabels.returnFound.line, fr.captions.returnVoid)
      return r.finish(fn, fnLabels.end.line)
    }

    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })

    const stop = sameNode(next, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.notFoundInsert : C.circularContinue,
    )
    if (stop) break
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runInsererAvantValeur(
  state: LdcSnapshot,
  params: ParamValues,
): Step<LdcSnapshot>[] {
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
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0

    const equal = value === avant
    r.incrementComparisons()
    conditionStep(
      r,
      fn,
      fnLabels.checkValue.line,
      'courant->valeur == avant',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, avant)
        : fr.captions.reasonValueDiffers(node.id, value, avant),
    )

    if (equal) {
      const previous = node.precedent
      if (previous.kind !== 'node') {
        throw new Error('A circular list must have a previous node')
      }
      const id = r.mallocNode(node.slot)
      const newNode = r.node(id)
      const nouveau = nodePointer(id)
      r.declareLocal('nouveau', nouveau)
      r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, newNode.address))

      r.setPayload(id, { kind: 'int', value: valeur })
      r.step(fn, fnLabels.setValeur.line, fr.captions.assignPayloadInt(id, valeur))

      r.setPointer(id, 'suivant', courant)
      r.step(fn, fnLabels.setSuivant.line, fr.captions.assignField(id, 'suivant', r.describe(courant)), {
        evals: [r.makeEval('courant', courant)],
      })

      r.setPointer(id, 'precedent', previous)
      r.step(
        fn,
        fnLabels.setPrecedent.line,
        fr.captions.assignField(id, 'precedent', r.describe(previous)),
        { evals: [r.makeEval('courant->precedent', previous)] },
      )

      r.setPointer(previous.id, 'suivant', nouveau)
      r.step(
        fn,
        fnLabels.linkPrevNext.line,
        fr.captions.assignField(previous.id, 'suivant', r.describe(nouveau)),
        { evals: [r.makeEval('courant->precedent', previous)] },
      )

      r.setPointer(courant.id, 'precedent', nouveau)
      r.step(
        fn,
        fnLabels.linkCourantPrec.line,
        fr.captions.assignField(courant.id, 'precedent', r.describe(nouveau)),
        { evals: [r.makeEval('courant', courant)] },
      )

      const isHead = sameNode(debut, courant)
      conditionStep(
        r,
        fn,
        fnLabels.ifHead.line,
        'courant == debut',
        isHead,
        isHead ? C.reasonHeadInsert : C.reasonNotHeadInsert,
        isHead ? 'cas-particulier' : undefined,
      )

      if (isHead) {
        r.setGlobal('debut', nouveau)
        r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(nouveau)), {
          badge: 'debut-modifie',
          evals: [r.makeEval('nouveau', nouveau)],
        })
      }

      r.insertRowNode(id, node.slot)
      r.step(fn, fnLabels.returnFound.line, C.insertedBefore)
      return r.finish(fn, fnLabels.end.line)
    }

    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })

    const stop = sameNode(next, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.notFoundInsert : C.circularContinue,
    )
    if (stop) break
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runSupprimerEnTete(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'supprimerEnTete'
  const fnLabels = L.supprimerEnTete
  const r = new Recorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const returnedEarly = bodySupprimerEnTete(r)
  if (!returnedEarly) r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
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
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonListEmpty : fr.captions.reasonListNotEmpty,
  )

  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0

    const equal = value === valeur
    r.incrementComparisons()
    conditionStep(
      r,
      fn,
      fnLabels.checkValue.line,
      'courant->valeur == valeur',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, valeur)
        : fr.captions.reasonValueDiffers(node.id, value, valeur),
    )

    if (equal) {
      const single = sameNode(node.suivant, courant)
      conditionStep(
        r,
        fn,
        fnLabels.ifSingle.line,
        'courant->suivant == courant',
        single,
        single ? C.reasonSingleNode : C.reasonMultipleNodes,
      )

      if (single) {
        r.setGlobal('debut', { kind: 'null' })
        r.step(fn, fnLabels.setDebutNull.line, fr.captions.assignGlobalDebut(fr.common.null), {
          badge: 'debut-modifie',
        })
        r.freeNode(node.id)
        r.step(fn, fnLabels.freeSingle.line, C.removeSingleNode)
        r.step(fn, fnLabels.returnSingle.line, fr.captions.returnVoid)
        return r.finish(fn, fnLabels.end.line)
      }

      const previous = node.precedent
      const next = node.suivant
      const isHead = sameNode(debut, courant)
      conditionStep(
        r,
        fn,
        fnLabels.ifHead.line,
        'courant == debut',
        isHead,
        isHead ? C.reasonHeadCircular : C.reasonNotHeadCircular,
        isHead ? 'cas-particulier' : undefined,
      )

      if (isHead && next.kind === 'node') {
        r.setGlobal('debut', next)
        r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(next)), {
          badge: 'debut-modifie',
          evals: [r.makeEval('courant->suivant', next)],
        })
      }

      if (previous.kind === 'node') {
        r.setPointer(previous.id, 'suivant', next)
        r.step(
          fn,
          fnLabels.unlinkPrev.line,
          fr.captions.removeMiddle(node.id),
          { evals: [r.makeEval('courant->precedent->suivant', next)] },
        )
      }
      if (next.kind === 'node') {
        r.setPointer(next.id, 'precedent', previous)
        r.step(
          fn,
          fnLabels.unlinkNext.line,
          fr.captions.assignField(next.id, 'precedent', r.describe(previous)),
          { evals: [r.makeEval('courant->suivant->precedent', previous)] },
        )
      }

      r.freeNode(node.id)
      r.step(fn, fnLabels.freeNode.line, fr.captions.freeNodeDangling(node.id))
      r.step(fn, fnLabels.returnFound.line, fr.captions.returnVoid)
      return r.finish(fn, fnLabels.end.line)
    }

    const next = node.suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })

    const stop = sameNode(next, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.notFoundLoop : C.circularContinue,
    )
    if (stop) break
  }

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
    r.step(fn, fnLabels.returnZeroEmpty.line, fr.captions.returnInt(0))
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
    const node = r.node(courant.id)
    const value = payloadKey(node) ?? 0

    const equal = value === valeur
    r.incrementComparisons()
    conditionStep(
      r,
      fn,
      fnLabels.checkValue.line,
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
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })

    const stop = sameNode(next, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.notFoundLoop : C.circularContinue,
    )
    if (stop) break
  }

  r.setReturnValue(0)
  r.step(fn, fnLabels.returnZero.line, C.notFoundLoop)
  return r.finish(fn, fnLabels.end.line)
}

export function runPasserAuSuivant(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'passerAuSuivant'
  const fnLabels = L.passerAuSuivant
  const r = new Recorder(state)
  r.pushFrame(fn)
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
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const next = r.node(debut.id).suivant
  if (next.kind === 'node') rotateRowToHead(r, next.id)
  r.setGlobal('debut', next)
  r.step(fn, fnLabels.avancer.line, C.rotateHead, {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', next)],
  })
  return r.finish(fn, fnLabels.end.line)
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

    r.step(fn, fnLabels.callHead.line, fr.captions.destroyHead, {
      evals: [r.makeEval('debut', debut)],
    })
    callSupprimerEnTete(r)
  }

  r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  return r.finish(fn, fnLabels.end.line)
}

export function runInverserListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'inverserListe'
  const fnLabels = L.inverserListe
  const r = new Recorder(state)
  r.pushFrame(fn)
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
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const last = r.node(debut.id).precedent
  r.declareLocal('dernier', last)
  r.step(fn, fnLabels.declDernier.line, C.lastFromPrecedent, {
    evals: [r.makeEval('debut->precedent', last)],
  })

  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    if (courant.kind !== 'node') break
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

    r.setLocal('courant', oldNext)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(oldNext)), {
      evals: [r.makeEval('temp', oldNext)],
    })

    const stop = sameNode(oldNext, debut)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != debut',
      !stop,
      stop ? C.reverseStop : C.circularContinue,
    )
    if (stop) break
  }

  const lastPointer = pointerOf(r.local('dernier'))
  r.setGlobal('debut', lastPointer)
  r.step(fn, fnLabels.setDebut.line, fr.captions.assignGlobalDebut(r.describe(lastPointer)), {
    badge: 'debut-modifie',
    evals: [r.makeEval('dernier', lastPointer)],
  })

  r.reverseRowLayout()
  r.step(fn, fnLabels.end.line, fr.captions.relayout)
  return r.finish(fn, fnLabels.end.line)
}
