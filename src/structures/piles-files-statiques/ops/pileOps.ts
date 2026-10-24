import type { ParamValues, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { pileLabels } from '../code/pile'
import { charAtom, intAtom } from '../memory'
import type { ArraySnapshot } from '../memory'
import { cellNumber, conditionStep, numberParam, textParam } from './common'
import { ArrayRecorder } from './runtime'

const L = pileLabels
const C = fr.staticStructures.captions

function bodyEmpiler(r: ArrayRecorder, valeur: number): void {
  const fn = 'empiler'
  const labels = L.empiler
  const sommet = r.globalInt('sommet')
  const capacity = r.state.capacity
  const full = sommet === capacity - 1

  conditionStep(
    r,
    fn,
    labels.ifPleine.line,
    'pilePleine(*p)',
    full,
    C.stackFullReason(sommet, full, capacity),
  )

  if (full) {
    r.addConsole('Pile pleine\n')
    r.step(fn, labels.printfFull.line, C.fullErrorPile)
    r.step(fn, labels.returnFull.line, fr.captions.returnVoid)
    return
  }

  const next = sommet + 1
  r.setGlobalInt('sommet', next)
  r.step(fn, labels.increment.line, C.pushIncrement(next, next))
  r.writeCell(next, intAtom(valeur))
  r.step(fn, labels.write.line, C.pushWrite(valeur, next))
}

function bodyDepiler(r: ArrayRecorder): { value: number; early: boolean } {
  const fn = 'depiler'
  const labels = L.depiler
  const sommet = r.globalInt('sommet')
  const empty = sommet === -1

  conditionStep(
    r,
    fn,
    labels.ifVide.line,
    'pileVide(*p)',
    empty,
    C.stackEmptyReason(sommet, empty),
  )

  if (empty) {
    r.setReturnValue(-1)
    r.step(fn, labels.returnError.line, C.popEmpty(sommet))
    return { value: -1, early: true }
  }

  const value = cellNumber(r.state, sommet)
  r.declareLocal('valeur', { kind: 'int', value })
  r.step(fn, labels.read.line, C.popRead(value, sommet))
  r.setGlobalInt('sommet', sommet - 1)
  r.step(fn, labels.decrement.line, C.popDecrement(sommet - 1))
  r.setReturnValue(value)
  r.step(fn, labels.returnValue.line, fr.captions.returnInt(value))
  return { value, early: false }
}

function callDepiler(r: ArrayRecorder): number {
  const fn = 'depiler'
  const labels = L.depiler
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const result = bodyDepiler(r)
  r.step(fn, labels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
  return result.value
}

export function runInitPile(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'initPile'
  const labels = L.initPile
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  r.setGlobalInt('sommet', -1)
  r.step(fn, labels.reset.line, C.initStack)
  return r.finish(fn, labels.end.line)
}

export function runPileVide(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'pileVide'
  const labels = L.pileVide
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const sommet = r.globalInt('sommet')
  const empty = sommet === -1
  r.setReturnValue(empty ? 1 : 0)
  conditionStep(
    r,
    fn,
    labels.test.line,
    'p.sommet == -1',
    empty,
    C.stackEmptyReason(sommet, empty),
  )
  return r.finish(fn, labels.end.line)
}

export function runPilePleine(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'pilePleine'
  const labels = L.pilePleine
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const sommet = r.globalInt('sommet')
  const capacity = r.state.capacity
  const full = sommet === capacity - 1
  r.setReturnValue(full ? 1 : 0)
  conditionStep(
    r,
    fn,
    labels.test.line,
    'p.sommet == MAX - 1',
    full,
    C.stackFullReason(sommet, full, capacity),
  )
  return r.finish(fn, labels.end.line)
}

export function runEmpiler(
  state: ArraySnapshot,
  params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'empiler'
  const labels = L.empiler
  const valeur = numberParam(params, 'valeur')
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  bodyEmpiler(r, valeur)
  return r.finish(fn, labels.end.line)
}

export function runDepiler(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'depiler'
  const labels = L.depiler
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  bodyDepiler(r)
  return r.finish(fn, labels.end.line)
}

export function runSommetPile(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'sommetPile'
  const labels = L.sommetPile
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const sommet = r.globalInt('sommet')
  const empty = sommet === -1
  conditionStep(
    r,
    fn,
    labels.ifVide.line,
    'pileVide(p)',
    empty,
    C.stackEmptyReason(sommet, empty),
  )
  if (empty) {
    r.setReturnValue(-1)
    r.step(fn, labels.returnError.line, C.peekEmpty)
    return r.finish(fn, labels.end.line)
  }
  const value = cellNumber(r.state, sommet)
  r.setReturnValue(value)
  r.step(fn, labels.returnValue.line, C.peekValue(value, sommet))
  return r.finish(fn, labels.end.line)
}

export function runAfficherPile(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'afficherPile'
  const labels = L.afficherPile
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const sommet = r.globalInt('sommet')
  r.declareLocal('i', { kind: 'int', value: 0 })
  r.step(fn, labels.declI.line, fr.captions.declareValue('i', '0'))

  let i = 0
  let count = 0
  conditionStep(
    r,
    fn,
    labels.whileCond.line,
    'i <= p.sommet',
    i <= sommet,
    i <= sommet
      ? `\`i\` vaut 0 et \`sommet\` vaut \`${sommet}\` : on entre dans la boucle.`
      : `\`sommet\` vaut \`${sommet}\` : la pile est vide.`,
  )
  while (i <= sommet) {
    const value = cellNumber(r.state, i)
    r.incrementTraversed()
    r.addConsole(`${value} `)
    r.step(fn, labels.printf.line, C.displayCell(value, i))
    i += 1
    count += 1
    r.setLocal('i', { kind: 'int', value: i })
    r.step(fn, labels.increment.line, fr.captions.declareValue('i', String(i)))
    conditionStep(
      r,
      fn,
      labels.whileCond.line,
      'i <= p.sommet',
      i <= sommet,
      i <= sommet
        ? `\`i\` vaut \`${i}\` : la case suivante est encore dans la pile.`
        : `\`i\` vaut \`${i}\`, au-delà de \`sommet\` = \`${sommet}\` : la boucle s’arrête.`,
    )
  }

  r.step(fn, labels.endWhile.line, C.displayDone(count))
  r.addConsole('\n')
  r.step(fn, labels.newline.line, fr.captions.printfNewline)
  return r.finish(fn, labels.end.line)
}

export function runEmpilerCopie(
  state: ArraySnapshot,
  params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'empilerCopie'
  const labels = L.empilerCopie
  const numero = numberParam(params, 'numero')
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn, { numero: { kind: 'int', value: numero } })
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  r.step(fn, labels.call.line, C.copyCall(numero))

  r.pushFrame('empiler', { valeur: { kind: 'int', value: numero } })
  r.step('empiler', L.empiler.entry.line, fr.captions.entry('empiler'))
  bodyEmpiler(r, numero)
  r.step('empiler', L.empiler.end.line, fr.captions.functionEnd('empiler'))
  r.popFrame()

  return r.finish(fn, labels.end.line)
}

export function runCorrigerCopie(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'corrigerCopie'
  const labels = L.corrigerCopie
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  r.step(fn, labels.call.line, fr.captions.call('depiler'))

  const value = callDepiler(r)
  r.declareLocal('numero', { kind: 'int', value })
  r.step(fn, labels.call.line, fr.captions.declareValue('numero', String(value)))
  r.clearReturnValue()

  const corrected = value !== -1
  conditionStep(
    r,
    fn,
    labels.ifCorrect.line,
    'numero != -1',
    corrected,
    corrected
      ? `\`numero\` vaut \`${value}\` : la copie peut être corrigée.`
      : '`numero` vaut `-1` : la pile était vide, aucune copie à corriger.',
  )

  if (corrected) {
    r.addConsole(`Correction de la copie ${value}\n`)
    r.step(fn, labels.printf.line, C.correction(value))
  }
  r.step(fn, labels.endIf.line, fr.captions.returnVoid)
  return r.finish(fn, labels.end.line)
}

export function runParenthesesEquilibrees(
  state: ArraySnapshot,
  params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'parenthesesEquilibrees'
  const labels = L.parenthesesEquilibrees
  const texte = textParam(params, 'texte')
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))

  r.setTape({ text: texte, index: 0, status: 'scanning' })
  r.step(fn, labels.callInit.line, fr.captions.call('initPile'))
  r.pushFrame('initPile')
  r.step('initPile', L.initPile.entry.line, fr.captions.entry('initPile'))
  r.setGlobalInt('sommet', -1)
  r.step('initPile', L.initPile.reset.line, C.initStack)
  r.step('initPile', L.initPile.end.line, fr.captions.functionEnd('initPile'))
  r.popFrame()

  let i = 0
  let sommet = r.globalInt('sommet')
  r.declareLocal('i', { kind: 'int', value: 0 })

  while (i < texte.length) {
    const char = texte[i] ?? ''
    r.setTape({ text: texte, index: i, status: 'scanning' })
    r.incrementTraversed()

    conditionStep(
      r,
      fn,
      labels.forCond.line,
      "texte[i] != '\\0'",
      true,
      `\`i\` vaut \`${i}\` : on lit le caractère « ${char} ».`,
    )

    if (char === '(') {
      conditionStep(
        r,
        fn,
        labels.ifOpen.line,
        "texte[i] == '('",
        true,
        C.charOpen(char, i),
      )
      sommet += 1
      r.setGlobalInt('sommet', sommet)
      r.writeCell(sommet, charAtom(char))
      r.step(
        fn,
        labels.push.line,
        `\`empiler\` ajoute « ${char} » : \`sommet\` passe à \`${sommet}\` et \`elements[${sommet}]\` reçoit la parenthèse.`,
      )
    } else if (char === ')') {
      conditionStep(
        r,
        fn,
        labels.elseClose.line,
        "texte[i] == ')'",
        true,
        C.charClose(char, i),
      )
      const empty = sommet === -1
      conditionStep(
        r,
        fn,
        labels.ifEmptyClose.line,
        'pileVide(p)',
        empty,
        empty
          ? 'La pile est vide : il n’y a aucune ouvrante à refermer.'
          : `La pile contient une ouvrante : \`sommet\` vaut \`${sommet}\`.`,
      )
      if (empty) {
        r.setTape({ text: texte, index: i, status: 'invalid' })
        r.setReturnValue(0)
        r.step(fn, labels.returnInvalid.line, C.parenthEmptyError)
        return r.finish(
          fn,
          labels.end.line,
          'Parenthèses déséquilibrées : une fermante apparaît alors que la pile est vide.',
        )
      }
      sommet -= 1
      r.setGlobalInt('sommet', sommet)
      r.step(fn, labels.pop.line, C.parenthPop)
      r.step(fn, labels.endIfEmptyClose.line, fr.captions.returnVoid)
    } else {
      r.step(fn, labels.endClose.line, C.charIgnored(char, i))
    }

    i += 1
    r.setLocal('i', { kind: 'int', value: i })
    r.step(fn, labels.endClose.line, C.nextCharacter(i - 1))
  }

  r.setTape({ text: texte, index: texte.length, status: 'scanning' })
  r.step(fn, labels.endLoop.line, C.loopDone)
  const valid = sommet === -1
  r.setTape({
    text: texte,
    index: texte.length,
    status: valid ? 'valid' : 'invalid',
  })
  r.setReturnValue(valid ? 1 : 0)
  conditionStep(
    r,
    fn,
    labels.returnResult.line,
    'pileVide(p)',
    valid,
    valid ? C.parenthValid : C.parenthInvalid,
  )
  return r.finish(
    fn,
    labels.end.line,
    valid
      ? 'Parenthèses équilibrées : toutes les ouvrantes ont été refermées.'
      : 'Parenthèses déséquilibrées : des ouvrantes restent dans la pile.',
  )
}
