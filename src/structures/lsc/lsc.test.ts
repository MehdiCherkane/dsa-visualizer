import { describe, expect, it } from 'vitest'
import type { OperationDef, ParamValues } from '../../core/types'
import { circularCode, circularLabels } from './code/circular'
import { intCode } from './code/int'
import { checkInvariants, createSnapshot, listValues, rowNodes } from './memory'
import type { LscItem, LscProfileId, LscSnapshot } from './memory'
import { circularOperations, linearOperations } from './operations'
import { circularScenarios, linearScenarios } from './scenarios'

const toItems = (values: number[]): LscItem[] =>
  values.map((value) => ({ kind: 'int', value }))

const snapshotOf = (values: number[], profile: LscProfileId = 'lineaire') =>
  createSnapshot(profile, toItems(values))

function operation<S extends LscSnapshot>(
  operations: OperationDef<S>[],
  id: string,
): OperationDef<S> {
  const found = operations.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${id}`)
  return found
}

function run(
  operations: OperationDef<LscSnapshot>[],
  profile: LscProfileId,
  id: string,
  values: number[],
  params: ParamValues = {},
) {
  const steps = operation(operations, id).run(snapshotOf(values, profile), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps
}

function final(
  operations: OperationDef<LscSnapshot>[],
  profile: LscProfileId,
  id: string,
  values: number[],
  params: ParamValues = {},
) {
  const steps = run(operations, profile, id, values, params)
  return steps[steps.length - 1]!
}

describe('chapitre 2 — liste simplement chaînée linéaire', () => {
  it('insère en tête et en fin en conservant l’ordre', () => {
    const insertHead = (values: number[], value: number) =>
      listValues(final(linearOperations, 'lineaire', 'insererEnTete', values, { valeur: value }).snapshot)
    const insertTail = (values: number[], value: number) =>
      listValues(final(linearOperations, 'lineaire', 'insererEnFin', values, { valeur: value }).snapshot)

    expect(insertHead([9, 2, 5], 7)).toEqual([7, 9, 2, 5])
    expect(insertTail([9, 2, 5], 7)).toEqual([9, 2, 5, 7])
    expect(insertHead([], 7)).toEqual([7])
    expect(insertTail([], 7)).toEqual([7])
  })

  it('supprime la tête, le milieu, la queue et une valeur absente', () => {
    const remove = (values: number[], value: number) =>
      listValues(
        final(linearOperations, 'lineaire', 'supprimerValeur', values, { valeur: value }).snapshot,
      )

    expect(listValues(final(linearOperations, 'lineaire', 'supprimerEnTete', [9, 2, 5]).snapshot)).toEqual([
      2, 5,
    ])
    expect(remove([9, 2, 5], 9)).toEqual([2, 5])
    expect(remove([9, 2, 5], 2)).toEqual([9, 5])
    expect(remove([9, 2, 5], 5)).toEqual([9, 2])
    expect(remove([9, 2, 5], 99)).toEqual([9, 2, 5])
  })

  it('recherche une valeur et renvoie 1 ou 0', () => {
    expect(
      final(linearOperations, 'lineaire', 'rechercher', [9, 2, 5], { valeur: 5 }).console.returnValue,
    ).toBe(1)
    const missing = final(linearOperations, 'lineaire', 'rechercher', [9, 2, 5], { valeur: 99 })
    expect(missing.console.returnValue).toBe(0)
    expect(missing.counters.comparisons).toBeGreaterThanOrEqual(4)
  })

  it('affiche, détruit et gère la liste vide', () => {
    const shown = final(linearOperations, 'lineaire', 'afficherListe', [9, 2, 5])
    expect(shown.console.output.trim()).toBe('9 2 5')
    expect(listValues(shown.snapshot)).toEqual([9, 2, 5])

    const empty = final(linearOperations, 'lineaire', 'detruireListe', [9, 2, 5])
    expect(empty.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(empty.snapshot.nodes).toEqual([])
    expect(checkInvariants(empty.snapshot)).toEqual([])

    for (const id of ['afficherListe', 'supprimerEnTete', 'supprimerValeur', 'detruireListe']) {
      const step = final(linearOperations, 'lineaire', id, [], { valeur: 9 })
      expect(checkInvariants(step.snapshot)).toEqual([])
      expect(listValues(step.snapshot)).toEqual([])
    }
  })

  it('chaque étape pointe vers une ligne existante du fichier C', () => {
    const cases: Array<[string, ParamValues]> = [
      ['insererEnTete', { valeur: 7 }],
      ['insererEnFin', { valeur: 7 }],
      ['supprimerEnTete', {}],
      ['supprimerValeur', { valeur: 2 }],
      ['rechercher', { valeur: 2 }],
      ['afficherListe', {}],
      ['detruireListe', {}],
    ]
    for (const [id, params] of cases) {
      for (const step of run(linearOperations, 'lineaire', id, [9, 2, 5], params)) {
        const source = intCode[step.fn]
        expect(source, `${id} / ${step.fn}`).toBeDefined()
        expect(step.line).toBeGreaterThanOrEqual(0)
        expect(step.line).toBeLessThan(source!.lines.length)
        expect(step.caption.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('les scénarios linéaires se terminent avec les bonnes valeurs', () => {
    const expected: Record<string, number[]> = {
      cours: [9, 2, 5],
      milieu: [9],
      tete: [9, 2, 5, 7],
      absente: [9, 2, 5],
      detruire: [],
      vide: [],
    }
    for (const scenario of linearScenarios) {
      let snapshot = scenario.state
      for (const step of scenario.steps) {
        const steps = operation(linearOperations, step.operationId).run(snapshot, step.params)
        snapshot = steps[steps.length - 1]!.snapshot
      }
      expect(listValues(snapshot), scenario.id).toEqual(expected[scenario.id])
      expect(checkInvariants(snapshot), scenario.id).toEqual([])
    }
  })
})

describe('chapitre 2 — liste simplement chaînée circulaire', () => {
  it('referme le cercle : le dernier nœud pointe vers debut', () => {
    const snapshot = snapshotOf([9, 2, 5], 'circulaire')
    const head = snapshot.nodes[0]!
    const last = snapshot.nodes[snapshot.nodes.length - 1]!
    expect(snapshot.globals.debut).toEqual({ kind: 'node', id: head.id })
    expect(last.suivant).toEqual({ kind: 'node', id: head.id })
    expect(checkInvariants(snapshot)).toEqual([])
  })

  it('insère en tête et en fin en gardant l’anneau fermé', () => {
    for (const [id, value, expected] of [
      ['insererEnTete', 7, [7, 9, 2, 5]],
      ['insererEnFin', 7, [9, 2, 5, 7]],
    ] as const) {
      const step = final(circularOperations, 'circulaire', id, [9, 2, 5], { valeur: value })
      expect(listValues(step.snapshot)).toEqual(expected)
      expect(checkInvariants(step.snapshot)).toEqual([])
      const last = rowNodes(step.snapshot).at(-1)!
      expect(last.suivant).toEqual(step.snapshot.globals.debut)
    }

    const single = final(circularOperations, 'circulaire', 'insererEnTete', [], { valeur: 7 })
    expect(listValues(single.snapshot)).toEqual([7])
    expect(single.snapshot.nodes[0]!.suivant).toEqual({ kind: 'node', id: single.snapshot.nodes[0]!.id })
    expect(checkInvariants(single.snapshot)).toEqual([])
  })

  it('supprime la tête, le milieu, la queue et une valeur absente', () => {
    const remove = (values: number[], value: number) =>
      final(circularOperations, 'circulaire', 'supprimerValeur', values, { valeur: value })

    for (const [value, expected] of [
      [9, [2, 5]],
      [2, [9, 5]],
      [5, [9, 2]],
      [99, [9, 2, 5]],
    ] as const) {
      const step = remove([9, 2, 5], value)
      expect(listValues(step.snapshot), `supprimer ${value}`).toEqual(expected)
      expect(checkInvariants(step.snapshot)).toEqual([])
    }

    const head = final(circularOperations, 'circulaire', 'supprimerEnTete', [9, 2, 5])
    expect(listValues(head.snapshot)).toEqual([2, 5])
    expect(checkInvariants(head.snapshot)).toEqual([])

    const single = final(circularOperations, 'circulaire', 'supprimerEnTete', [9])
    expect(single.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(single.snapshot.nodes).toEqual([])
    expect(checkInvariants(single.snapshot)).toEqual([])
  })

  it('recherche dans l’anneau et s’arrête au retour sur debut', () => {
    expect(
      final(circularOperations, 'circulaire', 'rechercher', [9, 2, 5], { valeur: 5 }).console
        .returnValue,
    ).toBe(1)
    const missing = final(circularOperations, 'circulaire', 'rechercher', [9, 2, 5], { valeur: 99 })
    expect(missing.console.returnValue).toBe(0)
    expect(missing.counters.traversed).toBe(3)
    expect(checkInvariants(missing.snapshot)).toEqual([])
  })

  it('affiche un tour complet puis détruit l’anneau', () => {
    const shown = final(circularOperations, 'circulaire', 'afficherListe', [9, 2, 5])
    expect(shown.console.output.trim()).toBe('9 2 5')
    expect(shown.counters.traversed).toBe(3)

    const empty = final(circularOperations, 'circulaire', 'detruireListe', [9, 2, 5])
    expect(empty.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(empty.snapshot.nodes).toEqual([])
    expect(checkInvariants(empty.snapshot)).toEqual([])

    for (const id of ['afficherListe', 'supprimerEnTete', 'supprimerValeur', 'detruireListe']) {
      const step = final(circularOperations, 'circulaire', id, [], { valeur: 9 })
      expect(checkInvariants(step.snapshot)).toEqual([])
      expect(listValues(step.snapshot)).toEqual([])
    }
  })

  it('chaque étape pointe vers une ligne existante du fichier C', () => {
    const cases: Array<[string, ParamValues]> = [
      ['insererEnTete', { valeur: 7 }],
      ['insererEnFin', { valeur: 7 }],
      ['supprimerEnTete', {}],
      ['supprimerValeur', { valeur: 2 }],
      ['supprimerValeur', { valeur: 9 }],
      ['rechercher', { valeur: 2 }],
      ['afficherListe', {}],
      ['detruireListe', {}],
    ]
    for (const [id, params] of cases) {
      for (const step of run(circularOperations, 'circulaire', id, [9, 2, 5], params)) {
        const source = circularCode[step.fn]
        expect(source, `${id} / ${step.fn}`).toBeDefined()
        expect(step.line).toBeGreaterThanOrEqual(0)
        expect(step.line).toBeLessThan(source!.lines.length)
        expect(step.caption.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('les libellés désignent la bonne ligne de code', () => {
    for (const [fn, labels] of Object.entries(circularLabels)) {
      const source = circularCode[fn]
      expect(source, fn).toBeDefined()
      for (const [name, spec] of Object.entries(labels)) {
        expect(source!.lines[spec.line], `${fn}.${name}`).toContain(spec.contains)
      }
    }
  })

  it('les scénarios circulaires se terminent avec les bonnes valeurs', () => {
    const expected: Record<string, number[]> = {
      'circ-cours': [9, 2, 5],
      'circ-milieu': [9],
      'circ-tete': [9, 2, 5, 7],
      'circ-absente': [9, 2, 5],
      'circ-detruire': [],
      'circ-vide': [],
    }
    for (const scenario of circularScenarios) {
      let snapshot = scenario.state
      for (const step of scenario.steps) {
        const steps = operation(circularOperations, step.operationId).run(snapshot, step.params)
        snapshot = steps[steps.length - 1]!.snapshot
      }
      expect(listValues(snapshot), scenario.id).toEqual(expected[scenario.id])
      expect(checkInvariants(snapshot), scenario.id).toEqual([])
    }
  })

  it('les identifiants de scénarios restent uniques entre les deux profils', () => {
    const ids = [...linearScenarios, ...circularScenarios].map((scenario) => scenario.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('chapitre 2 — instantanés et déterminisme', () => {
  it('fige les instantanés et rejoue les mêmes étapes', () => {
    for (const [profile, operations] of [
      ['lineaire', linearOperations],
      ['circulaire', circularOperations],
    ] as const) {
      const source = snapshotOf([9, 2, 5], profile)
      const steps = operation(operations, 'supprimerValeur').run(source, { valeur: 2 })
      const first = steps[0]!
      expect(Object.isFrozen(first.snapshot)).toBe(true)
      expect(Object.isFrozen(first.snapshot.nodes[0])).toBe(true)
      expect(() => first.snapshot.nodes.push(first.snapshot.nodes[0]!)).toThrow()
      const before = JSON.stringify(steps.map((entry) => entry.snapshot))
      source.nodes[0]!.payload = { kind: 'int', value: 123 }
      expect(JSON.stringify(steps.map((entry) => entry.snapshot))).toBe(before)

      const again = operation(operations, 'supprimerValeur').run(snapshotOf([9, 2, 5], profile), {
        valeur: 2,
      })
      expect(JSON.stringify(again)).toBe(JSON.stringify(steps))
    }
  })
})
