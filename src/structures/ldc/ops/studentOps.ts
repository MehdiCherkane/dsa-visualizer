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
import { studentLabels } from '../code/student'
import { payloadKey } from '../memory'
import type { LdcSnapshot } from '../memory'
import { Recorder } from './runtime'

const L = studentLabels

function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function textParam(params: ParamValues, name: string): string {
  const value = params[name]
  return typeof value === 'string' ? value : String(value ?? '')
}

function pointerOf(value: VarValue | undefined): NodeOrNullPointer {
  if (!value) return { kind: 'null' }
  if (value.kind === 'node' || value.kind === 'null') return value
  if (value.kind === 'uninit') return { kind: 'null' }
  throw new Error('Expected a pointer value')
}

function studentOf(node: { payload: { kind: string } }): StudentValue {
  const payload = node.payload as
    | { kind: 'student'; student: StudentValue }
    | { kind: 'int'; value: number }
    | { kind: 'uninit' }
  if (payload.kind === 'student') return payload.student
  return { numero: 0, nom: fr.common.uninit, prenom: fr.common.uninit }
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

function rowCount(state: LdcSnapshot): number {
  return state.nodes.filter((node) => node.lane === 'row').length
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
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, fr.captions.malloc(id, node.address))

  r.setPayload(id, { kind: 'student', student })
  r.step(fn, fnLabels.setDonnees.line, fr.captions.assignPayloadStudent(id, student))

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
  r.insertRowNode(id, slots)
  r.step(fn, fnLabels.linkLast.line, fr.captions.tailLink, {
    evals: [r.makeEval('courant', courant)],
  })

  r.setPointer(id, 'precedent', courant)
  r.step(fn, fnLabels.setNewPrecedent.line, fr.captions.assignField(id, 'precedent', r.describe(courant)))

  return r.finish(fn, fnLabels.end.line)
}

export function runRadierEtudiant(state: LdcSnapshot, params: ParamValues): Step<LdcSnapshot>[] {
  const fn = 'radierEtudiant'
  const fnLabels = L.radierEtudiant
  const num = numberParam(params, 'num')
  const r = new Recorder(state)
  r.pushFrame(fn, { num: { kind: 'int', value: num } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const debut = r.global('debut')
  r.declareLocal('courant', debut)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(debut)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const value = node ? payloadKey(node) : null
    const result = Boolean(node && value !== num)
    const reason = !node
      ? fr.captions.reasonNotFound(num)
      : value === num
        ? fr.captions.reasonValueEquals(node.id, value ?? 0, num)
        : fr.captions.reasonValueDiffers(node.id, value ?? 0, num)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL && courant->donnees.numero != num',
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
    found.kind === 'null' ? fr.captions.reasonNotFound(num) : fr.captions.reasonFound(num),
  )
  if (found.kind === 'null') {
    r.step(fn, fnLabels.returnNotFound.line, fr.captions.notFoundNothing(num))
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
    const oldHead = r.node(found.id)
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
    r.step(fn, fnLabels.returnAfterFree.line, fr.captions.returnVoid)
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
    next.kind === 'null' ? fr.captions.removeLast : fr.captions.removeStudentMiddle,
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
  r.step(fn, fnLabels.freeLast.line, fr.captions.freeNodeDangling(courantNode.id))
  return r.finish(fn, fnLabels.end.line)
}

export function runStudentAfficherListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
    const student = studentOf(node)
    r.addConsole(`${student.numero} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfStudent(student))

    const next = r.node(courant.id).suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)))
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runStudentAfficherListeEnvers(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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
    r.step(fn, fnLabels.forwardAdvance.line, fr.captions.advanceNext('courant', r.describe(next)))
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
    const student = studentOf(node)
    r.addConsole(`${student.numero} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfStudent(student))

    const previous = r.node(courant.id).precedent
    r.setLocal('courant', previous)
    r.incrementTraversed()
    r.step(fn, fnLabels.backAdvance.line, fr.captions.advancePrevious('courant', r.describe(previous)))
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runStudentInverserListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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

export function runStudentDetruireListe(state: LdcSnapshot, _params: ParamValues): Step<LdcSnapshot>[] {
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

    const oldHead = r.node(debut.id)
    r.declareLocal('temp', debut)
    r.step(fn, fnLabels.declTemp.line, fr.captions.declarePointer('temp', r.describe(debut)))

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
  }

  return r.finish(fn, fnLabels.end.line)
}
