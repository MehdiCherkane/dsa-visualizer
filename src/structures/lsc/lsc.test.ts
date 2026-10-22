import { describe, expect, it } from 'vitest'
import type { OperationDef, ParamValues, StudentValue } from '../../core/types'
import { intCode } from './code/int'
import { studentCode } from './code/student'
import { checkInvariants, createSnapshot, listValues } from './memory'
import type { LscItem, LscSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'

const toItems = (values: number[]): LscItem[] =>
  values.map((value) => ({ kind: 'int', value }))

const snapshotOf = (values: number[]) => createSnapshot('int', toItems(values))

function operation<S extends LscSnapshot>(
  operations: OperationDef<S>[],
  id: string,
): OperationDef<S> {
  const found = operations.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${id}`)
  return found
}

function run(
  id: string,
  values: number[],
  params: ParamValues = {},
) {
  const steps = operation(intOperations, id).run(snapshotOf(values), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps
}

function final(id: string, values: number[], params: ParamValues = {}) {
  const steps = run(id, values, params)
  return steps[steps.length - 1]!
}

const E1: StudentValue = { numero: 101, nom: 'AAA', prenom: 'aaa' }
const E2: StudentValue = { numero: 102, nom: 'BBB', prenom: 'bbb' }
const E3: StudentValue = { numero: 103, nom: 'CCC', prenom: 'ccc' }

const registry = (students: StudentValue[]) =>
  createSnapshot(
    'etudiant',
    students.map<LscItem>((student) => ({ kind: 'etudiant', student })),
  )

function finalStudent(
  id: string,
  students: StudentValue[],
  params: ParamValues = {},
) {
  const steps = operation(studentOperations, id).run(registry(students), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps[steps.length - 1]!
}

describe('chapitre 2 — listes simplement chaînées', () => {
  it('insère en tête et en fin en conservant l’ordre', () => {
    expect(listValues(final('insererEnTete', [9, 2, 5], { valeur: 7 }).snapshot)).toEqual([
      7, 9, 2, 5,
    ])
    expect(listValues(final('insererEnFin', [9, 2, 5], { valeur: 7 }).snapshot)).toEqual([
      9, 2, 5, 7,
    ])
    expect(listValues(final('insererEnTete', [], { valeur: 7 }).snapshot)).toEqual([7])
    expect(listValues(final('insererEnFin', [], { valeur: 7 }).snapshot)).toEqual([7])
  })

  it('supprime la tête, le milieu, la queue et une valeur absente', () => {
    expect(listValues(final('supprimerEnTete', [9, 2, 5]).snapshot)).toEqual([2, 5])
    expect(listValues(final('supprimerValeur', [9, 2, 5], { valeur: 9 }).snapshot)).toEqual([
      2, 5,
    ])
    expect(listValues(final('supprimerValeur', [9, 2, 5], { valeur: 2 }).snapshot)).toEqual([
      9, 5,
    ])
    expect(listValues(final('supprimerValeur', [9, 2, 5], { valeur: 5 }).snapshot)).toEqual([
      9, 2,
    ])
    expect(listValues(final('supprimerValeur', [9, 2, 5], { valeur: 99 }).snapshot)).toEqual([
      9, 2, 5,
    ])
  })

  it('recherche une valeur et renvoie 1 ou 0', () => {
    expect(final('rechercher', [9, 2, 5], { valeur: 5 }).console.returnValue).toBe(1)
    const missing = final('rechercher', [9, 2, 5], { valeur: 99 })
    expect(missing.console.returnValue).toBe(0)
    expect(missing.counters.comparisons).toBeGreaterThanOrEqual(4)
  })

  it('affiche la liste dans l’ordre', () => {
    const step = final('afficherListe', [9, 2, 5])
    expect(step.console.output.trim()).toBe('9 2 5')
    expect(listValues(step.snapshot)).toEqual([9, 2, 5])
  })

  it('détruit la liste et laisse debut à NULL', () => {
    const step = final('detruireListe', [9, 2, 5])
    expect(step.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(step.snapshot.nodes).toEqual([])
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('les listes vides restent valides', () => {
    for (const id of ['afficherListe', 'supprimerEnTete', 'supprimerValeur', 'detruireListe']) {
      const step = final(id, [], { valeur: 9 })
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
      for (const step of run(id, [9, 2, 5], params)) {
        const source = intCode[step.fn]
        expect(source, `${id} / ${step.fn}`).toBeDefined()
        expect(step.line).toBeGreaterThanOrEqual(0)
        expect(step.line).toBeLessThan(source!.lines.length)
        expect(step.caption.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('les instantanés sont figés et les étapes sont déterministes', () => {
    const source = snapshotOf([9, 2, 5])
    const steps = operation(intOperations, 'supprimerValeur').run(source, { valeur: 2 })
    const first = steps[0]!
    expect(Object.isFrozen(first.snapshot)).toBe(true)
    expect(Object.isFrozen(first.snapshot.nodes[0])).toBe(true)
    expect(() => first.snapshot.nodes.push(first.snapshot.nodes[0]!)).toThrow()
    const before = JSON.stringify(steps.map((entry) => entry.snapshot))
    source.nodes[0]!.payload = { kind: 'int', value: 123 }
    expect(JSON.stringify(steps.map((entry) => entry.snapshot))).toBe(before)

    const again = operation(intOperations, 'supprimerValeur').run(snapshotOf([9, 2, 5]), {
      valeur: 2,
    })
    expect(JSON.stringify(again)).toBe(JSON.stringify(steps))
  })

  it('les scénarios entiers se terminent avec les bonnes valeurs', () => {
    const expected: Record<string, number[]> = {
      cours: [9, 2, 5],
      milieu: [9],
      tete: [9, 2, 5, 7],
      absente: [9, 2, 5],
      detruire: [],
      vide: [],
    }
    for (const scenario of intScenarios) {
      let snapshot = scenario.state
      for (const step of scenario.steps) {
        const def = operation(intOperations, step.operationId)
        const steps = def.run(snapshot, step.params)
        snapshot = steps[steps.length - 1]!.snapshot
      }
      expect(listValues(snapshot), scenario.id).toEqual(expected[scenario.id])
      expect(checkInvariants(snapshot), scenario.id).toEqual([])
    }
  })
})

describe('chapitre 2 — registre étudiant', () => {
  it('inscrit trois étudiants dans l’ordre', () => {
    let snapshot = registry([])
    for (const student of [E1, E2, E3]) {
      const steps = operation(studentOperations, 'inscrireEtudiant').run(snapshot, {
        numero: student.numero,
        nom: student.nom,
        prenom: student.prenom,
      })
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkInvariants(snapshot)).toEqual([])
    }
    expect(listValues(snapshot)).toEqual([101, 102, 103])
    expect(snapshot.nodes.map((node) => node.payload.kind)).toEqual([
      'student',
      'student',
      'student',
    ])
  })

  it('radie un étudiant au milieu, en tête puis en fin', () => {
    expect(listValues(finalStudent('radierEtudiant', [E1, E2, E3], { numero: 102 }).snapshot)).toEqual([
      101, 103,
    ])
    expect(listValues(finalStudent('radierEtudiant', [E1, E2, E3], { numero: 101 }).snapshot)).toEqual([
      102, 103,
    ])
    expect(listValues(finalStudent('radierEtudiant', [E1, E2, E3], { numero: 103 }).snapshot)).toEqual([
      101, 102,
    ])
  })

  it('radier le dernier étudiant vide le registre', () => {
    const step = finalStudent('radierEtudiant', [E1], { numero: 101 })
    expect(step.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(step.snapshot.nodes).toEqual([])
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('signale la suppression de tête comme cas particulier', () => {
    const steps = operation(studentOperations, 'radierEtudiant').run(registry([E1, E2, E3]), {
      numero: 101,
    })
    expect(steps.some((step) => step.badge === 'cas-particulier')).toBe(true)
    expect(steps.some((step) => step.badge === 'debut-modifie')).toBe(true)
  })

  it('détruit le registre et affiche les numéros', () => {
    const empty = finalStudent('detruireListe', [E1, E2, E3])
    expect(empty.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(empty.snapshot.nodes).toEqual([])

    const shown = finalStudent('afficherListe', [E1, E2, E3])
    expect(shown.console.output).toContain('101')
    expect(shown.console.output).toContain('103')
    expect(checkInvariants(shown.snapshot)).toEqual([])
  })

  it('chaque étape pointe vers une ligne existante du fichier C', () => {
    const cases: Array<[string, ParamValues]> = [
      ['afficherListe', {}],
      ['inscrireEtudiant', { numero: 104, nom: 'DDD', prenom: 'ddd' }],
      ['radierEtudiant', { numero: 102 }],
      ['detruireListe', {}],
    ]
    for (const [id, params] of cases) {
      const steps = operation(studentOperations, id).run(registry([E1, E2, E3]), params)
      for (const step of steps) {
        const source = studentCode[step.fn]
        expect(source, `${id} / ${step.fn}`).toBeDefined()
        expect(step.line).toBeGreaterThanOrEqual(0)
        expect(step.line).toBeLessThan(source!.lines.length)
        expect(step.caption.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('le scénario du registre reproduit la table du professeur', () => {
    const scenario = studentScenarios.find((candidate) => candidate.id === 'registre')!
    let snapshot = scenario.state
    for (const step of scenario.steps) {
      const def = operation(studentOperations, step.operationId)
      const steps = def.run(snapshot, step.params)
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkInvariants(snapshot)).toEqual([])
    }
    expect(listValues(snapshot)).toEqual([101, 103])
  })
})
