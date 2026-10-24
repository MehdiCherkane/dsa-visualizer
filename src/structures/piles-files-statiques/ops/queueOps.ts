import type { ParamValues, Step } from '../../../core/types'
import { fr } from '../../../i18n/fr'
import { fileCirculaire, fileDecalage, fileOrdinaire } from '../code/file'
import type { QueueSource } from '../code/file'
import { intAtom, isEmpty, isFull, liveEntries } from '../memory'
import type { ArrayProfileId, ArraySnapshot } from '../memory'
import { cellNumber, conditionStep, numberParam } from './common'
import { ArrayRecorder } from './runtime'

const C = fr.staticStructures.captions

function queueSource(profile: ArrayProfileId): QueueSource {
  if (profile === 'file-ordinaire') return fileOrdinaire
  if (profile === 'file-decalage') return fileDecalage
  return fileCirculaire
}

function fullExpression(profile: ArrayProfileId): string {
  if (profile === 'file-ordinaire') return 'f->ar == MAX - 1'
  if (profile === 'file-decalage') return 'f->ar == MAX'
  return '(f->ar + 1) % MAX == f->av'
}

function emptyExpression(profile: ArrayProfileId): string {
  if (profile === 'file-decalage') return 'f->ar == 0'
  return 'f->av == -1'
}

function fullReason(r: ArrayRecorder): string {
  const profile = r.state.profile
  const capacity = r.state.capacity
  if (profile === 'file-ordinaire') {
    const ar = r.globalInt('ar')
    return C.fileFullReasonOrdinaire(ar, isFull(r.state), capacity)
  }
  if (profile === 'file-decalage') {
    const ar = r.globalInt('ar')
    return C.fileFullReasonDecalage(ar, isFull(r.state), capacity)
  }
  const av = r.globalInt('av')
  const ar = r.globalInt('ar')
  return C.fileFullReasonCirculaire(ar, av, isFull(r.state), capacity)
}

function emptyReason(r: ArrayRecorder): string {
  const profile = r.state.profile
  if (profile === 'file-ordinaire') {
    const av = r.globalInt('av')
    return C.fileEmptyReasonOrdinaire(av, isEmpty(r.state))
  }
  if (profile === 'file-decalage') {
    const ar = r.globalInt('ar')
    return C.fileEmptyReasonDecalage(ar, isEmpty(r.state))
  }
  const av = r.globalInt('av')
  return C.fileEmptyReasonCirculaire(av, isEmpty(r.state))
}

function bodyEnfiler(r: ArrayRecorder, valeur: number): void {
  const profile = r.state.profile
  const fn = 'enfiler'
  const labels = queueSource(profile).labels.enfiler
  const capacity = r.state.capacity
  const full = isFull(r.state)

  conditionStep(
    r,
    fn,
    labels.ifPleine.line,
    fullExpression(profile),
    full,
    fullReason(r),
  )

  if (full) {
    r.addConsole('File pleine\n')
    r.step(fn, labels.printfFull.line, C.fullErrorFile)
    r.step(fn, labels.returnFull.line, fr.captions.returnVoid)
    return
  }

  if (profile === 'file-ordinaire') {
    const av = r.globalInt('av')
    const empty = av === -1
    conditionStep(
      r,
      fn,
      labels.ifVide.line,
      'fileVide(*f)',
      empty,
      C.fileEmptyReasonOrdinaire(av, empty),
    )
    if (empty) {
      r.setGlobalInt('av', 0)
      r.step(fn, labels.setAv.line, C.enqueueAvZero)
    }
    const ar = r.globalInt('ar')
    const next = ar + 1
    r.setGlobalInt('ar', next)
    r.step(fn, labels.incrementAr.line, C.enqueueArIncrement(next))
    r.writeCell(next, intAtom(valeur))
    r.step(fn, labels.write.line, C.enqueueWrite(valeur, next))
    return
  }

  if (profile === 'file-decalage') {
    const ar = r.globalInt('ar')
    r.writeCell(ar, intAtom(valeur))
    r.step(fn, labels.write.line, C.enqueueWrite(valeur, ar))
    r.setGlobalInt('ar', ar + 1)
    r.step(fn, labels.incrementAr.line, C.enqueueArIncrement(ar + 1))
    return
  }

  const av = r.globalInt('av')
  const ar = r.globalInt('ar')
  const wasEmpty = av === -1
  const next = (ar + 1) % capacity
  r.setGlobalInt('ar', next)
  r.step(fn, labels.advanceAr.line, C.enqueueWrap(next))
  conditionStep(
    r,
    fn,
    labels.ifVide.line,
    'fileVide(*f)',
    wasEmpty,
    C.fileEmptyReasonCirculaire(av, wasEmpty),
  )
  if (wasEmpty) {
    r.setGlobalInt('av', next)
    r.step(fn, labels.setAv.line, C.enqueueAvRejointAr(next))
  }
  r.writeCell(next, intAtom(valeur))
  r.step(fn, labels.write.line, C.enqueueWrite(valeur, next))
}

function bodyDefiler(r: ArrayRecorder): { value: number; early: boolean } {
  const profile = r.state.profile
  const fn = 'defiler'
  const labels = queueSource(profile).labels.defiler
  const capacity = r.state.capacity
  const empty = isEmpty(r.state)

  conditionStep(
    r,
    fn,
    labels.ifVide.line,
    emptyExpression(profile),
    empty,
    emptyReason(r),
  )

  if (empty) {
    r.setReturnValue(-1)
    r.step(fn, labels.returnError.line, C.dequeueEmpty)
    return { value: -1, early: true }
  }

  if (profile === 'file-ordinaire') {
    const av = r.globalInt('av')
    const value = cellNumber(r.state, av)
    r.declareLocal('valeur', { kind: 'int', value })
    r.step(fn, labels.read.line, C.dequeueRead(value, av))
    const next = av + 1
    r.setGlobalInt('av', next)
    r.step(fn, labels.advanceAv.line, C.dequeueAdvanceAv(next))
    const ar = r.globalInt('ar')
    const becameEmpty = next > ar
    conditionStep(
      r,
      fn,
      labels.ifBecameEmpty.line,
      'f->av > f->ar',
      becameEmpty,
      becameEmpty ? C.dequeueReset : C.dequeueKeep,
    )
    if (becameEmpty) {
      r.setGlobalInt('av', -1)
      r.step(fn, labels.resetAv.line, C.resetAv)
      r.setGlobalInt('ar', -1)
      r.step(fn, labels.resetAr.line, C.resetAr)
      r.step(fn, labels.endIfEmpty.line, C.dequeueReset)
    }
    r.setReturnValue(value)
    r.step(fn, labels.returnValue.line, fr.captions.returnInt(value))
    return { value, early: false }
  }

  if (profile === 'file-decalage') {
    const ar = r.globalInt('ar')
    const value = cellNumber(r.state, 0)
    r.declareLocal('valeur', { kind: 'int', value })
    r.step(fn, labels.read.line, C.dequeueRead(value, 0))
    r.declareLocal('i', { kind: 'int', value: 0 })

    let i = 0
    while (i < ar - 1) {
      const shifted = cellNumber(r.state, i + 1)
      r.setLocal('i', { kind: 'int', value: i })
      r.step(
        fn,
        labels.forCond.line,
        `\`i\` vaut \`${i}\` : on décale la valeur de la case ${i + 1} vers la case ${i}.`,
      )
      r.moveCell(i + 1, i)
      r.incrementTraversed()
      r.step(fn, labels.shift.line, C.dequeueShiftCell(i, shifted))
      i += 1
    }

    r.setLocal('i', { kind: 'int', value: i })
    conditionStep(
      r,
      fn,
      labels.forCond.line,
      'i < f->ar - 1',
      false,
      'Toutes les valeurs restantes ont été décalées : la boucle s’arrête.',
    )
    r.setGlobalInt('ar', ar - 1)
    r.step(fn, labels.decrement.line, C.dequeueDecrement(ar - 1))
    r.setReturnValue(value)
    r.step(fn, labels.returnValue.line, C.dequeueShiftDone(value, ar))
    return { value, early: false }
  }

  const av = r.globalInt('av')
  const ar = r.globalInt('ar')
  const value = cellNumber(r.state, av)
  r.declareLocal('valeur', { kind: 'int', value })
  r.step(fn, labels.read.line, C.dequeueRead(value, av))

  const last = av === ar
  conditionStep(
    r,
    fn,
    labels.ifBecameEmpty.line,
    'f->av == f->ar',
    last,
    last ? C.dequeueLastReset : C.dequeueKeepCirculaire,
  )
  if (last) {
    r.setGlobalInt('av', -1)
    r.step(fn, labels.resetAv.line, C.resetAv)
    r.setGlobalInt('ar', -1)
    r.step(fn, labels.resetAr.line, C.resetAr)
  } else {
    const next = (av + 1) % capacity
    r.setGlobalInt('av', next)
    r.step(fn, labels.advanceAv.line, C.dequeueCircularAdvance(next))
  }
  r.setReturnValue(value)
  r.step(fn, labels.returnValue.line, fr.captions.returnInt(value))
  return { value, early: false }
}

function callEnfiler(r: ArrayRecorder, valeur: number): void {
  const fn = 'enfiler'
  const labels = queueSource(r.state.profile).labels.enfiler
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  bodyEnfiler(r, valeur)
  r.step(fn, labels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
  r.clearReturnValue()
}

function callDefiler(r: ArrayRecorder): number {
  const fn = 'defiler'
  const labels = queueSource(r.state.profile).labels.defiler
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const result = bodyDefiler(r)
  r.step(fn, labels.end.line, fr.captions.functionEnd(fn))
  r.popFrame()
  return result.value
}

export function runInitFile(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'initFile'
  const labels = queueSource(state.profile).labels.initFile
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))

  if (state.profile === 'file-decalage') {
    r.setGlobalInt('ar', 0)
    r.step(fn, labels.resetAr.line, C.initFileDecalage)
  } else {
    r.setGlobalInt('av', -1)
    r.step(fn, labels.resetAv.line, C.initFileOrdinaire)
    r.setGlobalInt('ar', -1)
    r.step(fn, labels.resetAr.line, C.initFileCirculaire)
  }
  return r.finish(fn, labels.end.line)
}

export function runEnfiler(
  state: ArraySnapshot,
  params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'enfiler'
  const labels = queueSource(state.profile).labels.enfiler
  const valeur = numberParam(params, 'valeur')
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn, { valeur: { kind: 'int', value: valeur } })
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  bodyEnfiler(r, valeur)
  return r.finish(fn, labels.end.line)
}

export function runDefiler(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'defiler'
  const labels = queueSource(state.profile).labels.defiler
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  bodyDefiler(r)
  return r.finish(fn, labels.end.line)
}

export function runFileVide(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'fileVide'
  const labels = queueSource(state.profile).labels.fileVide
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const empty = isEmpty(r.state)
  r.setReturnValue(empty ? 1 : 0)
  conditionStep(
    r,
    fn,
    labels.test.line,
    emptyExpression(state.profile),
    empty,
    emptyReason(r),
  )
  return r.finish(fn, labels.end.line)
}

export function runFilePleine(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'filePleine'
  const labels = queueSource(state.profile).labels.filePleine
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  const full = isFull(r.state)
  r.setReturnValue(full ? 1 : 0)
  conditionStep(
    r,
    fn,
    labels.test.line,
    fullExpression(state.profile),
    full,
    fullReason(r),
  )
  return r.finish(fn, labels.end.line)
}

export function runAfficherFile(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const profile = state.profile
  const fn = 'afficherFile'
  const labels = queueSource(profile).labels.afficherFile
  const capacity = state.capacity
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))

  if (profile === 'file-ordinaire') {
    const av = r.globalInt('av')
    const ar = r.globalInt('ar')

    let i = av
    let count = 0
    r.declareLocal('i', { kind: 'int', value: i })
    conditionStep(
      r,
      fn,
      labels.forCond.line,
      'i <= f.ar',
      i <= ar,
      `\`i\` part de \`av\` = \`${av}\` et \`ar\` vaut \`${ar}\`.`,
    )
    while (i <= ar) {
      const value = cellNumber(r.state, i)
      r.incrementTraversed()
      r.addConsole(`${value} `)
      r.step(fn, labels.printf.line, C.displayCell(value, i))
      i += 1
      count += 1
      r.setLocal('i', { kind: 'int', value: i })
      conditionStep(
        r,
        fn,
        labels.forCond.line,
        'i <= f.ar',
        i <= ar,
        i <= ar
          ? `\`i\` vaut \`${i}\` : la case suivante appartient à la file.`
          : `\`i\` vaut \`${i}\`, au-delà de \`ar\` = \`${ar}\` : la boucle s’arrête.`,
      )
    }
    r.step(fn, labels.endFor.line, C.displayFileDone(count))
    r.addConsole('\n')
    r.step(fn, labels.newline.line, fr.captions.printfNewline)
    return r.finish(fn, labels.end.line)
  }

  if (profile === 'file-decalage') {
    const ar = r.globalInt('ar')
    let i = 0
    let count = 0
    r.declareLocal('i', { kind: 'int', value: 0 })
    conditionStep(
      r,
      fn,
      labels.forCond.line,
      'i < f.ar',
      i < ar,
      `\`ar\` vaut \`${ar}\` : la tête est toujours à l’indice 0.`,
    )
    while (i < ar) {
      const value = cellNumber(r.state, i)
      r.incrementTraversed()
      r.addConsole(`${value} `)
      r.step(fn, labels.printf.line, C.displayCell(value, i))
      i += 1
      count += 1
      r.setLocal('i', { kind: 'int', value: i })
      conditionStep(
        r,
        fn,
        labels.forCond.line,
        'i < f.ar',
        i < ar,
        i < ar
          ? `\`i\` vaut \`${i}\` : il reste des valeurs à afficher.`
          : `\`i\` vaut \`${i}\` = \`ar\` : la boucle s’arrête.`,
      )
    }
    r.step(fn, labels.endFor.line, C.displayFileDone(count))
    r.addConsole('\n')
    r.step(fn, labels.newline.line, fr.captions.printfNewline)
    return r.finish(fn, labels.end.line)
  }

  const av = r.globalInt('av')
  const ar = r.globalInt('ar')
  const empty = av === -1
  conditionStep(
    r,
    fn,
    labels.ifEmpty.line,
    'fileVide(f)',
    empty,
    C.fileEmptyReasonCirculaire(av, empty),
  )
  if (empty) {
    r.addConsole('\n')
    r.step(fn, labels.printfEmpty.line, C.displayFileEmpty)
    r.step(fn, labels.returnEmpty.line, fr.captions.returnVoid)
    return r.finish(fn, labels.end.line)
  }

  let i = av
  let count = 0
  r.declareLocal('i', { kind: 'int', value: i })
  r.step(fn, labels.declI.line, fr.captions.declareValue('i', String(i)))
  r.step(fn, labels.whileStart.line, 'La file n’est pas vide : on parcourt de `av` à `ar`.')

  for (;;) {
    const value = cellNumber(r.state, i)
    r.incrementTraversed()
    r.addConsole(`${value} `)
    r.step(fn, labels.printf.line, C.displayCell(value, i))
    const last = i === ar
    conditionStep(
      r,
      fn,
      labels.ifLast.line,
      'i == f.ar',
      last,
      last
        ? '`i` a atteint `ar` : c’est le dernier élément de la file.'
        : '`i` n’a pas encore atteint `ar`.',
    )
    if (last) {
      r.step(fn, labels.break.line, 'Dernier élément affiché : on sort de la boucle.')
      break
    }
    i = (i + 1) % capacity
    count += 1
    r.setLocal('i', { kind: 'int', value: i })
    r.step(fn, labels.next.line, C.displayAdvance(i))
  }

  r.step(fn, labels.endWhile.line, C.displayFileDone(count + 1))
  r.addConsole('\n')
  r.step(fn, labels.newline.line, fr.captions.printfNewline)
  return r.finish(fn, labels.end.line)
}

export function runEnregistrerArrivee(
  state: ArraySnapshot,
  params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'enregistrerArrivee'
  const labels = queueSource(state.profile).labels.enregistrerArrivee
  const numero = numberParam(params, 'numero')
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn, { numero: { kind: 'int', value: numero } })
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  r.step(fn, labels.call.line, fr.captions.call('enfiler'))
  callEnfiler(r, numero)
  return r.finish(fn, labels.end.line)
}

export function runGuichetSuivant(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'guichetSuivant'
  const labels = queueSource(state.profile).labels.guichetSuivant
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))
  r.step(fn, labels.call.line, fr.captions.call('defiler'))
  const value = callDefiler(r)
  r.declareLocal('numero', { kind: 'int', value })
  r.step(fn, labels.call.line, fr.captions.declareValue('numero', String(value)))
  r.clearReturnValue()

  const served = value !== -1
  conditionStep(
    r,
    fn,
    labels.ifServed.line,
    'numero != -1',
    served,
    served ? C.guichetServedReason(value) : C.guichetEmptyReason,
  )
  if (served) {
    r.addConsole(`Guichet : etudiant ${value} servi\n`)
    r.step(fn, labels.printf.line, C.guichetServed(value))
  }
  r.step(fn, labels.endIf.line, fr.captions.returnVoid)
  return r.finish(fn, labels.end.line)
}

export function runRecupererMax(
  state: ArraySnapshot,
  _params: ParamValues,
): Step<ArraySnapshot>[] {
  const fn = 'recupererMax'
  const labels = queueSource('file-circulaire').labels.recupererMax
  const r = new ArrayRecorder(state)
  r.clearTape()
  r.pushFrame(fn)
  r.step(fn, labels.entry.line, fr.captions.entry(fn))

  const empty = isEmpty(r.state)
  conditionStep(
    r,
    fn,
    labels.ifVide.line,
    'fileVide(*f)',
    empty,
    emptyReason(r),
  )
  if (empty) {
    r.setReturnValue(-1)
    r.step(fn, labels.returnError.line, C.recupererMaxEmpty)
    return r.finish(fn, labels.end.line)
  }

  const count = liveEntries(r.state).length
  const av = r.globalInt('av')
  const maxValue = cellNumber(r.state, av)
  r.declareLocal('n', { kind: 'int', value: count })
  r.step(fn, labels.declN.line, C.recupererMaxSize(count))
  r.declareLocal('max', { kind: 'int', value: maxValue })
  r.step(fn, labels.declMax.line, fr.captions.declareValue('max', String(maxValue)))

  let i = 0
  let max = maxValue
  r.declareLocal('i', { kind: 'int', value: 0 })
  while (i < count) {
    r.setLocal('i', { kind: 'int', value: i })
    r.step(
      fn,
      labels.scanFor.line,
      fr.captions.condition(
        'i < n',
        true,
        i === 0
          ? C.recupererMaxFirstPass
          : `\`i\` vaut \`${i}\` : on examine l’élément suivant sans changer son ordre.`,
      ),
    )
    r.step(fn, labels.scanCallDefiler.line, fr.captions.call('defiler'))
    const value = callDefiler(r)
    r.incrementTraversed()
    r.declareLocal('x', { kind: 'int', value })
    r.step(fn, labels.scanCallDefiler.line, fr.captions.declareValue('x', String(value)))
    r.clearReturnValue()

    const higher = value > max
    conditionStep(
      r,
      fn,
      labels.scanIfMax.line,
      'x > max',
      higher,
      higher
        ? C.recupererMaxFound(value)
        : `\`${value}\` n’est pas supérieur à \`${max}\` : le maximum courant ne change pas.`,
    )
    if (higher) {
      max = value
      r.setLocal('max', { kind: 'int', value: max })
      r.step(fn, labels.scanSetMax.line, C.recupererMaxFound(value))
    }
    r.step(fn, labels.scanCallEnfiler.line, fr.captions.call('enfiler'))
    callEnfiler(r, value)
    r.step(fn, labels.scanEndFor.line, C.recupererMaxFirstPass)
    i += 1
  }

  r.setLocal('i', { kind: 'int', value: i })
  conditionStep(
    r,
    fn,
    labels.scanFor.line,
    'i < n',
    false,
    'Premier tour terminé : toutes les valeurs ont été remises en queue.',
  )

  r.declareLocal('retire', { kind: 'int', value: 0 })
  r.step(fn, labels.declRetire.line, fr.captions.declareValue('retire', '0'))

  let removed = false
  i = 0
  let retained = 0
  while (i < count) {
    r.setLocal('i', { kind: 'int', value: i })
    r.step(
      fn,
      labels.removeFor.line,
      fr.captions.condition(
        'i < n',
        true,
        i === 0
          ? 'Deuxième tour : on retire une seule copie du maximum.'
          : `\`i\` vaut \`${i}\` : on remet les autres valeurs en queue.`,
      ),
    )
    r.step(fn, labels.removeCallDefiler.line, fr.captions.call('defiler'))
    const value = callDefiler(r)
    r.incrementTraversed()
    r.setLocal('x', { kind: 'int', value })
    r.step(fn, labels.removeCallDefiler.line, fr.captions.declareValue('x', String(value)))
    r.clearReturnValue()

    const take = !removed && value === max
    conditionStep(
      r,
      fn,
      labels.removeIfMax.line,
      '!retire && x == max',
      take,
      take
        ? C.recupererMaxRemove(max)
        : `\`${value}\` reste dans la file : le premier maximum a déjà été retiré ou ce n’est pas lui.`,
    )
    if (take) {
      removed = true
      r.setLocal('retire', { kind: 'int', value: 1 })
      r.step(fn, labels.removeSetRetire.line, C.recupererMaxRemove(max))
      r.step(fn, labels.removeEndIf.line, 'Le maximum est retiré ; on ne le remet pas en queue.')
    } else {
      retained += 1
      r.step(fn, labels.removeElse.line, C.recupererMaxKeep(value))
      r.step(fn, labels.removeCallEnfiler.line, fr.captions.call('enfiler'))
      callEnfiler(r, value)
      r.step(fn, labels.removeEndIf.line, C.recupererMaxKeep(value))
    }
    i += 1
  }

  r.setLocal('i', { kind: 'int', value: i })
  conditionStep(
    r,
    fn,
    labels.removeFor.line,
    'i < n',
    false,
    `Deuxième tour terminé : ${retained} valeur${retained > 1 ? 's ont' : ' a'} été remise${retained > 1 ? 's' : ''} en queue.`,
  )

  r.setReturnValue(max)
  r.step(fn, labels.returnMax.line, C.recupererMaxDone(max))
  return r.finish(fn, labels.end.line)
}
