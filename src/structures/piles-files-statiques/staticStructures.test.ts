import { describe, expect, it } from 'vitest'
import type { CodeSource, OperationDef, ParamValues, Step } from '../../core/types'
import { fr } from '../../i18n/fr'
import { fileCirculaire, fileDecalage, fileOrdinaire } from './code/file'
import { pileCode } from './code/pile'
import { pilesFilesStatiquesPlugin } from './index'
import { FIT_PADDING, MAX_AUTO_K, MIN_AUTO_K, fitCamera } from './geometry'
import {
  MAX_CAPACITY,
  MAX_CELLS,
  cellValue,
  checkInvariants,
  circularMemoryRole,
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
import {
  RING_ARROW_GAP,
  RING_CANVAS,
  RING_FIT_INSETS,
  RING_TRACK_RADIUS,
  rectGap,
  rectInside,
  ringFitBounds,
  ringGeometry,
  wrapArcPoints,
} from './ringGeometry'
import type { RingGeometry, RingRect } from './ringGeometry'

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

describe('rôles mémoire de la file circulaire', () => {
  it('ne combine av et ar que sur la case unique, pour tous les repères', () => {
    for (let capacity = 3; capacity <= MAX_CAPACITY; capacity += 1) {
      for (let av = -1; av < capacity; av += 1) {
        for (let ar = -1; ar < capacity; ar += 1) {
          for (let taille = 0; taille <= capacity; taille += 1) {
            const roles = Array.from({ length: capacity }, (_, index) =>
              circularMemoryRole(index, { av, ar, taille }),
            )
            const both = roles.flatMap((role, index) =>
              role === 'both' ? [index] : [],
            )
            expect(both.length, `N=${capacity} av=${av} ar=${ar} taille=${taille}`).toBeLessThanOrEqual(1)

            if (taille === 0) {
              expect(roles.every((role) => role === null)).toBe(true)
              continue
            }
            if (taille === 1) {
              const expected = av === ar && av >= 0 ? [av] : []
              expect(both).toEqual(expected)
              expect(
                roles.filter((role) => role !== null).length,
                `N=${capacity} av=${av} ar=${ar} taille=1`,
              ).toBe(expected.length)
              continue
            }
            if (av >= 0) {
              expect(roles[av], `av N=${capacity} taille=${taille}`).not.toBeNull()
            }
            if (ar >= 0) {
              expect(roles[ar], `ar N=${capacity} taille=${taille}`).not.toBeNull()
            }
          }
        }
      }
    }
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

describe('géométrie de l’anneau', () => {
  interface NamedBox {
    name: string
    rect: RingRect
  }

  function collectBoxes(ring: RingGeometry): NamedBox[] {
    const boxes: NamedBox[] = []
    for (const slot of ring.slots) {
      if (slot.valueBox) boxes.push({ name: `valeur ${slot.index}`, rect: slot.valueBox })
      if (slot.labelBox) boxes.push({ name: `libellé ${slot.index}`, rect: slot.labelBox })
      if (slot.badgeBox) boxes.push({ name: `ordre ${slot.index}`, rect: slot.badgeBox })
      boxes.push({ name: `indice ${slot.index}`, rect: slot.indexRect })
    }
    for (const pointer of ring.pointers) {
      boxes.push({ name: `pointeur ${pointer.key}`, rect: pointer.rect })
    }
    if (ring.wrap) boxes.push({ name: 'formule retour', rect: ring.wrap.chipRect })
    return boxes
  }

  function pointRectGap(point: { x: number; y: number }, rect: RingRect): number {
    const dx = Math.max(rect.x - point.x, point.x - (rect.x + rect.width), 0)
    const dy = Math.max(rect.y - point.y, point.y - (rect.y + rect.height), 0)
    return Math.hypot(dx, dy)
  }

  function pointInside(point: { x: number; y: number }, rect: RingRect): boolean {
    return (
      point.x > rect.x - 1 &&
      point.x < rect.x + rect.width + 1 &&
      point.y > rect.y - 1 &&
      point.y < rect.y + rect.height + 1
    )
  }

  function expectClearLayout(ring: RingGeometry, label: string): void {
    const boxes = collectBoxes(ring)
    for (const [index, first] of boxes.entries()) {
      expect(
        rectInside(first.rect, RING_CANVAS),
        `${label} : ${first.name} doit rester dans le canevas`,
      ).toBe(true)
      for (const second of boxes.slice(index + 1)) {
        expect(
          rectGap(first.rect, second.rect),
          `${label} : ${first.name} ne doit pas croiser ${second.name}`,
        ).toBeGreaterThan(0.5)
      }
    }

    for (const pointer of ring.pointers) {
      for (const slot of ring.slots) {
        expect(
          rectGap(pointer.rect, slot.indexRect),
          `${label} : ${pointer.key} doit rester à distance de l’indice ${slot.index}`,
        ).toBeGreaterThan(2)
      }
    }

    if (ring.wrap) {
      const source = ring.slots[ring.max - 1]!.indexRect
      const destination = ring.slots[0]!.indexRect
      expect(
        pointRectGap(ring.wrap.start, source),
        `${label} : l’arc doit partir de la case ${ring.max - 1}`,
      ).toBeGreaterThanOrEqual(2)
      expect(pointRectGap(ring.wrap.start, source)).toBeLessThanOrEqual(4.5)
      expect(
        pointRectGap(ring.wrap.end, destination),
        `${label} : l’arc doit arriver sur la case 0`,
      ).toBeGreaterThanOrEqual(2)
      expect(pointRectGap(ring.wrap.end, destination)).toBeLessThanOrEqual(4.5)

      const mid = (ring.wrap.startAngle + ring.wrap.endAngle) / 2
      const chipAngle = Math.atan2(ring.wrap.chipPoint.y, ring.wrap.chipPoint.x)
      const delta = Math.abs(
        Math.atan2(Math.sin(chipAngle - mid), Math.cos(chipAngle - mid)),
      )
      expect(delta, `${label} : la puce doit rester au milieu de l’arc`).toBeLessThan(1e-6)

      for (const point of wrapArcPoints(ring.wrap)) {
        for (const box of boxes) {
          expect(
            pointInside(point, box.rect),
            `${label} : l’arc de retour croise ${box.name}`,
          ).toBe(false)
        }
      }
    }
  }

  it('garde un cadrage fixe, centré et assez grand pour tous les états', () => {
    const stage = { width: 973, height: 428 }
    for (let capacity = 3; capacity <= 8; capacity += 1) {
      const values = Array.from({ length: capacity }, (_, index) => 10 + index)
      let snapshot = createSnapshot('file-circulaire', values, { capacity })
      snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
      snapshot = lastStep(runOperation('file-circulaire', 'defiler', snapshot, {})).snapshot
      snapshot = lastStep(
        runOperation('file-circulaire', 'enfiler', snapshot, { valeur: 71 }),
      ).snapshot

      const states = [
        emptySnapshot('file-circulaire', capacity),
        createSnapshot('file-circulaire', [42], { capacity }),
        createSnapshot('file-circulaire', values, { capacity }),
        snapshot,
      ]
      const fitBounds = ringFitBounds(capacity)
      expect(fitBounds.x + fitBounds.width / 2).toBeCloseTo(0)
      expect(fitBounds.y + fitBounds.height / 2).toBeCloseTo(0)
      const camera = fitCamera(fitBounds, stage, FIT_PADDING, MIN_AUTO_K, MAX_AUTO_K, RING_FIT_INSETS)
      expect(camera.x).toBeCloseTo(stage.width / 2)
      expect(camera.y).toBeCloseTo(
        RING_FIT_INSETS.top + (stage.height - RING_FIT_INSETS.top - RING_FIT_INSETS.bottom) / 2,
      )

      for (const state of states) {
        const ring = ringGeometry(state, { idle: true })
        expect(ring, `capacité ${capacity}`).not.toBeNull()
        if (!ring) continue
        expect(
          rectInside(ring.bounds, fitBounds),
          `capacité ${capacity} : l’état doit tenir dans le cadrage fixe`,
        ).toBe(true)
        const top = camera.y + ring.bounds.y * camera.k
        const bottom = camera.y + (ring.bounds.y + ring.bounds.height) * camera.k
        expect(top, `capacité ${capacity} : le HUD doit rester dégagé`).toBeGreaterThanOrEqual(
          RING_FIT_INSETS.top - 0.5,
        )
        expect(bottom).toBeLessThanOrEqual(stage.height - RING_FIT_INSETS.bottom + 0.5)
      }

      const canvasHeight = stage.height - RING_FIT_INSETS.top - RING_FIT_INSETS.bottom
      const trackShare = (camera.k * RING_TRACK_RADIUS * 2) / canvasHeight
      if (capacity <= 5) expect(trackShare).toBeGreaterThan(0.69)
      else expect(trackShare).toBeGreaterThan(0.55)

      for (let av = 0; av < capacity; av += 1) {
        for (let ar = 0; ar < capacity; ar += 1) {
          const count = ((ar - av + capacity) % capacity) + 1
          const base = createSnapshot('file-circulaire', values.slice(0, count), {
            capacity,
          })
          const cells = Array.from({ length: capacity }, () => null as (typeof base.cells)[number])
          for (let offset = 0; offset < count; offset += 1) {
            cells[(av + offset) % capacity] = base.cells[offset] ?? null
          }
          const state: ArraySnapshot = {
            ...base,
            cells,
            globals: {
              ...base.globals,
              av: { kind: 'int', value: av },
              ar: { kind: 'int', value: ar },
            },
          }
          delete state.circular
          const ring = ringGeometry(state, { idle: true })
          expect(ring, `N=${capacity} av=${av} ar=${ar}`).not.toBeNull()
          if (ring) {
            expect(
              ring.bounds.x,
              `N=${capacity} av=${av} ar=${ar} doit tenir dans le cadrage fixe`,
            ).toBeGreaterThanOrEqual(fitBounds.x - 0.01)
            expect(ring.bounds.y).toBeGreaterThanOrEqual(fitBounds.y - 0.01)
            expect(ring.bounds.x + ring.bounds.width).toBeLessThanOrEqual(
              fitBounds.x + fitBounds.width + 0.01,
            )
            expect(ring.bounds.y + ring.bounds.height).toBeLessThanOrEqual(
              fitBounds.y + fitBounds.height + 0.01,
            )
          }
        }
      }
    }
  })

  it('place les secteurs, valeurs, badges, pilules et arcs sans croisement de 3 à 8 cases', () => {
    for (let capacity = 3; capacity <= 8; capacity += 1) {
      const values = Array.from({ length: capacity }, (_, index) => 10 + index)
      const full = createSnapshot('file-circulaire', values, { capacity })
      const fullRing = ringGeometry(full, { idle: true })
      expect(fullRing, `capacité ${capacity}`).not.toBeNull()
      if (!fullRing) continue
      expect(fullRing.max).toBe(capacity)
      expect(fullRing.taille).toBe(capacity)
      expect(fullRing.full).toBe(true)
      expect(fullRing.slots.map((slot) => slot.index)).toEqual(
        Array.from({ length: capacity }, (_, index) => index),
      )
      expect(fullRing.wrap).not.toBeNull()
      expect(fullRing.wrap?.applied).toBe(false)
      expect(fullRing.wrap?.chipText).toBe(
        fr.staticStructures.viz.wrapFormula(capacity - 1, capacity, 0),
      )
      expect(fullRing.pointers.map((pointer) => pointer.key)).toEqual(['av', 'ar'])
      expectClearLayout(fullRing, `pleine N=${capacity}`)

      const large = createSnapshot(
        'file-circulaire',
        Array.from({ length: capacity }, (_, index) => 100 + index * 7),
        { capacity },
      )
      const stale = lastStep(runOperation('file-circulaire', 'defiler', large, {})).snapshot
      const staleRing = ringGeometry(stale, { idle: true })
      expect(staleRing, `périmée N=${capacity}`).not.toBeNull()
      if (staleRing) {
        expect(staleRing.slots[0]).toMatchObject({
          state: 'stale',
          text: '100',
          label: fr.staticStructures.viz.staleShort,
        })
        expect(staleRing.slots[0]?.valueBox).not.toBeNull()
        expect(staleRing.slots[0]?.labelBox).not.toBeNull()
        expectClearLayout(staleRing, `valeur périmée N=${capacity}`)
      }

      const partial = createSnapshot(
        'file-circulaire',
        Array.from({ length: capacity - 1 }, (_, index) => 20 + index),
        { capacity },
      )
      const partialRing = ringGeometry(partial, { idle: true })
      expect(partialRing, `partielle N=${capacity}`).not.toBeNull()
      if (partialRing) {
        expect(partialRing.free).toBe(1)
        expect(partialRing.slots[capacity - 1]).toMatchObject({
          state: 'free',
          label: fr.staticStructures.viz.free,
        })
        expectClearLayout(partialRing, `case libre N=${capacity}`)
      }

      let partialFull = full
      partialFull = lastStep(
        runOperation('file-circulaire', 'defiler', partialFull, {}),
      ).snapshot
      const enqueueSteps = runOperation('file-circulaire', 'enfiler', partialFull, {
        valeur: 99,
      })
      const upcomingStep = enqueueSteps[0]
      const upcomingSnapshot = upcomingStep?.snapshot
      expect(upcomingSnapshot?.circular?.formula).toMatchObject({
        kind: 'enfiler',
        from: capacity - 1,
        to: 0,
        wrapped: true,
        applied: false,
      })
      if (upcomingSnapshot) {
        const upcoming = ringGeometry(upcomingSnapshot, { idle: true })
        expect(upcoming, `à venir N=${capacity}`).not.toBeNull()
        if (upcoming) {
          expect(upcoming.wrap?.applied).toBe(false)
          expectClearLayout(upcoming, `retour à venir N=${capacity}`)
        }
      }

      const wrapped = lastStep(enqueueSteps).snapshot
      expect(wrapped.circular).toMatchObject({
        av: 1,
        ar: 0,
        taille: capacity,
        order: [...Array.from({ length: capacity - 1 }, (_, index) => index + 1), 0],
      })
      const wrappedRing = ringGeometry(wrapped, { idle: true })
      expect(wrappedRing, `retour franchi N=${capacity}`).not.toBeNull()
      if (wrappedRing) {
        expect(wrappedRing.wrap?.applied).toBe(true)
        expect(wrappedRing.pointers.map((pointer) => pointer.key)).toEqual(['av', 'ar'])
        expectClearLayout(wrappedRing, `retour franchi N=${capacity}`)
      }

      const one = createSnapshot('file-circulaire', [42], { capacity })
      const oneRing = ringGeometry(one, { idle: true })
      expect(oneRing, `un élément N=${capacity}`).not.toBeNull()
      if (oneRing) {
        expect(oneRing.one).toBe(true)
        expect(oneRing.pointers).toHaveLength(1)
        expect(oneRing.pointers[0]).toMatchObject({ key: 'both', tone: 'both' })
        expect(oneRing.pointers[0]?.text).toBe('av = ar = 0')
        expect(oneRing.slots[0]?.head).toBe(true)
        expect(oneRing.slots[0]?.tail).toBe(true)
        expect(oneRing.wrap).toBeNull()
        expectClearLayout(oneRing, `un élément N=${capacity}`)
      }

      const empty = emptySnapshot('file-circulaire', capacity)
      const emptyRing = ringGeometry(empty, { idle: true })
      expect(emptyRing, `vide N=${capacity}`).not.toBeNull()
      if (emptyRing) {
        expect(emptyRing.empty).toBe(true)
        expect(emptyRing.pointers).toHaveLength(2)
        expect(emptyRing.pointers.every((pointer) => pointer.dashed)).toBe(true)
        expect(emptyRing.pointers.map((pointer) => pointer.key)).toEqual(['av', 'ar'])
        expect(emptyRing.wrap).toBeNull()
        for (const pointer of emptyRing.pointers) {
          const centreDistance = Math.hypot(
            pointer.rect.x + pointer.rect.width / 2,
            pointer.rect.y + pointer.rect.height / 2,
          )
          expect(
            centreDistance,
            `vide N=${capacity} : ${pointer.key} doit rester hors de l’anneau`,
          ).toBeGreaterThan(RING_TRACK_RADIUS)
          expect(
            rectGap(pointer.rect, emptyRing.slots[0]!.indexRect),
            `vide N=${capacity} : ${pointer.key} doit éviter la case 0`,
          ).toBeGreaterThan(8)
        }
        expectClearLayout(emptyRing, `vide N=${capacity}`)
      }
    }
  })

  it('garde la bannière vide hors de l’anneau à 1366×768 et 1920×1080', () => {
    // `.viz-stage.is-ring .ss-empty-banner`: top 96px, right 12px, width 300px.
    const cta = (stage: { width: number }) => ({
      x: stage.width - 12 - 300,
      y: 96,
      width: 300,
      height: 84,
    })
    const stages = [
      { width: 899, height: 432 },
      { width: 1317.5, height: 608 },
    ]
    for (const stage of stages) {
      const camera = fitCamera(
        ringFitBounds(5),
        stage,
        FIT_PADDING,
        MIN_AUTO_K,
        MAX_AUTO_K,
        RING_FIT_INSETS,
      )
      const banner = cta(stage)
      const world = {
        x: (banner.x - camera.x) / camera.k,
        y: (banner.y - camera.y) / camera.k,
        width: banner.width / camera.k,
        height: banner.height / camera.k,
      }
      const nearestX = Math.max(world.x, -world.x - world.width, 0)
      const nearestY = Math.max(world.y, -world.y - world.height, 0)
      expect(
        Math.hypot(nearestX, nearestY),
        `${stage.width}×${stage.height} : la bannière doit rester hors de l’anneau`,
      ).toBeGreaterThan(RING_TRACK_RADIUS)

      const emptyRing = ringGeometry(emptySnapshot('file-circulaire', 5), { idle: true })
      expect(emptyRing).not.toBeNull()
      if (!emptyRing) continue
      for (const slot of emptyRing.slots) {
        expect(rectGap(slot.indexRect, world)).toBeGreaterThan(1)
      }
      for (const pointer of emptyRing.pointers) {
        expect(rectGap(pointer.rect, world)).toBeGreaterThan(1)
      }
    }
  })

  it('termine les flèches du pointeur combiné quatre unités au-dessus de l’indice', () => {
    for (let capacity = 3; capacity <= 8; capacity += 1) {
      const base = createSnapshot('file-circulaire', [42], { capacity })
      for (let index = 0; index < capacity; index += 1) {
        const cells = Array.from({ length: capacity }, () => null as (typeof base.cells)[number])
        cells[index] = base.cells[0] ?? null
        const state: ArraySnapshot = {
          ...base,
          cells,
          globals: {
            ...base.globals,
            av: { kind: 'int', value: index },
            ar: { kind: 'int', value: index },
          },
        }
        delete state.circular
        const ring = ringGeometry(state, { idle: true })
        expect(ring, `N=${capacity} k=${index}`).not.toBeNull()
        if (!ring) continue
        const pointer = ring.pointers[0]!
        const indexRect = ring.slots[index]!.indexRect
        expect(pointer.key, `N=${capacity} k=${index}`).toBe('both')
        expect(pointer.connectors).toHaveLength(2)
        const [firstArrow, secondArrow] = pointer.connectors
        const arrowBase = {
          x: (firstArrow!.to.x + secondArrow!.to.x) / 2,
          y: (firstArrow!.to.y + secondArrow!.to.y) / 2,
        }
        expect(
          pointRectGap(arrowBase, indexRect),
          `N=${capacity} k=${index} : la flèche doit finir au moins ${RING_ARROW_GAP} unités au-dessus de l’indice`,
        ).toBeGreaterThanOrEqual(RING_ARROW_GAP - 0.01)
        if (index === 0) {
          expect(pointRectGap(arrowBase, indexRect)).toBeCloseTo(RING_ARROW_GAP)
        }
        for (const connector of pointer.connectors) {
          expect(
            pointRectGap(connector.to, indexRect),
            `N=${capacity} k=${index} : la flèche ne doit pas toucher l’indice`,
          ).toBeGreaterThan(0.5)
        }
        expect(
          Math.abs(pointer.connectors[0]!.to.x - pointer.connectors[1]!.to.x) +
            Math.abs(pointer.connectors[0]!.to.y - pointer.connectors[1]!.to.y),
          `N=${capacity} k=${index} : les deux flèches doivent être décalées`,
        ).toBeGreaterThan(1)
        expect(
          rectGap(pointer.rect, indexRect),
          `N=${capacity} k=${index} : le pointeur ne doit pas couvrir l’indice`,
        ).toBeGreaterThan(2)
        expect(rectInside(pointer.rect, RING_CANVAS)).toBe(true)
      }
    }
  })

  it('ne dessine l’anneau que pour la file circulaire', () => {
    expect(ringGeometry(emptySnapshot('pile'))).toBeNull()
    expect(ringGeometry(emptySnapshot('file-ordinaire'))).toBeNull()
    expect(ringGeometry(emptySnapshot('file-decalage'))).toBeNull()
    expect(ringGeometry(emptySnapshot('file-circulaire'))).not.toBeNull()
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
