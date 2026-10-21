import { describe, expect, it } from 'vitest'
import type { ParamValues, StudentValue } from '../../core/types'
import { createSnapshot, checkInvariants, listValues } from './memory'
import type { LdcItem, LdcSnapshot } from './memory'
import { runInscrireEtudiant } from './ops/studentOps'
import { studentOperations } from './operations'
import { studentScenarios } from './scenarios'

const E1: StudentValue = { numero: 101, nom: 'AAA', prenom: 'aaa' }
const E2: StudentValue = { numero: 102, nom: 'BBB', prenom: 'bbb' }
const E3: StudentValue = { numero: 103, nom: 'CCC', prenom: 'ccc' }

const toItems = (students: StudentValue[]): LdcItem[] =>
  students.map((student) => ({ kind: 'etudiant', student }))

const registry = (students: StudentValue[]) => createSnapshot('etudiant', toItems(students))

function final(operationId: string, students: StudentValue[], params: ParamValues = {}) {
  const operation = studentOperations.find((candidate) => candidate.id === operationId)
  if (!operation) throw new Error(`Unknown operation ${operationId}`)
  const steps = operation.run(registry(students), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps[steps.length - 1]!
}

describe('registre étudiant', () => {
  it('inscrit trois étudiants dans l’ordre', () => {
    let snapshot: LdcSnapshot = registry([])
    for (const student of [E1, E2, E3]) {
      const steps = runInscrireEtudiant(snapshot, {
        numero: student.numero,
        nom: student.nom,
        prenom: student.prenom,
      })
      expect(steps.length).toBeGreaterThan(0)
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

  it('radie un étudiant au milieu, puis les deux extrémités', () => {
    const middle = final('radierEtudiant', [E1, E2, E3], { num: 102 })
    expect(listValues(middle.snapshot)).toEqual([101, 103])
    expect(checkInvariants(middle.snapshot)).toEqual([])
    expect(middle.snapshot.nodes.some((node) => node.freed)).toBe(false)

    const head = final('radierEtudiant', [E1, E2, E3], { num: 101 })
    expect(listValues(head.snapshot)).toEqual([102, 103])
    expect(head.snapshot.globals.debut).toEqual({ kind: 'node', id: head.snapshot.nodes[0]!.id })
    expect(checkInvariants(head.snapshot)).toEqual([])

    const last = final('radierEtudiant', [E1, E2, E3], { num: 103 })
    expect(listValues(last.snapshot)).toEqual([101, 102])
    expect(checkInvariants(last.snapshot)).toEqual([])
  })

  it('radier le dernier étudiant vide la liste', () => {
    const step = final('radierEtudiant', [E1], { num: 101 })
    expect(step.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(step.snapshot.nodes).toEqual([])
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('signale la suppression de tête comme cas particulier', () => {
    const operation = studentOperations.find((candidate) => candidate.id === 'radierEtudiant')!
    const steps = operation.run(registry([E1, E2, E3]), { num: 101 })
    expect(steps.some((step) => step.badge === 'cas-particulier')).toBe(true)
    expect(steps.some((step) => step.badge === 'debut-modifie')).toBe(true)
  })

  it('inverse le registre en conservant les voisins', () => {
    const step = final('inverserListe', [E1, E2, E3])
    expect(listValues(step.snapshot)).toEqual([103, 102, 101])
    expect(checkInvariants(step.snapshot)).toEqual([])
    const head = step.snapshot.globals.debut
    expect(head.kind).toBe('node')
    if (head.kind === 'node') {
      const node = step.snapshot.nodes.find((candidate) => candidate.id === head.id)!
      expect(node.precedent).toEqual({ kind: 'null' })
      expect(node.payload).toEqual({ kind: 'student', student: E3 })
    }
  })

  it('détruit le registre et ne laisse aucun nœud', () => {
    const step = final('detruireListe', [E1, E2, E3])
    expect(listValues(step.snapshot)).toEqual([])
    expect(step.snapshot.nodes).toEqual([])
    expect(step.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(checkInvariants(step.snapshot)).toEqual([])
  })

  it('affiche et parcourt le registre sans le modifier', () => {
    const forward = final('afficherListe', [E1, E2, E3])
    expect(forward.console.output).toContain('101')
    expect(forward.console.output).toContain('103')
    expect(checkInvariants(forward.snapshot)).toEqual([])

    const backward = final('afficherListeEnvers', [E1, E2, E3])
    expect(backward.console.output.indexOf('103')).toBeLessThan(
      backward.console.output.indexOf('101'),
    )
    expect(checkInvariants(backward.snapshot)).toEqual([])
  })

  it('le scénario du registre reproduit la table du professeur', () => {
    const scenario = studentScenarios.find((candidate) => candidate.id === 'registre')!
    let snapshot = scenario.state
    for (const step of scenario.steps) {
      const operation = studentOperations.find((candidate) => candidate.id === step.operationId)!
      const steps = operation.run(snapshot, step.params)
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkInvariants(snapshot)).toEqual([])
    }
    expect(listValues(snapshot)).toEqual([103])
  })
})
