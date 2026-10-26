import { describe, expect, it } from 'vitest'
import type { OperationDef, ParamValues, Step } from '../../core/types'
import {
  checkCircularInvariants,
  checkRingInvariants,
  createCircularSnapshot,
  listValues,
  walkBackward,
  walkForward,
} from './memory'
import type { LdcItem, LdcSnapshot } from './memory'
import { intOperations } from './operations'

const intItems = (values: number[]): LdcItem[] =>
  values.map((value) => ({ kind: 'int', value }))

const snapshotOf = (values: number[]): LdcSnapshot =>
  createCircularSnapshot('int', intItems(values))

function operation(id: string): OperationDef<LdcSnapshot> {
  const found = intOperations.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${id}`)
  return found
}

function oracle(id: string, values: number[], params: ParamValues): number[] {
  const result = [...values]
  const value = Number(params.valeur)
  const apres = Number(params.apres)
  const avant = Number(params.avant)
  switch (id) {
    case 'afficherListe':
    case 'afficherListeEnvers':
    case 'rechercher':
      return result
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
    case 'passerAuSuivant':
      if (result.length > 1) result.push(result.shift()!)
      return result
    case 'inverserListe':
      return result.reverse()
    case 'detruireListe':
      return []
    default:
      throw new Error(`Missing oracle for ${id}`)
  }
}

function run(
  def: OperationDef<LdcSnapshot>,
  values: number[],
  params: ParamValues,
): Step<LdcSnapshot>[] {
  const steps = def.run(snapshotOf(values), params)
  expect(steps.length, def.id).toBeGreaterThan(0)

  for (const step of steps) {
    expect(
      checkRingInvariants(step.snapshot),
      `${def.id} sur [${values.join(', ')}] au pas ${step.line}`,
    ).toEqual([])
  }

  return steps
}

function finalStep(
  def: OperationDef<LdcSnapshot>,
  values: number[],
  params: ParamValues,
): Step<LdcSnapshot> {
  const steps = run(def, values, params)
  return steps[steps.length - 1]!
}

function parameterCases(id: string, values: number[]): ParamValues[] {
  const unique = [...new Set(values)]
  const first = unique[0] ?? 9
  const middle = unique[Math.floor(unique.length / 2)] ?? 2
  const last = unique[unique.length - 1] ?? 5
  const targets = [...new Set([first, middle, last, 99])]

  switch (id) {
    case 'insererApresValeur':
      return targets.map((target) => ({ apres: target, valeur: 7 }))
    case 'insererAvantValeur':
      return targets.map((target) => ({ avant: target, valeur: 7 }))
    case 'supprimerValeur':
      return targets.map((target) => ({ valeur: target }))
    case 'rechercher':
      return targets.map((target) => ({ valeur: target }))
    case 'insererEnTete':
    case 'insererEnFin':
      return [{ valeur: 7 }]
    default:
      return [{}]
  }
}

const starts: Array<{ label: string; values: number[] }> = [
  { label: 'vide', values: [] },
  { label: 'un nœud', values: [9] },
  { label: 'deux nœuds', values: [9, 2] },
  { label: 'trois nœuds', values: [9, 2, 5] },
  { label: 'huit nœuds', values: [9, 2, 5, 1, 3, 4, 6, 7] },
]

describe('chapitre 5 — oracle des opérations entières', () => {
  for (const def of intOperations) {
    it(`${def.id} : oracle de 0 à 8 nœuds`, () => {
      for (const start of starts) {
        const cases = parameterCases(def.id, start.values)
        if (def.inserts && start.values.length >= 8) continue
        for (const params of cases) {
          const steps = run(def, start.values, params)
          const final = steps[steps.length - 1]!.snapshot

          expect(
            listValues(final),
            `${def.id} ${JSON.stringify(params)} sur ${start.label}`,
          ).toEqual(oracle(def.id, start.values, params))
          expect(checkCircularInvariants(final), `${def.id} sur ${start.label}`).toEqual([])
          expect(final.nodes.filter((node) => node.lane === 'row').length).toBeLessThanOrEqual(8)
          expect(final.nodes.every((node) => !node.freed)).toBe(true)
        }
      }
    })
  }

  it('gère les doublons en supprimant ou en insérant la première occurrence', () => {
    const duplicate = [9, 2, 9, 5, 9]
    expect(
      listValues(finalStep(operation('supprimerValeur'), duplicate, { valeur: 9 }).snapshot),
    ).toEqual([2, 9, 5, 9])
    expect(
      listValues(
        finalStep(operation('insererApresValeur'), duplicate, { apres: 9, valeur: 7 }).snapshot,
      ),
    ).toEqual([9, 7, 2, 9, 5, 9])
    expect(
      listValues(
        finalStep(operation('insererAvantValeur'), duplicate, { avant: 9, valeur: 7 }).snapshot,
      ),
    ).toEqual([7, 9, 2, 9, 5, 9])
  })

  it('inverse le cercle dans les deux sens', () => {
    const values = [9, 2, 5, 1]
    const step = finalStep(operation('inverserListe'), values, {})
    expect(listValues(step.snapshot)).toEqual([...values].reverse())
    expect(walkBackward(step.snapshot).map((node) => node.id)).toEqual(
      walkForward(step.snapshot)
        .map((node) => node.id)
        .reverse(),
    )

    const single = finalStep(operation('inverserListe'), [9], {})
    expect(listValues(single.snapshot)).toEqual([9])
    expect(single.snapshot.nodes[0].suivant).toEqual({ kind: 'node', id: 1 })
    expect(single.snapshot.nodes[0].precedent).toEqual({ kind: 'node', id: 1 })
  })

  it('vide la liste avec supprimerEnTete puis detruireListe', () => {
    let state = snapshotOf([9])
    state = finalStep(operation('supprimerEnTete'), listValues(state) as number[], {}).snapshot
    expect(state.globals.debut).toEqual({ kind: 'null' })
    expect(state.nodes).toEqual([])

    const destroyed = finalStep(operation('detruireListe'), [9, 2, 5], {}).snapshot
    expect(destroyed.globals.debut).toEqual({ kind: 'null' })
    expect(destroyed.nodes).toEqual([])
    expect(checkCircularInvariants(destroyed)).toEqual([])
  })

  it('fige les instantanés et reste déterministe', () => {
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
})

function rng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

describe('chapitre 5 — séquences aléatoires', () => {
  it('20 opérations gardent le cercle fermé à chaque pas', () => {
    const random = rng(20261024)
    for (let sequence = 0; sequence < 12; sequence += 1) {
      const initialLength = Math.floor(random() * 6)
      let snapshot = snapshotOf(
        Array.from({ length: initialLength }, () => Math.floor(random() * 10)),
      )

      for (let turn = 0; turn < 20; turn += 1) {
        const count = listValues(snapshot).length
        const choices = intOperations.filter((def) => !def.inserts || count < 8)
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
        expect(steps.length, def.id).toBeGreaterThan(0)
        for (const step of steps) {
          expect(
            checkRingInvariants(step.snapshot),
            `${def.id} séquence ${sequence}, tour ${turn}`,
          ).toEqual([])
        }

        snapshot = steps[steps.length - 1]!.snapshot
        expect(
          checkCircularInvariants(snapshot),
          `${def.id} séquence ${sequence}, tour ${turn}`,
        ).toEqual([])
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
})
