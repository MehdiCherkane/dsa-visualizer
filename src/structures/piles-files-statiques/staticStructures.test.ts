import { describe, expect, it } from 'vitest'
import type { CodeSource, OperationDef, ParamValues, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { fileCirculaire, fileDecalage, fileOrdinaire } from './code/file'
import { pileCode } from './code/pile'
import { pilesFilesStatiquesPlugin } from './index'
import { fitCamera } from './geometry'
import {
  MAX_CELLS,
  cellValue,
  checkInvariants,
  cloneSnapshot,
  createSnapshot,
  emptySnapshot,
  isFull,
  liveEntries,
  occupiedIndices,
  readGlobalInt,
} from './memory'
import type { ArrayProfileId, ArraySnapshot } from './memory'
import {
  fileCirculaireOperations,
  fileDecalageOperations,
  fileOrdinaireOperations,
  pileOperations,
} from './operations'
import {
  fileCirculaireScenarios,
  fileDecalageScenarios,
  fileOrdinaireScenarios,
  pileScenarios,
} from './scenarios'

const profileIds: ArrayProfileId[] = [
  'pile',
  'file-ordinaire',
  'file-decalage',
  'file-circulaire',
]

const operationsByProfile: Record<ArrayProfileId, OperationDef<ArraySnapshot>[]> = {
  pile: pileOperations,
  'file-ordinaire': fileOrdinaireOperations,
  'file-decalage': fileDecalageOperations,
  'file-circulaire': fileCirculaireOperations,
}

const codeByProfile: Record<ArrayProfileId, Record<string, CodeSource>> = {
  pile: pileCode,
  'file-ordinaire': fileOrdinaire.code,
  'file-decalage': fileDecalage.code,
  'file-circulaire': fileCirculaire.code,
}

const allScenarios = [
  ...pileScenarios,
  ...fileOrdinaireScenarios,
  ...fileDecalageScenarios,
  ...fileCirculaireScenarios,
]

function operationFor(profile: ArrayProfileId, id: string): OperationDef<ArraySnapshot> {
  const found = operationsByProfile[profile].find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${profile}/${id}`)
  return found
}

function defaultParams(operation: OperationDef<ArraySnapshot>): ParamValues {
  return Object.fromEntries(
    operation.params.map((param) => [param.name, param.defaultValue]),
  )
}

function runOperation(
  profile: ArrayProfileId,
  id: string,
  state: ArraySnapshot,
  params?: ParamValues,
): Step<ArraySnapshot>[] {
  const operation = operationFor(profile, id)
  return operation.run(state, params ?? defaultParams(operation))
}

function lastStep(steps: Step<ArraySnapshot>[]): Step<ArraySnapshot> {
  const last = steps[steps.length - 1]
  if (!last) throw new Error('Operation produced no step')
  return last
}

function liveValues(snapshot: ArraySnapshot): Array<number | string> {
  return liveEntries(snapshot).map((entry) => entry.value.value)
}

describe('mémoire des tableaux fixes', () => {
  it('crée cinq cases et initialise les repères de chaque profil', () => {
    const pile = emptySnapshot('pile')
    expect(pile.capacity).toBe(MAX_CELLS)
    expect(pile.cells).toHaveLength(MAX_CELLS)
    expect(pile.cells.every((cell) => cell === null)).toBe(true)
    expect(readGlobalInt(pile, 'sommet')).toBe(-1)
    expect(checkInvariants(pile)).toEqual([])

    const file1 = emptySnapshot('file-ordinaire')
    expect(readGlobalInt(file1, 'av')).toBe(-1)
    expect(readGlobalInt(file1, 'ar')).toBe(-1)
    expect(checkInvariants(file1)).toEqual([])

    const file2 = emptySnapshot('file-decalage')
    expect(readGlobalInt(file2, 'ar')).toBe(0)
    expect(checkInvariants(file2)).toEqual([])

    const file3 = emptySnapshot('file-circulaire')
    expect(readGlobalInt(file3, 'av')).toBe(-1)
    expect(readGlobalInt(file3, 'ar')).toBe(-1)
    expect(checkInvariants(file3)).toEqual([])
  })

  it('dérive les cases vivantes des repères et conserve les valeurs périmées', () => {
    const pile = createSnapshot('pile', [12, 7, 25])
    expect(occupiedIndices(pile)).toEqual([0, 1, 2])
    expect(liveValues(pile)).toEqual([12, 7, 25])

    const popped = lastStep(runOperation('pile', 'depiler', pile, {})).snapshot
    expect(occupiedIndices(popped)).toEqual([0, 1])
    expect(liveValues(popped)).toEqual([12, 7])
    expect(cellValue(popped.cells[2])).toBe(25)
    expect(checkInvariants(popped)).toEqual([])
  })

  it('modélise les trois files, y compris une file circulaire pleine', () => {
    const file1 = createSnapshot('file-ordinaire', [65, 66, 67])
    expect(occupiedIndices(file1)).toEqual([0, 1, 2])
    expect(liveValues(file1)).toEqual([65, 66, 67])
    expect(isFull(createSnapshot('file-ordinaire', [1, 2, 3, 4, 5]))).toBe(true)

    const file2 = createSnapshot('file-decalage', [10, 20, 30, 40, 50])
    expect(readGlobalInt(file2, 'ar')).toBe(MAX_CELLS)
    expect(occupiedIndices(file2)).toEqual([0, 1, 2, 3, 4])
    expect(isFull(file2)).toBe(true)

    const file3 = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    expect(occupiedIndices(file3)).toEqual([0, 1, 2, 3, 4])
    expect(isFull(file3)).toBe(true)
    expect(checkInvariants(file3)).toEqual([])

    const wrapped = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    wrapped.globals.av = { kind: 'int', value: 2 }
    wrapped.globals.ar = { kind: 'int', value: 1 }
    const refreshed = cloneSnapshot(wrapped)
    expect(occupiedIndices(refreshed)).toEqual([2, 3, 4, 0, 1])
    expect(liveValues(refreshed)).toEqual([30, 40, 50, 10, 20])
    expect(isFull(refreshed)).toBe(true)
    expect(checkInvariants(refreshed)).toEqual([])
  })

  it('refuse de représenter plus de cinq cases', () => {
    expect(() => createSnapshot('pile', [1, 2, 3, 4, 5, 6])).toThrow(
      'At most 5 cells can be represented',
    )
  })
})

describe('anneau de la file circulaire', () => {
  function expectSlotStates(snapshot: ArraySnapshot): void {
    const circular = snapshot.circular
    expect(circular).toBeDefined()
    if (!circular) return
    expect(circular.max).toBe(snapshot.capacity)
    expect(circular.elements).toHaveLength(snapshot.capacity)
    expect(new Set(circular.elements.map((element) => element.index)).size).toBe(
      snapshot.capacity,
    )
    const used: number[] = []
    for (const element of circular.elements) {
      expect(['used', 'stale', 'free']).toContain(element.state)
      expect(element.value === null).toBe(element.state === 'free')
      if (element.state === 'used') used.push(element.index)
    }
    const sorted = (indices: number[]): number[] =>
      [...indices].sort((left, right) => left - right)
    expect(sorted(used)).toEqual(sorted(circular.order))
    expect(circular.taille).toBe(used.length)
    expect(checkInvariants(snapshot)).toEqual([])
  }

  it('suit le scénario 42, 17, 63, 8, 55 puis deux défiler et 71', () => {
    let snapshot = createSnapshot('file-circulaire', [42, 17, 63, 8, 55])
    expect(snapshot.circular).toMatchObject({
      av: 0,
      ar: 4,
      taille: 5,
      max: 5,
      order: [0, 1, 2, 3, 4],
    })
    expect(snapshot.circular!.elements.map((element) => element.state)).toEqual([
      'used',
      'used',
      'used',
      'used',
      'used',
    ])
    expectSlotStates(snapshot)

    const first = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {}))
    expect(first.console.returnValue).toBe(42)
    snapshot = first.snapshot
    expect(snapshot.circular).toMatchObject({
      av: 1,
      ar: 4,
      taille: 4,
      order: [1, 2, 3, 4],
    })
    expect(snapshot.circular!.elements[0]).toEqual({
      index: 0,
      state: 'stale',
      value: 42,
    })
    expect(snapshot.circular!.formula).toEqual({
      kind: 'defiler',
      from: 0,
      to: 1,
      wrapped: false,
      applied: true,
    })
    expectSlotStates(snapshot)

    const second = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {}))
    expect(second.console.returnValue).toBe(17)
    snapshot = second.snapshot
    expect(snapshot.circular).toMatchObject({
      av: 2,
      ar: 4,
      taille: 3,
      order: [2, 3, 4],
    })
    expect(snapshot.circular!.elements[1]).toEqual({
      index: 1,
      state: 'stale',
      value: 17,
    })
    expectSlotStates(snapshot)

    const enqueue = runOperation('file-circulaire', 'enfiler', snapshot, { valeur: 71 })
    const upcoming = enqueue.find(
      (step) => step.snapshot.circular?.formula?.applied === false,
    )
    expect(upcoming?.snapshot.circular?.formula).toEqual({
      kind: 'enfiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: false,
    })

    const last = lastStep(enqueue).snapshot
    expect(last.circular).toMatchObject({
      av: 2,
      ar: 0,
      taille: 4,
      max: 5,
      order: [2, 3, 4, 0],
    })
    expect(last.circular!.elements[0]).toEqual({
      index: 0,
      state: 'used',
      value: 71,
    })
    expect(last.circular!.elements[1]).toEqual({
      index: 1,
      state: 'stale',
      value: 17,
    })
    expect(last.circular!.formula).toEqual({
      kind: 'enfiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: true,
    })
    expectSlotStates(last)

    for (const step of enqueue) expectSlotStates(step.snapshot)
  })

  it('gère la file pleine, vide et à un seul élément', () => {
    const full = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    expect(full.circular).toMatchObject({ taille: 5, order: [0, 1, 2, 3, 4] })
    expect(full.circular!.elements.every((element) => element.state === 'used')).toBe(true)
    const refused = lastStep(
      runOperation('file-circulaire', 'enfiler', full, { valeur: 60 }),
    )
    expect(refused.console.output).toContain('File pleine')
    expect(refused.snapshot.circular).toMatchObject({ taille: 5 })
    expect(refused.snapshot.circular!.formula).toBeUndefined()
    expectSlotStates(refused.snapshot)

    const empty = emptySnapshot('file-circulaire')
    expect(empty.circular).toMatchObject({
      av: -1,
      ar: -1,
      taille: 0,
      max: 5,
      order: [],
    })
    expect(
      empty.circular!.elements.every(
        (element) => element.state === 'free' && element.value === null,
      ),
    ).toBe(true)
    const underflow = lastStep(runOperation('file-circulaire', 'defiler', empty, {}))
    expect(underflow.console.returnValue).toBe(-1)
    expect(underflow.snapshot.circular).toMatchObject({
      av: -1,
      ar: -1,
      taille: 0,
      order: [],
    })
    expect(underflow.snapshot.circular!.formula).toBeUndefined()
    expectSlotStates(underflow.snapshot)

    const single = createSnapshot('file-circulaire', [7])
    expect(single.circular).toMatchObject({
      av: 0,
      ar: 0,
      taille: 1,
      order: [0],
    })
    const popped = lastStep(runOperation('file-circulaire', 'defiler', single, {}))
    expect(popped.console.returnValue).toBe(7)
    expect(popped.snapshot.circular).toMatchObject({
      av: -1,
      ar: -1,
      taille: 0,
      order: [],
    })
    expect(popped.snapshot.circular!.elements[0]).toEqual({
      index: 0,
      state: 'stale',
      value: 7,
    })
    expect(popped.snapshot.circular!.formula).toEqual({
      kind: 'defiler',
      from: 0,
      to: -1,
      wrapped: false,
      applied: true,
    })
    expectSlotStates(popped.snapshot)
  })

  it('distingue l’arc à venir de l’arc franchi pour enfiler et défiler', () => {
    let snapshot = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
    snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
    expect(snapshot.circular).toMatchObject({ av: 2, ar: 4, order: [2, 3, 4] })

    const enqueue = runOperation('file-circulaire', 'enfiler', snapshot, { valeur: 60 })
    expect(enqueue[0]!.snapshot.circular!.formula).toEqual({
      kind: 'enfiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: false,
    })
    const enqueueApplied = enqueue.find(
      (step) => step.snapshot.circular?.formula?.applied === true,
    )
    expect(enqueueApplied?.snapshot.circular?.formula).toEqual({
      kind: 'enfiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: true,
    })

    let wrapped = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    for (let count = 0; count < 4; count += 1) {
      wrapped = lastStep(runOperation('file-circulaire', 'defiler', wrapped, {})).snapshot
    }
    expect(wrapped.circular).toMatchObject({ av: 4, ar: 4, order: [4] })
    wrapped = lastStep(
      runOperation('file-circulaire', 'enfiler', wrapped, { valeur: 60 }),
    ).snapshot
    expect(wrapped.circular).toMatchObject({ av: 4, ar: 0, order: [4, 0] })

    const dequeue = runOperation('file-circulaire', 'defiler', wrapped, {})
    expect(dequeue[0]!.snapshot.circular!.formula).toEqual({
      kind: 'defiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: false,
    })
    const dequeued = lastStep(dequeue).snapshot
    expect(dequeued.circular).toMatchObject({ av: 0, ar: 0, taille: 1, order: [0] })
    expect(dequeued.circular!.formula).toEqual({
      kind: 'defiler',
      from: 4,
      to: 0,
      wrapped: true,
      applied: true,
    })
    expect(dequeued.circular!.elements[4]).toEqual({
      index: 4,
      state: 'stale',
      value: 50,
    })
    expectSlotStates(dequeued)
  })

  it('accepte les capacités 3 à 8 et refuse les valeurs hors bornes', () => {
    for (let capacity = 3; capacity <= 8; capacity += 1) {
      const values = Array.from({ length: capacity }, (_, index) => index + 1)
      const snapshot = createSnapshot('file-circulaire', values, { capacity })
      expect(snapshot.capacity).toBe(capacity)
      expect(snapshot.cells).toHaveLength(capacity)
      expect(snapshot.circular).toMatchObject({
        taille: capacity,
        max: capacity,
        av: 0,
        ar: capacity - 1,
        order: values.map((_, index) => index),
      })
      expect(isFull(snapshot)).toBe(true)
      expectSlotStates(snapshot)
    }

    const emptyThree = createSnapshot('file-circulaire', [], { capacity: 3 })
    expect(emptyThree.cells).toHaveLength(3)
    expect(emptyThree.circular).toMatchObject({ taille: 0, max: 3, order: [] })
    expect(() =>
      createSnapshot('file-circulaire', [1, 2, 3, 4], { capacity: 3 }),
    ).toThrow('At most 3 cells can be represented')
    expect(() => createSnapshot('file-circulaire', [], { capacity: 9 })).toThrow(
      'Capacity must be an integer between 1 and 8',
    )
  })
})


describe('pile statique — exercices du cours', () => {
  it('empile et dépile en LIFO', () => {
    let snapshot = emptySnapshot('pile')
    for (const [value, sommet] of [
      [12, 0],
      [7, 1],
      [25, 2],
    ] as const) {
      snapshot = lastStep(
        runOperation('pile', 'empiler', snapshot, { valeur: value }),
      ).snapshot
      expect(readGlobalInt(snapshot, 'sommet')).toBe(sommet)
      expect(checkInvariants(snapshot)).toEqual([])
    }

    expect(liveValues(snapshot)).toEqual([12, 7, 25])

    const popped = lastStep(runOperation('pile', 'depiler', snapshot, {}))
    expect(popped.console.returnValue).toBe(25)
    expect(readGlobalInt(popped.snapshot, 'sommet')).toBe(1)
    expect(liveValues(popped.snapshot)).toEqual([12, 7])
  })

  it('refuse le sixième empilement puis accepte après un dépilement', () => {
    const full = createSnapshot('pile', [10, 20, 30, 40, 50])
    const refused = lastStep(runOperation('pile', 'empiler', full, { valeur: 60 }))
    expect(refused.console.output).toContain('Pile pleine')
    expect(refused.console.returnValue).toBeUndefined()
    expect(readGlobalInt(refused.snapshot, 'sommet')).toBe(4)
    expect(liveValues(refused.snapshot)).toEqual([10, 20, 30, 40, 50])

    const afterPop = lastStep(runOperation('pile', 'depiler', full, {})).snapshot
    const accepted = lastStep(
      runOperation('pile', 'empiler', afterPop, { valeur: 60 }),
    )
    expect(accepted.console.output).not.toContain('Pile pleine')
    expect(liveValues(accepted.snapshot)).toEqual([10, 20, 30, 40, 60])
    expect(checkInvariants(accepted.snapshot)).toEqual([])
  })

  it('reproduit la trace PDF de la pile de copies', () => {
    let snapshot = emptySnapshot('pile')
    const sommets: number[] = []
    const outputs: string[] = []

    for (const scenarioStep of pileScenarios[0]!.steps) {
      const last = lastStep(
        runOperation(
          'pile',
          scenarioStep.operationId,
          snapshot,
          scenarioStep.params,
        ),
      )
      snapshot = last.snapshot
      sommets.push(readGlobalInt(snapshot, 'sommet'))
      outputs.push(last.console.output)
    }

    expect(sommets).toEqual([0, 1, 2, 1, 0])
    expect(liveValues(snapshot)).toEqual([12])
    expect(outputs[3]).toContain('Correction de la copie 25')
    expect(outputs[4]).toContain('Correction de la copie 7')
    expect(checkInvariants(snapshot)).toEqual([])
  })

  it('vérifie les parenthèses avec la pile auxiliaire', () => {
    const valid = lastStep(
      runOperation('pile', 'parenthesesEquilibrees', emptySnapshot('pile'), {
        texte: '(()())',
      }),
    )
    expect(valid.console.returnValue).toBe(1)
    expect(valid.snapshot.tape).toMatchObject({
      text: '(()())',
      index: 6,
      status: 'valid',
    })
    expect(readGlobalInt(valid.snapshot, 'sommet')).toBe(-1)
    expect(checkInvariants(valid.snapshot)).toEqual([])

    const missingClose = lastStep(
      runOperation('pile', 'parenthesesEquilibrees', emptySnapshot('pile'), {
        texte: '(()',
      }),
    )
    expect(missingClose.console.returnValue).toBe(0)
    expect(missingClose.snapshot.tape?.status).toBe('invalid')
    expect(readGlobalInt(missingClose.snapshot, 'sommet')).toBe(0)

    const orphanClose = lastStep(
      runOperation('pile', 'parenthesesEquilibrees', emptySnapshot('pile'), {
        texte: ')(',
      }),
    )
    expect(orphanClose.console.returnValue).toBe(0)
    expect(orphanClose.snapshot.tape?.status).toBe('invalid')
    expect(readGlobalInt(orphanClose.snapshot, 'sommet')).toBe(-1)
  })
})

describe('files statiques — trois implantations', () => {
  it('reproduit la trace PDF de la file ordinaire', () => {
    let snapshot = emptySnapshot('file-ordinaire')
    const marks: string[] = []

    for (const value of [65, 66, 67, 68]) {
      snapshot = lastStep(
        runOperation('file-ordinaire', 'enfiler', snapshot, { valeur: value }),
      ).snapshot
      marks.push(`${readGlobalInt(snapshot, 'av')},${readGlobalInt(snapshot, 'ar')}`)
    }

    for (const expected of [65, 66]) {
      const last = lastStep(runOperation('file-ordinaire', 'defiler', snapshot, {}))
      expect(last.console.returnValue).toBe(expected)
      snapshot = last.snapshot
      marks.push(`${readGlobalInt(snapshot, 'av')},${readGlobalInt(snapshot, 'ar')}`)
    }

    expect(marks).toEqual(['0,0', '0,1', '0,2', '0,3', '1,3', '2,3'])
    expect(liveValues(snapshot)).toEqual([67, 68])
    expect(checkInvariants(snapshot)).toEqual([])
  })

  it('montre que la file ordinaire gaspille les cases libérées', () => {
    const full = createSnapshot('file-ordinaire', [10, 20, 30, 40, 50])
    let snapshot = lastStep(runOperation('file-ordinaire', 'defiler', full, {})).snapshot
    snapshot = lastStep(runOperation('file-ordinaire', 'defiler', snapshot, {})).snapshot
    expect([readGlobalInt(snapshot, 'av'), readGlobalInt(snapshot, 'ar')]).toEqual([2, 4])

    const refused = lastStep(
      runOperation('file-ordinaire', 'enfiler', snapshot, { valeur: 60 }),
    )
    expect(refused.console.output).toContain('File pleine')
    expect(readGlobalInt(refused.snapshot, 'av')).toBe(2)
    expect(readGlobalInt(refused.snapshot, 'ar')).toBe(4)
    expect(liveValues(refused.snapshot)).toEqual([30, 40, 50])
  })

  it('reproduit la trace PDF de la file par décalage', () => {
    let snapshot = emptySnapshot('file-decalage')
    const counts: number[] = []

    for (const value of [65, 66, 67, 68]) {
      snapshot = lastStep(
        runOperation('file-decalage', 'enfiler', snapshot, { valeur: value }),
      ).snapshot
      counts.push(readGlobalInt(snapshot, 'ar'))
    }

    const firstPop = lastStep(runOperation('file-decalage', 'defiler', snapshot, {}))
    expect(firstPop.console.returnValue).toBe(65)
    expect(firstPop.counters.traversed).toBe(3)
    snapshot = firstPop.snapshot
    counts.push(readGlobalInt(snapshot, 'ar'))

    const secondPop = lastStep(runOperation('file-decalage', 'defiler', snapshot, {}))
    expect(secondPop.console.returnValue).toBe(66)
    expect(secondPop.counters.traversed).toBe(2)
    snapshot = secondPop.snapshot
    counts.push(readGlobalInt(snapshot, 'ar'))

    expect(counts).toEqual([1, 2, 3, 4, 3, 2])
    expect(occupiedIndices(snapshot)).toEqual([0, 1])
    expect(liveValues(snapshot)).toEqual([67, 68])
    expect(checkInvariants(snapshot)).toEqual([])
  })

  it('refuse un enfiler quand la file par décalage est pleine', () => {
    const full = createSnapshot('file-decalage', [10, 20, 30, 40, 50])
    const refused = lastStep(
      runOperation('file-decalage', 'enfiler', full, { valeur: 60 }),
    )
    expect(refused.console.output).toContain('File pleine')
    expect(readGlobalInt(refused.snapshot, 'ar')).toBe(MAX_CELLS)
    expect(liveValues(refused.snapshot)).toEqual([10, 20, 30, 40, 50])
  })

  it('reproduit la trace PDF de la file circulaire', () => {
    let snapshot = emptySnapshot('file-circulaire')
    const marks: string[] = []

    for (const value of [65, 66, 67, 68]) {
      snapshot = lastStep(
        runOperation('file-circulaire', 'enfiler', snapshot, { valeur: value }),
      ).snapshot
      marks.push(`${readGlobalInt(snapshot, 'av')},${readGlobalInt(snapshot, 'ar')}`)
    }

    for (const expected of [65, 66]) {
      const last = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {}))
      expect(last.console.returnValue).toBe(expected)
      snapshot = last.snapshot
      marks.push(`${readGlobalInt(snapshot, 'av')},${readGlobalInt(snapshot, 'ar')}`)
    }

    expect(marks).toEqual(['0,0', '0,1', '0,2', '0,3', '1,3', '2,3'])
    expect(liveValues(snapshot)).toEqual([67, 68])
    expect(checkInvariants(snapshot)).toEqual([])
  })

  it('réutilise les cases avec le modulo sans réserve cachée', () => {
    let snapshot = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
    snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
    expect([readGlobalInt(snapshot, 'av'), readGlobalInt(snapshot, 'ar')]).toEqual([2, 4])

    const enqueue = runOperation('file-circulaire', 'enfiler', snapshot, { valeur: 60 })
    const wrapped = lastStep(enqueue)
    expect(readGlobalInt(wrapped.snapshot, 'ar')).toBe(0)
    expect(occupiedIndices(wrapped.snapshot)).toEqual([2, 3, 4, 0])
    expect(liveValues(wrapped.snapshot)).toEqual([30, 40, 50, 60])
    expect(
      enqueue.some((step) =>
        step.changes.some(
          (change) =>
            change.kind === 'variable' &&
            change.scope === 'global' &&
            change.name === 'ar' &&
            change.from.kind === 'int' &&
            change.to.kind === 'int' &&
            change.from.value === 4 &&
            change.to.value === 0,
        ),
      ),
    ).toBe(true)

    const fullAgain = lastStep(
      runOperation('file-circulaire', 'enfiler', wrapped.snapshot, { valeur: 70 }),
    )
    expect(isFull(fullAgain.snapshot)).toBe(true)
    expect(liveValues(fullAgain.snapshot)).toEqual([30, 40, 50, 60, 70])

    const popped = lastStep(
      runOperation('file-circulaire', 'defiler', fullAgain.snapshot, {}),
    )
    expect(popped.console.returnValue).toBe(30)
    expect(liveValues(popped.snapshot)).toEqual([40, 50, 60, 70])
    expect(checkInvariants(popped.snapshot)).toEqual([])
  })

  it('refuse un enfiler quand la file circulaire est pleine', () => {
    const full = createSnapshot('file-circulaire', [10, 20, 30, 40, 50])
    const refused = lastStep(
      runOperation('file-circulaire', 'enfiler', full, { valeur: 60 }),
    )
    expect(refused.console.output).toContain('File pleine')
    expect(liveValues(refused.snapshot)).toEqual([10, 20, 30, 40, 50])
  })

  it('récupère le maximum sans casser l’ordre FIFO', () => {
    const initial = createSnapshot('file-circulaire', [42, 17, 63, 8, 55])
    const result = lastStep(
      runOperation('file-circulaire', 'recupererMax', initial, {}),
    )
    expect(result.console.returnValue).toBe(63)
    expect(liveValues(result.snapshot)).toEqual([42, 17, 8, 55])
    expect(isFull(result.snapshot)).toBe(false)
    expect(checkInvariants(result.snapshot)).toEqual([])

    const duplicate = lastStep(
      runOperation(
        'file-circulaire',
        'recupererMax',
        createSnapshot('file-circulaire', [5, 1, 5, 2]),
        {},
      ),
    )
    expect(duplicate.console.returnValue).toBe(5)
    expect(liveValues(duplicate.snapshot)).toEqual([1, 5, 2])

    const empty = lastStep(
      runOperation('file-circulaire', 'recupererMax', emptySnapshot('file-circulaire'), {}),
    )
    expect(empty.console.returnValue).toBe(-1)
    expect(liveValues(empty.snapshot)).toEqual([])
    expect(checkInvariants(empty.snapshot)).toEqual([])
  })
})

describe('cohérence des opérations, du code et des scénarios', () => {
  it('chaque opération pointe vers une ligne du fichier C de son profil', () => {
    for (const profile of profileIds) {
      const code = codeByProfile[profile]
      for (const operation of operationsByProfile[profile]) {
        const steps = operation.run(emptySnapshot(profile), defaultParams(operation))
        expect(steps.length, `${profile}/${operation.id}`).toBeGreaterThan(0)
        for (const step of steps) {
          const source = code[step.fn]
          expect(source, `${profile}/${operation.id}/${step.fn}`).toBeDefined()
          expect(step.line, `${profile}/${operation.id}/${step.fn}`).toBeGreaterThanOrEqual(0)
          expect(step.line, `${profile}/${operation.id}/${step.fn}`).toBeLessThan(
            source!.lines.length,
          )
          expect(step.caption.trim().length).toBeGreaterThan(0)
        }
        expect(checkInvariants(lastStep(steps).snapshot), `${profile}/${operation.id}`).toEqual(
          [],
        )
      }
    }
  })

  it('aucune opération n’insère automatiquement une valeur', () => {
    for (const profile of profileIds) {
      for (const operation of operationsByProfile[profile]) {
        expect(operation.inserts, `${profile}/${operation.id}`).toBe(false)
      }
    }
  })

  it('chaque scénario référence une opération existante et garde les invariants', () => {
    for (const scenario of allScenarios) {
      const profile = scenario.profileId as ArrayProfileId
      expect(operationsByProfile[profile], scenario.id).toBeDefined()
      expect(scenario.steps.length, scenario.id).toBeGreaterThan(0)

      let snapshot = scenario.state
      for (const scenarioStep of scenario.steps) {
        const operation = operationsByProfile[profile].find(
          (candidate) => candidate.id === scenarioStep.operationId,
        )
        expect(operation, `${scenario.id}/${scenarioStep.operationId}`).toBeDefined()
        const steps = operation!.run(snapshot, scenarioStep.params)
        expect(steps.length, `${scenario.id}/${scenarioStep.operationId}`).toBeGreaterThan(0)
        snapshot = lastStep(steps).snapshot
        expect(checkInvariants(snapshot), scenario.id).toEqual([])
      }
    }
  })
})

describe('cadrage de la scène', () => {
  it('réserve le bas de la scène pour le bandeau de l’état vide', () => {
    const bbox = { x: 0, y: 0, width: 100, height: 100 }
    const size = { width: 400, height: 400 }
    const centered = fitCamera(bbox, size, 0, undefined, 10)
    expect(centered.k).toBe(4)
    expect(centered.y).toBe(0)

    const reserved = fitCamera(bbox, size, 0, undefined, 10, {
      top: 80,
      bottom: 160,
    })
    expect(reserved.k).toBe(1.6)
    expect(reserved.y).toBe(80)
    expect(size.height - (reserved.y + bbox.height * reserved.k)).toBe(160)
  })
})

describe('plugin du chapitre 1', () => {
  it('expose quatre profils de cinq cases et les libellés de compteurs', () => {
    expect(pilesFilesStatiquesPlugin.id).toBe('piles-files-statiques')
    expect(pilesFilesStatiquesPlugin.chapter).toBe(1)
    expect(pilesFilesStatiquesPlugin.profiles.map((profile) => profile.id)).toEqual(
      profileIds,
    )

    for (const profile of pilesFilesStatiquesPlugin.profiles) {
      expect(profile.maxNodes).toBe(MAX_CELLS)
      expect(profile.operations.length).toBeGreaterThan(0)
      expect(profile.scenarios.length).toBeGreaterThan(0)
      expect(profile.defaultOperationId).toBeDefined()
      expect(profile.emptyInsertOperationId).toBeDefined()
    }

    expect(pilesFilesStatiquesPlugin.profiles[0]!.counterLabels).toEqual(
      fr.staticStructures.counterLabels.pile,
    )
    expect(pilesFilesStatiquesPlugin.profiles[1]!.counterLabels).toEqual(
      fr.staticStructures.counterLabels.file1,
    )
    expect(pilesFilesStatiquesPlugin.profiles[2]!.counterLabels).toEqual(
      fr.staticStructures.counterLabels.file2,
    )
    expect(pilesFilesStatiquesPlugin.profiles[3]!.counterLabels).toEqual(
      fr.staticStructures.counterLabels.file3,
    )
  })
})
