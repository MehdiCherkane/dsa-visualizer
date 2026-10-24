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
import type { LscSnapshot } from '../memory'
import { Recorder } from './runtime'

const L = studentLabels
const C = fr.lsc.captions

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

function studentLabel(student: StudentValue): string {
  return `${student.numero} (${student.nom} ${student.prenom})`
}

export function runStudentAfficherListe(
  state: LscSnapshot,
  _params: ParamValues,
): Step<LscSnapshot>[] {
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
    const numero = payloadKey(node) ?? 0
    r.addConsole(`${numero} `)
    r.step(fn, fnLabels.printf.line, fr.captions.printfInt(numero))

    const next = r.node(courant.id).suivant
    r.setLocal('courant', next)
    r.incrementTraversed()
    r.step(fn, fnLabels.avancer.line, fr.captions.advanceNext('courant', r.describe(next)), {
      evals: [r.makeEval('courant->suivant', next)],
    })
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runInscrireEtudiant(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'inscrireEtudiant'
  const fnLabels = L.inscrireEtudiant
  const numero = numberParam(params, 'numero')
  const nom = textParam(params, 'nom')
  const prenom = textParam(params, 'prenom')
  const student: StudentValue = { numero, nom, prenom }
  const rowCount = state.nodes.filter((node) => node.lane === 'row').length
  const r = new Recorder(state)
  r.pushFrame(fn, {
    numero: { kind: 'int', value: numero },
    E: { kind: 'student', value: student },
  })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const id = r.mallocNode(rowCount)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, C.malloc(id, node.address))

  r.setPayload(id, {
    kind: 'student',
    student: { numero, nom: null, prenom: null },
  })
  r.step(fn, fnLabels.setNumero.line, C.writeNumero(id, numero))

  r.updateStudent(id, { nom })
  r.step(fn, fnLabels.strcpyNom.line, C.writeNom(id, nom))

  r.updateStudent(id, { prenom })
  r.step(fn, fnLabels.strcpyPrenom.line, C.writePrenom(id, prenom))

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
    r.step(fn, fnLabels.setDebut.line, C.registerHead, { badge: 'debut-modifie' })
    r.step(fn, fnLabels.returnEmpty.line, C.registerDone(studentLabel(student)))
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
  r.step(fn, fnLabels.linkLast.line, C.registerTail, {
    evals: [r.makeEval('courant', courant)],
  })

  return r.finish(fn, fnLabels.end.line)
}

export function runRadierEtudiant(
  state: LscSnapshot,
  params: ParamValues,
): Step<LscSnapshot>[] {
  const fn = 'radierEtudiant'
  const fnLabels = L.radierEtudiant
  const numero = numberParam(params, 'numero')
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
    debut.kind === 'null' ? C.radierEmpty : fr.captions.reasonListNotEmpty,
  )
  if (debut.kind === 'null') {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const head = r.node(debut.id)
  const headNumero = payloadKey(head) ?? 0
  const isHead = headNumero === numero
  conditionStep(
    r,
    fn,
    fnLabels.ifHead.line,
    'debut->numero == numero',
    isHead,
    isHead
      ? fr.captions.reasonValueEquals(head.id, headNumero, numero)
      : fr.captions.reasonValueDiffers(head.id, headNumero, numero),
    isHead ? 'cas-particulier' : undefined,
  )

  if (isHead) {
    r.declareLocal('ancienDebut', debut)
    r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(debut)))

    const next = head.suivant
    r.setGlobal('debut', next)
    r.step(fn, fnLabels.advanceDebut.line, C.radierHead, {
      badge: 'debut-modifie',
      evals: [r.makeEval('debut->suivant', next)],
    })

    r.freeNode(head.id)
    r.step(fn, fnLabels.freeHead.line, fr.captions.freeNodeDangling(head.id))
    r.step(fn, fnLabels.returnAfterHead.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  r.declareLocal('precedent', debut)
  r.step(fn, fnLabels.declPrecedent.line, fr.captions.declarePointer('precedent', r.describe(debut)))

  const second = head.suivant
  r.declareLocal('courant', second)
  r.step(fn, fnLabels.declCourant.line, fr.captions.declarePointer('courant', r.describe(second)))

  for (;;) {
    const courant = pointerOf(r.local('courant'))
    const node = courant.kind === 'node' ? r.node(courant.id) : null
    const value = node ? payloadKey(node) : null
    const result = Boolean(node && value !== numero)
    const reason = !node
      ? C.radierAbsent(numero)
      : value === numero
        ? fr.captions.reasonValueEquals(node.id, value ?? 0, numero)
        : fr.captions.reasonValueDiffers(node.id, value ?? 0, numero)
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'courant != NULL && courant->numero != numero',
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
    foundNode ? fr.captions.reasonFound(numero) : C.radierAbsent(numero),
  )

  if (!foundNode) {
    return r.finish(fn, fnLabels.end.line)
  }

  const previous = pointerOf(r.local('precedent'))
  if (previous.kind !== 'node') throw new Error('precedent should point to a node')
  const next = foundNode.suivant
  r.setPointer(previous.id, 'suivant', next)
  r.step(fn, fnLabels.unlink.line, C.radierDetach, {
    evals: [r.makeEval('courant->suivant', next)],
  })
  r.freeNode(foundNode.id)
  r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(foundNode.id))

  return r.finish(fn, fnLabels.end.line)
}

export function runStudentDetruireListe(
  state: LscSnapshot,
  _params: ParamValues,
): Step<LscSnapshot>[] {
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

    const node = r.node(debut.id)
    r.declareLocal('ancienDebut', debut)
    r.step(fn, fnLabels.declAncien.line, fr.captions.declarePointer('ancienDebut', r.describe(debut)))

    const next = node.suivant
    r.setGlobal('debut', next)
    r.step(fn, fnLabels.advance.line, C.destroyHead, {
      badge: 'debut-modifie',
      evals: [r.makeEval('debut->suivant', next)],
    })

    r.freeNode(node.id)
    r.step(fn, fnLabels.free.line, fr.captions.freeNodeDangling(node.id))
  }

  return r.finish(fn, fnLabels.end.line)
}
