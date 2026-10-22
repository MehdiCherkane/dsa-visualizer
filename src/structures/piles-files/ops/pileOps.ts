import type { Badge, ParamValues, PointerValue, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { pileLabels } from '../code/pile'
import type { PileSnapshot } from '../memory'
import { PileRecorder } from './pileRuntime'

const L = pileLabels
const C = fr.piles.captions

function numberParam(params: ParamValues, name: string): number {
  const value = params[name]
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function conditionStep(
  r: PileRecorder,
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

function bodyEmpiler(r: PileRecorder, valeur: number): void {
  const fn = 'empiler'
  const fnLabels = L.empiler
  const rowCount = r.state.nodes.filter((node) => node.lane === 'row').length
  const id = r.mallocNode(rowCount)
  const node = r.node(id)
  const newPointer: PointerValue = { kind: 'node', id }
  r.declareLocal('nouveau', newPointer)
  r.step(fn, fnLabels.malloc.line, C.mallocPile(id, node.address))

  r.setValue(id, valeur)
  r.step(fn, fnLabels.setValeur.line, C.setValuePile(valeur))

  const previousTop = r.global('sommet')
  r.setPointer(id, 'precedent', previousTop)
  r.step(fn, fnLabels.setPrecedent.line, C.linkTop, {
    evals: [r.makeEval('sommet', previousTop)],
  })

  r.setGlobal('sommet', newPointer)
  r.insertRowNode(id, 0)
  r.step(fn, fnLabels.setSommet.line, C.newTop, { badge: 'debut-modifie' })
}

function callEmpiler(r: PileRecorder, valeur: number): void {
  const fn = 'empiler'
  const fnLabels = L.empiler
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyEmpiler(r, valeur)
  r.step(fn, fnLabels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
}

function bodyDepiler(r: PileRecorder): { early: boolean; value: number } {
  const fn = 'depiler'
  const fnLabels = L.depiler
  const sommet = r.global('sommet')
  const empty = sommet.kind === 'null'
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'sommet == NULL',
    empty,
    empty ? fr.captions.reasonStackEmpty : fr.captions.reasonStackNotEmpty,
  )
  if (empty) {
    r.addConsole('Pile vide\n')
    r.setReturnValue(-1)
    r.step(fn, fnLabels.printfEmpty.line, C.popEmpty)
    r.step(fn, fnLabels.returnError.line, fr.captions.returnMinusOne)
    return { early: true, value: -1 }
  }

  const top = r.node(sommet.kind === 'node' ? sommet.id : 0)
  r.declareLocal('ancienSommet', sommet)
  r.step(fn, fnLabels.declAncien.line, C.saveTop)

  const value = top.value ?? 0
  r.declareLocal('valeur', { kind: 'int', value })
  r.step(fn, fnLabels.declValeur.line, fr.captions.declareValue('valeur', String(value)))

  const next = top.precedent
  r.setGlobal('sommet', next)
  r.step(fn, fnLabels.moveTop.line, C.moveTop, {
    badge: 'debut-modifie',
    evals: [r.makeEval('sommet->precedent', next)],
  })

  r.freeNode(top.id)
  r.step(fn, fnLabels.free.line, C.freeTop)
  r.setReturnValue(value)
  return { early: false, value }
}

function callDepiler(r: PileRecorder): number {
  const fn = 'depiler'
  const fnLabels = L.depiler
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const result = bodyDepiler(r)
  if (!result.early) {
    r.step(fn, fnLabels.returnValue.line, fr.captions.returnInt(result.value))
  }
  r.popFrame()
  return result.value
}

export function runEmpiler(state: PileSnapshot, params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'empiler'
  const fnLabels = L.empiler
  const valeur = numberParam(params, 'valeur')
  const r = new PileRecorder(state)
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  bodyEmpiler(r, valeur)
  return r.finish(fn, fnLabels.end.line, C.pushDone)
}

export function runDepiler(state: PileSnapshot, _params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'depiler'
  const fnLabels = L.depiler
  const r = new PileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const result = bodyDepiler(r)
  if (!result.early) {
    r.step(fn, fnLabels.returnValue.line, C.popDone)
  }
  return r.finish(fn, fnLabels.end.line)
}

export function runPileVide(state: PileSnapshot, _params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'pileVide'
  const fnLabels = L.pileVide
  const r = new PileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  const empty = r.global('sommet').kind === 'null'
  r.setReturnValue(empty ? 1 : 0)
  conditionStep(
    r,
    fn,
    fnLabels.return.line,
    'sommet == NULL',
    empty,
    empty ? C.emptyTrue : C.emptyFalse,
  )
  return r.finish(fn, fnLabels.end.line)
}

export function runDetruirePile(state: PileSnapshot, _params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'detruirePile'
  const fnLabels = L.detruirePile
  const r = new PileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  for (;;) {
    const sommet = r.global('sommet')
    const notEmpty = sommet.kind === 'node'
    conditionStep(
      r,
      fn,
      fnLabels.whileCond.line,
      'sommet != NULL',
      notEmpty,
      notEmpty ? fr.captions.reasonStackNotEmpty : C.destroyEmpty,
    )
    if (!notEmpty) break
    r.step(fn, fnLabels.callDepiler.line, fr.captions.call('depiler'))
    callDepiler(r)
    r.step(fn, fnLabels.endWhile.line, C.destroyLoop)
  }

  return r.finish(fn, fnLabels.end.line)
}

export function runEmpilerCopie(state: PileSnapshot, params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'empilerCopie'
  const fnLabels = L.empilerCopie
  const numero = numberParam(params, 'numero')
  const r = new PileRecorder(state)
  r.pushFrame(fn, { numero: { kind: 'int', value: numero } })
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))
  r.step(fn, fnLabels.callEmpiler.line, C.copieDelegation)
  callEmpiler(r, numero)
  return r.finish(fn, fnLabels.end.line, C.copieDone)
}

export function runCorrigerCopie(state: PileSnapshot, _params: ParamValues): Step<PileSnapshot>[] {
  const fn = 'corrigerCopie'
  const fnLabels = L.corrigerCopie
  const r = new PileRecorder(state)
  r.pushFrame(fn)
  r.step(fn, fnLabels.entry.line, fr.captions.entry(fn))

  const empty = r.global('sommet').kind === 'null'
  conditionStep(
    r,
    fn,
    fnLabels.ifEmpty.line,
    'pileVide()',
    empty,
    empty ? C.corrigerEmpty : fr.captions.reasonStackNotEmpty,
  )
  if (empty) {
    r.step(fn, fnLabels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, fnLabels.end.line)
  }

  const value = callDepiler(r)
  r.declareLocal('numero', { kind: 'int', value })
  r.step(fn, fnLabels.declNumero.line, C.corrigerPop)
  r.addConsole(`Correction de la copie ${value}\n`)
  r.step(fn, fnLabels.printf.line, C.corrigerPrint(value))
  r.clearReturnValue()
  return r.finish(fn, fnLabels.end.line, C.corrigerDone)
}
