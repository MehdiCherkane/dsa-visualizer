import type {
  Badge,
  NodeOrNullPointer,
  ParamValues,
  PointerValue,
  Step,
  StudentValue,
  VarValue,
} from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { Recorder } from '../../ldc/ops/runtime'
import { studentLabels } from '../code/student'
import { payloadKey } from '../memory'
import type { LdcNode, LdcSnapshot } from '../memory'
import { rotateRowToHead } from './rotate'

const L = studentLabels
const C = fr.lddc.captions

function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textParam(params: ParamValues, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : ''
}

function pointerOf(value: VarValue | undefined): NodeOrNullPointer {
  if (!value) return { kind: 'null' }
  if (value.kind === 'node' || value.kind === 'null') return value
  if (value.kind === 'uninit') return { kind: 'null' }
  throw new Error('Expected a pointer value')
}

function studentOf(node: LdcNode): StudentValue {
  if (node.payload.kind !== 'student') throw new Error('Expected a student payload')
  return node.payload.student
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

export function runInscrireEtudiant(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'inscrireEtudiant'
  const fnLabels = L.inscrireEtudiant
  const student: StudentValue = {
    numero: numberParam(params, 'numero'),
    nom: textParam(params, 'nom'),
    prenom: textParam(params, 'prenom'),
  }
  const slots = rowCount(state)
  const r = new Recorder(state)
  r.pushFrame(fn, { E: { kind: 'student', value: student } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(slots)
  const node = r.node(id)
  const nouveau = nodePointer(id)
  r.declareLocal('nouveau', nouveau)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

  r.setPayload(id, { kind: 'student', student })
  r.step(fn, fnLabels.setDonnees.line, fr.captions.assignPayloadStudent(id, student))

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

export function runRadierEtudiant(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'radierEtudiant'
  const fnLabels = L.radierEtudiant
  const numero = numberParam(params, 'num')
  const r = new Recorder(state)
  r.pushFrame(fn, { numero: { kind: 'int', value: numero } })
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

    const equal = value === numero
    r.incrementComparisons()
    conditionStep(
      r,
      fn,
      fnLabels.checkValue.line,
      'courant->donnees.numero == num',
      equal,
      equal
        ? fr.captions.reasonValueEquals(node.id, value, numero)
        : fr.captions.reasonValueDiffers(node.id, value, numero),
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
        r.freeNode(node.id)
        r.step(fn, fnLabels.freeSingle.line, C.removeSingleNode)
        r.setGlobal('debut', { kind: 'null' })
        r.step(fn, fnLabels.setDebutNull.line, fr.captions.assignGlobalDebut(fr.common.null), {
          badge: 'debut-modifie',
        })
        r.step(fn, fnLabels.returnSingle.line, fr.captions.returnVoid)
        return r.finish(fn, fnLabels.end.line)
      }

      const previous = node.precedent
      const next = node.suivant
      if (previous.kind === 'node') {
        r.setPointer(previous.id, 'suivant', next)
        r.step(
          fn,
          fnLabels.unlinkPrev.line,
          fr.captions.removeStudentMiddle,
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

export function runStudentAfficherListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
    const student = studentOf(node)
    r.addConsole(`${student.numero} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfStudent(student))

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
      stop ? C.circularStop : C.circularContinue,
    )
    if (stop) break
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runStudentAfficherListeEnvers(
  state: LdcSnapshot,
  _params: ParamValues,
): Step<LdcSnapshot>[] {
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

  const last = r.node(debut.id).precedent
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
    const student = studentOf(node)
    r.addConsole(`${student.numero} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfStudent(student))

    const previous = node.precedent
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

export function runStudentPasserAuSuivant(
  state: LdcSnapshot,
  _params: ParamValues,
): Step<LdcSnapshot>[] {
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

export function runStudentDetruireListe(
  state: LdcSnapshot,
  _params: ParamValues,
): Step<LdcSnapshot>[] {
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

    const head = r.node(debut.id)
    r.declareLocal('ancien', debut)
    r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancien', r.describe(debut)))

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
      r.freeNode(head.id)
      r.step(fn, fnLabels.freeSingle.line, fr.captions.freeNodeDangling(head.id))
      r.setGlobal('debut', { kind: 'null' })
      r.step(fn, fnLabels.setDebutNull.line, fr.captions.assignGlobalDebut(fr.common.null), {
        badge: 'debut-modifie',
      })
      continue
    }

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
  }

  r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  return r.finish(fn, fnLabels.end.line)
}
