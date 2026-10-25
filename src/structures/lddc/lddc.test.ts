import { describe, expect, it } from 'vitest'
import type { ParamValues, Step } from '../../core/types'
import { intCode } from './code/int'
import { studentCode } from './code/student'
import {
  checkCircularInvariants,
  createCircularSnapshot,
  emptyCircularSnapshot,
  listValues,
  payloadKey,
} from './memory'
import type { LdcItem, LdcSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'
import {
  runAfficherListe,
  runAfficherListeEnvers,
  runDetruireListe,
  runInsererEnFin,
  runInsererEnTete,
  runPasserAuSuivant,
  runRechercher,
  runSupprimerEnTete,
  runSupprimerValeur,
} from './ops/intOps'
import {
  runInscrireEtudiant,
  runRadierEtudiant,
  runStudentAfficherListe,
  runStudentAfficherListeEnvers,
  runStudentDetruireListe,
  runStudentPasserAuSuivant,
} from './ops/studentOps'

type Runner = (state: LdcSnapshot, params: ParamValues) => Step<LdcSnapshot>[]

const ints = (...values: number[]): LdcSnapshot =>
  createCircularSnapshot(
    'int',
    values.map((value): LdcItem => ({ kind: 'int', value })),
  )

function run(
  state: LdcSnapshot,
  runner: Runner,
  params: ParamValues = {},
): { steps: Step<LdcSnapshot>[]; final: LdcSnapshot } {
  const steps = runner(state, params)
  expect(steps.length).toBeGreaterThan(0)
  const final = steps[steps.length - 1].snapshot
  expect(checkCircularInvariants(final)).toEqual([])
  return { steps, final }
}

function last(steps: Step<LdcSnapshot>[]): Step<LdcSnapshot> {
  return steps[steps.length - 1]
}

describe('chapitre 5 — liste doublement chaînée circulaire', () => {
  it('construit un cercle valide, y compris à un seul nœud', () => {
    expect(listValues(emptyCircularSnapshot('int'))).toEqual([])
    expect(checkCircularInvariants(emptyCircularSnapshot('int'))).toEqual([])

    const one = ints(9)
    expect(checkCircularInvariants(one)).toEqual([])
    const single = one.nodes[0]
    expect(single.suivant).toEqual({ kind: 'node', id: single.id })
    expect(single.precedent).toEqual({ kind: 'node', id: single.id })
    expect(listValues(one)).toEqual([9])

    const three = ints(9, 2, 5)
    expect(checkCircularInvariants(three)).toEqual([])
    expect(listValues(three)).toEqual([9, 2, 5])
    const lastNode = three.nodes.find((node) => node.id === 3)
    expect(three.globals.debut).toEqual({ kind: 'node', id: 1 })
    expect(lastNode?.suivant).toEqual({ kind: 'node', id: 1 })
    expect(three.nodes[0].precedent).toEqual({ kind: 'node', id: 3 })
  })

  it('insère en tête en O(1), même dans une liste vide', () => {
    const empty = run(emptyCircularSnapshot('int'), runInsererEnTete, { valeur: 7 }).final
    expect(listValues(empty)).toEqual([7])
    expect(empty.nodes[0].suivant).toEqual({ kind: 'node', id: empty.nodes[0].id })

    const { final } = run(ints(9, 2, 5), runInsererEnTete, { valeur: 7 })
    expect(listValues(final)).toEqual([7, 9, 2, 5])
    expect(final.globals.debut).toEqual({ kind: 'node', id: 4 })
    expect(final.nodes.find((node) => node.id === 3)?.suivant).toEqual({ kind: 'node', id: 4 })
    expect(final.nodes.find((node) => node.id === 4)?.precedent).toEqual({ kind: 'node', id: 3 })
  })

  it('insère en fin en O(1) et le nouveau dernier pointe sur debut', () => {
    const empty = run(emptyCircularSnapshot('int'), runInsererEnFin, { valeur: 7 }).final
    expect(listValues(empty)).toEqual([7])

    const { final } = run(ints(9, 2, 5), runInsererEnFin, { valeur: 7 })
    expect(listValues(final)).toEqual([9, 2, 5, 7])
    expect(final.globals.debut).toEqual({ kind: 'node', id: 1 })
    expect(final.nodes.find((node) => node.id === 4)?.suivant).toEqual({ kind: 'node', id: 1 })
    expect(final.nodes.find((node) => node.id === 1)?.precedent).toEqual({ kind: 'node', id: 4 })
  })

  it('supprime en tête avec le cas du nœud unique', () => {
    expect(listValues(run(emptyCircularSnapshot('int'), runSupprimerEnTete).final)).toEqual([])
    expect(listValues(run(ints(9), runSupprimerEnTete).final)).toEqual([])

    const { final } = run(ints(9, 2, 5), runSupprimerEnTete)
    expect(listValues(final)).toEqual([2, 5])
    expect(final.globals.debut).toEqual({ kind: 'node', id: 2 })
    expect(final.nodes.find((node) => node.id === 3)?.suivant).toEqual({ kind: 'node', id: 2 })
    expect(final.nodes.find((node) => node.id === 2)?.precedent).toEqual({ kind: 'node', id: 3 })
  })

  it('supprime une valeur en tête, au milieu, en fin ou dans un nœud unique', () => {
    expect(listValues(run(ints(9, 2, 5), runSupprimerValeur, { valeur: 9 }).final)).toEqual([2, 5])
    expect(listValues(run(ints(9, 2, 5), runSupprimerValeur, { valeur: 2 }).final)).toEqual([9, 5])
    expect(listValues(run(ints(9, 2, 5), runSupprimerValeur, { valeur: 5 }).final)).toEqual([9, 2])
    expect(listValues(run(ints(9), runSupprimerValeur, { valeur: 9 }).final)).toEqual([])
    expect(listValues(run(emptyCircularSnapshot('int'), runSupprimerValeur, { valeur: 9 }).final)).toEqual([])

    const absent = run(ints(9, 2, 5), runSupprimerValeur, { valeur: 99 }).final
    expect(listValues(absent)).toEqual([9, 2, 5])
  })

  it('fait tourner debut sans modifier la liste', () => {
    const once = run(ints(9, 2, 5), runPasserAuSuivant).final
    expect(listValues(once)).toEqual([2, 5, 9])
    expect(once.globals.debut).toEqual({ kind: 'node', id: 2 })
    expect(
      once.nodes
        .filter((node) => node.lane === 'row')
        .sort((a, b) => a.slot - b.slot)
        .map((node) => payloadKey(node)),
    ).toEqual([2, 5, 9])

    const twice = run(once, runPasserAuSuivant).final
    expect(listValues(twice)).toEqual([5, 9, 2])
    expect(listValues(run(ints(9), runPasserAuSuivant).final)).toEqual([9])
    expect(listValues(run(emptyCircularSnapshot('int'), runPasserAuSuivant).final)).toEqual([])
  })

  it('recherche dans le cercle et s’arrête au retour sur debut', () => {
    expect(last(run(ints(9, 2, 5), runRechercher, { valeur: 2 }).steps).console.returnValue).toBe(1)
    expect(last(run(ints(9, 2, 5), runRechercher, { valeur: 99 }).steps).console.returnValue).toBe(0)
    expect(last(run(emptyCircularSnapshot('int'), runRechercher, { valeur: 9 }).steps).console.returnValue).toBe(0)
  })

  it('affiche dans les deux sens et détruit le cercle', () => {
    const forward = run(ints(9, 2, 5), runAfficherListe)
    expect(last(forward.steps).console.output).toBe('9 2 5 ')

    const backward = run(ints(9, 2, 5), runAfficherListeEnvers)
    expect(last(backward.steps).console.output).toBe('5 2 9 ')

    expect(last(run(emptyCircularSnapshot('int'), runAfficherListe).steps).console.output).toBe('\n')

    const destroyed = run(ints(9, 2, 5), runDetruireListe).final
    expect(destroyed.nodes).toHaveLength(0)
    expect(destroyed.globals.debut).toEqual({ kind: 'null' })
    expect(checkCircularInvariants(destroyed)).toEqual([])
  })

  it('gère le registre étudiant circulaire', () => {
    const E1 = { numero: 101, nom: 'AAA', prenom: 'aaa' }
    const E2 = { numero: 102, nom: 'BBB', prenom: 'bbb' }
    const E3 = { numero: 103, nom: 'CCC', prenom: 'ccc' }
    const empty = emptyCircularSnapshot('etudiant')
    let state = run(empty, runInscrireEtudiant, { numero: E1.numero, nom: E1.nom, prenom: E1.prenom }).final
    state = run(state, runInscrireEtudiant, { numero: E2.numero, nom: E2.nom, prenom: E2.prenom }).final
    state = run(state, runInscrireEtudiant, { numero: E3.numero, nom: E3.nom, prenom: E3.prenom }).final
    expect(listValues(state)).toEqual([101, 102, 103])
    expect(state.globals.debut).toEqual({ kind: 'node', id: 1 })

    expect(listValues(run(state, runRadierEtudiant, { num: 102 }).final)).toEqual([101, 103])
    expect(listValues(run(state, runRadierEtudiant, { num: 101 }).final)).toEqual([102, 103])
    expect(listValues(run(state, runRadierEtudiant, { num: 103 }).final)).toEqual([101, 102])

    const single = run(
      createCircularSnapshot('etudiant', [{ kind: 'etudiant', student: E1 }]),
      runRadierEtudiant,
      { num: 101 },
    ).final
    expect(single.globals.debut).toEqual({ kind: 'null' })
    expect(checkCircularInvariants(single)).toEqual([])

    const rotated = run(state, runStudentPasserAuSuivant).final
    expect(listValues(rotated)).toEqual([102, 103, 101])
    expect(last(run(state, runStudentAfficherListe).steps).console.output).toBe('101 102 103 ')
    expect(last(run(state, runStudentAfficherListeEnvers).steps).console.output).toBe('103 102 101 ')
    const detruireSteps = run(state, runStudentDetruireListe).steps
    expect(detruireSteps[detruireSteps.length - 1].snapshot.nodes).toHaveLength(0)
    const singleNodeFreeStep = detruireSteps.find((s) => s.caption.includes('Le nœud est seul'))
    expect(singleNodeFreeStep?.snapshot.frames[0]?.vars.dernier).toBeUndefined()
  })

  it('utilise uniquement des lignes de code existantes pour chaque opération', () => {
    const cases: Array<{
      operations: typeof intOperations | typeof studentOperations
      code: typeof intCode | typeof studentCode
      state: LdcSnapshot
    }> = [
      { operations: intOperations, code: intCode, state: ints(9, 2, 5) },
      {
        operations: studentOperations,
        code: studentCode,
        state: createCircularSnapshot('etudiant', [
          { kind: 'etudiant', student: { numero: 101, nom: 'AAA', prenom: 'aaa' } },
          { kind: 'etudiant', student: { numero: 102, nom: 'BBB', prenom: 'bbb' } },
        ]),
      },
    ]

    for (const { operations, code, state } of cases) {
      for (const operation of operations) {
        const params: ParamValues = Object.fromEntries(
          operation.params.map((param) => [param.name, param.defaultValue]),
        )
        const steps = operation.run(state, params)
        expect(steps.length, operation.id).toBeGreaterThan(0)
        for (const step of steps) {
          const source = code[step.fn]
          expect(source, `${operation.id} → ${step.fn}`).toBeDefined()
          expect(step.line).toBeGreaterThanOrEqual(0)
          expect(step.line).toBeLessThan(source.lines.length)
          expect(step.caption.trim().length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('référence des opérations existantes dans les scénarios', () => {
    const profiles = [
      { scenarios: intScenarios, operations: intOperations },
      { scenarios: studentScenarios, operations: studentOperations },
    ]
    for (const { scenarios, operations } of profiles) {
      const ids = new Set(operations.map((operation) => operation.id))
      for (const scenario of scenarios) {
        for (const step of scenario.steps) {
          expect(ids.has(step.operationId), `${scenario.id} → ${step.operationId}`).toBe(true)
        }
      }
    }
  })
})
