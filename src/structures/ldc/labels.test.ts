import { describe, expect, it } from 'vitest'
import { intCode, intFunctions, intLabels, intTypes } from './code/int'
import { studentCode, studentFunctions, studentLabels, studentTypes } from './code/student'
import { intOperations, studentOperations } from './operations'
import { createSnapshot } from './memory'
import type { LdcSnapshot, ProfileId } from './memory'
import type { OperationDef, ParamValues } from '../../core/types'

function verifyLabels(
  labels: Record<string, Record<string, { line: number; contains: string }>>,
  code: Record<string, { lines: string[]; labels: Record<string, number> }>,
): void {
  for (const [fn, entries] of Object.entries(labels)) {
    const source = code[fn]
    expect(source, `source C manquante pour ${fn}`).toBeDefined()
    for (const [name, spec] of Object.entries(entries)) {
      expect(spec.line, `${fn}.${name}`).toBeGreaterThanOrEqual(0)
      expect(spec.line, `${fn}.${name}`).toBeLessThan(source!.lines.length)
      expect(source!.lines[spec.line], `${fn}.${name}`).toContain(spec.contains)
      expect(source!.labels[name], `${fn}.${name} dans le plan`).toBe(spec.line)
    }
  }
}

function sampleState(operation: OperationDef<LdcSnapshot>, profileId: ProfileId): LdcSnapshot {
  if (profileId === 'int') {
    return createSnapshot('int', [
      { kind: 'int', value: 9 },
      { kind: 'int', value: 2 },
    ])
  }
  if (operation.id === 'inscrireEtudiant') {
    return createSnapshot('etudiant', [])
  }
  return createSnapshot('etudiant', [
    { kind: 'etudiant', student: { numero: 101, nom: 'AAA', prenom: 'aaa' } },
    { kind: 'etudiant', student: { numero: 102, nom: 'BBB', prenom: 'bbb' } },
    { kind: 'etudiant', student: { numero: 103, nom: 'CCC', prenom: 'ccc' } },
  ])
}

function verifyOperationSteps(
  operations: OperationDef<LdcSnapshot>[],
  code: Record<string, { lines: string[] }>,
  profileId: ProfileId,
): void {
  for (const operation of operations) {
    const params: ParamValues = {}
    for (const param of operation.params) params[param.name] = param.defaultValue
    const steps = operation.run(sampleState(operation, profileId), params)
    expect(steps.length, operation.id).toBeGreaterThan(0)
    for (const step of steps) {
      const source = code[step.fn]
      expect(source, `${operation.id}: source ${step.fn}`).toBeDefined()
      expect(step.line, `${operation.id}: ${step.fn}`).toBeGreaterThanOrEqual(0)
      expect(step.line, `${operation.id}: ${step.fn}`).toBeLessThan(source!.lines.length)
    }
  }
}

describe('sources C et libellés symboliques', () => {
  it('chaque libellé entier pointe sur la bonne ligne', () => {
    verifyLabels(intLabels, intCode)
  })

  it('chaque libellé étudiant pointe sur la bonne ligne', () => {
    verifyLabels(studentLabels, studentCode)
  })

  it('les fonctions C canoniques sont présentes', () => {
    expect(intFunctions.map((entry) => entry.code.fn)).toEqual([
      'afficherListe',
      'afficherListeEnvers',
      'insererEnTete',
      'insererEnFin',
      'insererApresValeur',
      'insererAvantValeur',
      'supprimerEnTete',
      'supprimerValeur',
      'rechercher',
      'detruireListe',
      'inverserListe',
    ])
    expect(studentFunctions.map((entry) => entry.code.fn)).toEqual([
      'afficherListe',
      'afficherListeEnvers',
      'inscrireEtudiant',
      'radierEtudiant',
      'inverserListe',
      'detruireListe',
    ])
  })

  it('les définitions de types restent celles du cours', () => {
    expect(intTypes.lines).toContain('    int valeur;')
    expect(intTypes.lines).toContain('    struct noeud *suivant;')
    expect(intTypes.lines).toContain('    struct noeud *precedent;')
    expect(intTypes.lines).toContain('Noeud *debut = NULL;')
    expect(studentTypes.lines.some((line) => line.includes('struct noeudEtudiant *suivant'))).toBe(true)
    expect(studentTypes.lines.some((line) => line.includes('struct noeudEtudiant *precedent'))).toBe(true)
    expect(studentTypes.lines).toContain('NoeudEtudiant *debut = NULL;')
  })

  it('chaque étape de chaque opération pointe vers une ligne réelle', () => {
    verifyOperationSteps(intOperations, intCode, 'int')
    verifyOperationSteps(studentOperations, studentCode, 'etudiant')
  })

  it('toutes les opérations exposent libellé, complexité et note', () => {
    for (const operation of [...intOperations, ...studentOperations]) {
      expect(operation.label.trim().length).toBeGreaterThan(0)
      expect(operation.complexity.trim().length).toBeGreaterThan(0)
      expect(operation.complexityNote.trim().length).toBeGreaterThan(0)
    }
  })
})
