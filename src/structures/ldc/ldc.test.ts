import { describe, expect, it } from 'vitest'
import type { OperationDef, ParamValues, Step } from '../../core/types'
import { intOperations } from './operations'
import { intCode } from './code/int'
import {
  checkInvariants,
  createSnapshot,
  listValues,
  walkBackward,
  walkForward,
} from './memory'
import type { LdcItem, LdcSnapshot } from './memory'

const toItems = (values: number[]): LdcItem[] =>
  values.map((value) => ({ kind: 'int', value }))

const snapshotOf = (values: number[]) => createSnapshot('int', toItems(values))

function operation(id: string): OperationDef<LdcSnapshot> {
  const found = intOperations.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${id}`)
  return found
}

function run(id: string, values: number[], params: ParamValues = {}): Step<LdcSnapshot>[] {
  const steps = operation(id).run(snapshotOf(values), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps
}

function finalStep(id: string, values: number[], params: ParamValues = {}): Step<LdcSnapshot> {
  const steps = run(id, values, params)
  return steps[steps.length - 1]!
}

function oracle(id: string, values: number[], params: ParamValues): number[] {
  const result = [...values]
  const value = Number(params.valeur)
  const apres = Number(params.apres)
  const avant = Number(params.avant)
  switch (id) {
    case 'insererEnTete':
      result.unshift(value)
      return result
    case 'insererEnFin':
      result.push(value)
      return result
    case 'insererApresValeur': {
      const index = result.indexOf(apres)
      if (index >= 0) result.splice(index + 1, 0, value)
      return result
    }
    case 'insererAvantValeur': {
      const index = result.indexOf(avant)
      if (index >= 0) result.splice(index, 0, value)
      return result
    }
    case 'supprimerEnTete':
      result.shift()
      return result
    case 'supprimerValeur': {
      const index = result.indexOf(value)
      if (index >= 0) result.splice(index, 1)
      return result
    }
    case 'inverserListe':
      return result.reverse()
    case 'detruireListe':
      return []
    case 'afficherListe':
    case 'afficherListeEnvers':
    case 'rechercher':
      return result
    default:
      throw new Error(`Missing oracle for ${id}`)
  }
}

function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

describe('opérations entières : équivalence avec un oracle', () => {
  for (const def of intOperations) {
    it(`${def.id} conserve les invariants et produit le bon résultat`, () => {
      const random = rng(def.id.length * 7919 + def.label.length)
      for (let round = 0; round < 14; round += 1) {
        const maxStart = def.inserts ? 7 : 8
        const length = Math.floor(random() * (maxStart + 1))
        const values = Array.from({ length }, () => Math.floor(random() * 10))
        const candidate = values[Math.floor(random() * Math.max(1, values.length))]
        const params: ParamValues = {
          valeur: Math.floor(random() * 10),
          apres: candidate ?? 2,
          avant: candidate ?? 2,
        }
        const step = finalStep(def.id, values, params)
        const expected = oracle(def.id, values, params)
        expect(listValues(step.snapshot)).toEqual(expected)
        expect(checkInvariants(step.snapshot)).toEqual([])
        expect(step.snapshot.maxNodes).toBe(8)
      }
    })
  }

  it('numérote les nœuds à partir de 1 et ne réutilise pas les identifiants libérés', () => {
    const initial = snapshotOf([9, 2])
    expect(initial.nodes.map((node) => node.id)).toEqual([1, 2])

    const inserted = finalStep('insererEnFin', [9, 2], { valeur: 5 })
    expect(inserted.snapshot.nodes.map((node) => node.id)).toEqual([1, 2, 3])

    const deletion = run('supprimerValeur', [9, 2], { valeur: 9 })
    const afterDelete = deletion[deletion.length - 1]!.snapshot
    const nextInsert = operation('insererEnFin').run(afterDelete, { valeur: 7 })
    const afterInsert = nextInsert[nextInsert.length - 1]!.snapshot
    expect(afterInsert.nodes.map((node) => node.id)).toEqual([2, 3])
    expect(checkInvariants(afterInsert)).toEqual([])
  })

  it('affiche les valeurs dans les deux sens', () => {
    const forward = finalStep('afficherListe', [9, 2, 5])
    expect(forward.console.output).toContain('9')
    expect(forward.console.output).toContain('2')
    expect(forward.console.output).toContain('5')
    const backward = finalStep('afficherListeEnvers', [9, 2, 5])
    expect(backward.console.output.indexOf('5')).toBeLessThan(
      backward.console.output.indexOf('9'),
    )
  })

  it('rechercher retourne 1 puis 0 et compte les comparaisons', () => {
    const found = finalStep('rechercher', [9, 2, 5], { valeur: 5 })
    expect(found.console.returnValue).toBe(1)
    const missing = finalStep('rechercher', [9, 2, 5], { valeur: 99 })
    expect(missing.console.returnValue).toBe(0)
    expect(missing.counters.comparisons).toBeGreaterThanOrEqual(4)
  })

  it('inverserListe inverse les valeurs et le parcours arrière', () => {
    const step = finalStep('inverserListe', [1, 2, 3, 4])
    expect(listValues(step.snapshot)).toEqual([4, 3, 2, 1])
    expect(walkBackward(step.snapshot).map((node) => node.payload)).toEqual([
      { kind: 'int', value: 1 },
      { kind: 'int', value: 2 },
      { kind: 'int', value: 3 },
      { kind: 'int', value: 4 },
    ])
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('detruireListe vide complètement la liste', () => {
    const step = finalStep('detruireListe', [9, 2, 5])
    expect(step.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(step.snapshot.nodes).toEqual([])
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('le cas particulier de la tête est signalé', () => {
    const deleteHead = run('supprimerValeur', [9, 2, 5], { valeur: 9 })
    expect(deleteHead.some((step) => step.badge === 'cas-particulier')).toBe(true)
    expect(deleteHead.some((step) => step.badge === 'debut-modifie')).toBe(true)

    const insertBeforeHead = run('insererAvantValeur', [9, 2, 5], { avant: 9, valeur: 7 })
    expect(insertBeforeHead.some((step) => step.badge === 'cas-particulier')).toBe(true)
    expect(listValues(finalStep('insererAvantValeur', [9, 2, 5], { avant: 9, valeur: 7 }).snapshot)).toEqual([
      7, 9, 2, 5,
    ])
  })

  it('les listes vides restent valides', () => {
    for (const id of ['afficherListe', 'afficherListeEnvers', 'supprimerEnTete', 'detruireListe', 'inverserListe']) {
      const step = finalStep(id, [])
      expect(checkInvariants(step.snapshot)).toEqual([])
      expect(listValues(step.snapshot)).toEqual([])
    }
  })

  it('chaque étape pointe vers une ligne existante du bon fichier C', () => {
    const step = finalStep('insererAvantValeur', [9, 2, 5], { avant: 2, valeur: 7 })
    for (const current of run('insererAvantValeur', [9, 2, 5], { avant: 2, valeur: 7 })) {
      const source = intCode[current.fn]
      expect(source).toBeDefined()
      expect(current.line).toBeGreaterThanOrEqual(0)
      expect(current.line).toBeLessThan(source!.lines.length)
      expect(current.caption.trim().length).toBeGreaterThan(0)
    }
    expect(listValues(step.snapshot)).toEqual([9, 7, 2, 5])
  })

  it('les instantanés sont figés et les étapes restent stables', () => {
    const source = snapshotOf([9, 2, 5])
    const steps = operation('supprimerValeur').run(source, { valeur: 2 })
    const first = steps[0]!
    expect(Object.isFrozen(first.snapshot)).toBe(true)
    expect(Object.isFrozen(first.snapshot.nodes[0])).toBe(true)
    expect(() => first.snapshot.nodes.push(first.snapshot.nodes[0]!)).toThrow()
    const before = JSON.stringify(steps.map((entry) => entry.snapshot))
    source.nodes[0]!.payload = { kind: 'int', value: 123 }
    expect(JSON.stringify(steps.map((entry) => entry.snapshot))).toBe(before)

    const again = operation('supprimerValeur').run(snapshotOf([9, 2, 5]), { valeur: 2 })
    expect(again.length).toBe(steps.length)
    expect(JSON.stringify(again)).toBe(JSON.stringify(steps))
  })

  it('les séquences aléatoires de 20 opérations gardent les invariants', () => {
    const random = rng(20261020)
    for (let sequence = 0; sequence < 12; sequence += 1) {
      let snapshot = snapshotOf(
        Array.from({ length: Math.floor(random() * 6) }, () => Math.floor(random() * 10)),
      )
      for (let turn = 0; turn < 20; turn += 1) {
        const count = listValues(snapshot).length
        const choices = intOperations.filter(
          (def) => !def.inserts || count < 8,
        )
        const def = choices[Math.floor(random() * choices.length)]!
        const values = listValues(snapshot).filter(
          (value): value is number => value !== null,
        )
        const candidate = values[Math.floor(random() * Math.max(1, values.length))]
        const params: ParamValues = {
          valeur: Math.floor(random() * 10),
          apres: candidate ?? Math.floor(random() * 10),
          avant: candidate ?? Math.floor(random() * 10),
        }
        const steps = def.run(snapshot, params)
        expect(steps.length).toBeGreaterThan(0)
        snapshot = steps[steps.length - 1]!.snapshot
        expect(checkInvariants(snapshot), `${def.id} au tour ${turn}`).toEqual([])
        expect(snapshot.nodes.every((node) => !node.freed)).toBe(true)
        expect(listValues(snapshot).length).toBeLessThanOrEqual(8)
        expect(walkBackward(snapshot).map((node) => node.id)).toEqual(
          walkForward(snapshot)
            .map((node) => node.id)
            .reverse(),
        )
      }
    }
  })

  it('les compteurs ne régressent jamais pendant une opération', () => {
    const steps = run('supprimerValeur', [9, 2, 5], { valeur: 2 })
    for (let index = 1; index < steps.length; index += 1) {
      expect(steps[index]!.counters.traversed).toBeGreaterThanOrEqual(
        steps[index - 1]!.counters.traversed,
      )
      expect(steps[index]!.counters.comparisons).toBeGreaterThanOrEqual(
        steps[index - 1]!.counters.comparisons,
      )
    }
  })
})
