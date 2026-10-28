import type { Badge, ParamValues, PointerValue, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { fileLabels } from '../code/file'
import type { FileSnapshot } from '../memory'
import { FileRecorder } from './fileRuntime'

const L = fileLabels
const C = fr.piles.captions

function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function conditionStep(
  r: FileRecorder,
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

function bodyEnfiler(r: FileRecorder, valeur: number): void {
  const fn = 'enfiler'
  const fnLabels = L.enfiler
  const rowCount = r.state.nodes.filter((node) => node.lane === 'row').length
  const id = r.mallocNode(rowCount, 'row')
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, C.mallocFile(id, node.address))

  r.setValue(id, valeur)
  r.step(fn, fnLabels.setValeur.line, C.setValueFile(valeur))

  r.setPointer(id, 'suivant', { kind: 'null' })
  r.step(fn, fnLabels.setSuivantNull.line, fr.captions.assignField(id, 'suivant', fr.common.null))

  const debut = r.global('debut')
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    debut.kind === 'null',
    debut.kind === 'null' ? fr.captions.reasonQueueEmpty : fr.captions.reasonQueueNotEmpty,
  )

  if (debut.kind === 'null') {
    r.setGlobal('debut', newPointer)
    r.step(fn, fnLabels.setDebutEmpty.line, C.enqueueEmptyDebut, { badge: 'debut-modifie' })
    r.setGlobal('fin', newPointer)
    r.step(fn, fnLabels.setFinEmpty.line, C.enqueueEmptyFin, { badge: 'debut-modifie' })
    r.step(fn, fnLabels.returnEmpty.line, C.enqueueDone)
    return
  }

  const fin = r.global('fin')
  if (fin.kind !== 'node') throw new Error('fin should point to a node')
  r.setPointer(fin.id, 'suivant', newPointer)
  r.step(fn, fnLabels.linkLast.line, C.enqueueAfterLast, {
    evals: [r.makeEval('fin', fin)],
  })
  r.setGlobal('fin', newPointer)
  r.step(fn, fnLabels.advanceFin.line, C.enqueueDone, { badge: 'debut-modifie' })
}

function callEnfiler(r: FileRecorder, valeur: number): void {
  const fn = 'enfiler'
  const fnLabels = L.enfiler
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyEnfiler(r, valeur)
  r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
}

function bodyDefiler(r: FileRecorder): { early: boolean; value: number } {
  const fn = 'defiler'
  const fnLabels = L.defiler
  const debut = r.global('debut')
  const empty = debut.kind === 'null'
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'debut == NULL',
    empty,
    empty ? fr.captions.reasonQueueEmpty : fr.captions.reasonQueueNotEmpty,
  )
  if (empty) {
    r.addConsole('File vide\n')
    r.setReturnValue(-1)
    r.step(fn, fnLabels.printfEmpty.line, C.dequeueEmpty)
    r.step(fn, fnLabels.returnError.line, fr.captions.returnMinusOne)
    return { early: true, value: -1 }
  }

  const first = r.node(debut.kind === 'node' ? debut.id : 0)
  r.declareLocal('ancienDebut', debut)
  r.step(fn, fnLabels.declAncien.line, C.saveFirst)

  const value = first.value ?? 0
  r.declareLocal('valeur', { kind: 'int', value })
  r.step(fn, fnLabels.declValeur.line, fr.captions.declareValue('valeur', String(value)))

  const next = first.suivant
  r.setGlobal('debut', next)
  r.step(fn, fnLabels.advanceDebut.line, C.advanceFirst, {
    badge: 'debut-modifie',
    evals: [r.makeEval('debut->suivant', next)],
  })

  const becameEmpty = next.kind === 'null'
  conditionStep(
    r,
    fn,
    fnLabels.ifBecameEmpty.line,
    'debut == NULL',
    becameEmpty,
    becameEmpty ? C.dequeueLastTrap : fr.captions.reasonQueueNotEmpty,
    becameEmpty ? 'cas-particulier' : undefined,
  )
  if (becameEmpty) {
    r.setGlobal('fin', { kind: 'null' })
    r.step(fn, fnLabels.resetFin.line, C.dequeueLastFixed, { badge: 'debut-modifie' })
  }

  r.freeNode(first.id)
  r.step(fn, fnLabels.free.line, C.freeFirst)
  r.setReturnValue(value)
  return { early: false, value }
}

function callDefiler(r: FileRecorder): number {
  const fn = 'defiler'
  const fnLabels = L.defiler
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const result = bodyDefiler(r)
  if (!result.early) {
    r.step(fn, fnLabels.returnValue.line, fr.captions.returnInt(result.value))
  }
  r.popFrame()
  return result.value
}

export function runEnfiler(state: FileSnapshot, params: ParamValues): Step<FileSnapshot>[] {
  const fn = 'enfiler'
  const fnLabels = L.enfiler
  const valeur = numberParam(params, 'valeur')
  const r = new FileRecorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyEnfiler(r, valeur)
  return r.finish(fn, fnLabels.end.line, C.enqueueDone)
}

export function runDefiler(state: FileSnapshot, _params: ParamValues): Step<FileSnapshot>[] {
  const fn = 'defiler'
  const fnLabels = L.defiler
  const r = new FileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const result = bodyDefiler(r)
  if (!result.early) {
    r.step(fn, fnLabels.returnValue.line, C.dequeueDone)
  }
  return r.finish(fn, fnLabels.end.line)
}

export function runFileVide(state: FileSnapshot, _params: ParamValues): Step<FileSnapshot>[] {
  const fn = 'fileVide'
  const fnLabels = L.fileVide
  const r = new FileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const empty = r.global('debut').kind === 'null'
  r.setReturnValue(empty ? 1 : 0)
  conditionStep(
    r,
    fn,
    fnLabels.return.line,
    'debut == NULL',
    empty,
    empty ? C.fileEmptyTrue : C.fileEmptyFalse,
  )
  return r.finish(fn, fnLabels.end.line)
}

export function runDetruireFile(state: FileSnapshot, _params: ParamValues): Step<FileSnapshot>[] {
  const fn = 'detruireFile'
  const fnLabels = L.detruireFile
  const r = new FileRecorder(state)
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
      notEmpty ? fr.captions.reasonQueueNotEmpty : C.fileDestroyEmpty,
    )
    if (!notEmpty) break
    r.step(fn, fnLabels.callDefiler.line, fr.captions.call('defiler'))
    callDefiler(r)
    r.clearReturnValue()
    r.step(fn, fnLabels.endWhile.line, C.fileDestroyLoop)
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runEnregistrerArrivee(
  state: FileSnapshot,
  params: ParamValues,
): Step<FileSnapshot>[] {
  const fn = 'enregistrerArrivee'
  const fnLabels = L.enregistrerArrivee
  const numero = numberParam(params, 'numero')
  const r = new FileRecorder(state)
  r.pushFrame(fn, { numero: { kind: 'int', value: numero } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  r.step(fn, fnLabels.callEnfiler.line, C.arrive(numero))
  callEnfiler(r, numero)
  return r.finish(fn, fnLabels.end.line, C.enqueueDone)
}

export function runServirSuivant(
  state: FileSnapshot,
  _params: ParamValues,
): Step<FileSnapshot>[] {
  const fn = 'servirSuivant'
  const fnLabels = L.servirSuivant
  const r = new FileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const empty = r.global('debut').kind === 'null'
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'fileVide()',
    empty,
    empty ? C.fileEmptyTrue : fr.captions.reasonQueueNotEmpty,
  )
  if (empty) {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const value = callDefiler(r)
  r.declareLocal('numero', { kind: 'int', value })
  r.step(fn, fnLabels.declNumero.line, C.serve(value))
  r.addConsole(`Etudiant ${value} servi\n`)
  r.step(fn, fnLabels.printf.line, C.serve(value))
  r.clearReturnValue()
  return r.finish(fn, fnLabels.end.line, C.serveDone)
}
