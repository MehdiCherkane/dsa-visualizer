import { describe, expect, it } from 'vitest'
import type { BaseSnapshot, OperationDef, ParamValues, Step } from '../../core/types'
import { fileCode } from './code/file'
import { pileCode } from './code/pile'
import {
  checkFileInvariants,
  checkPileInvariants,
  createFile,
  createPile,
  queueValues,
  stackValues,
} from './memory'
import type { FileSnapshot, PileSnapshot } from './memory'
import { fileOperations, pileOperations } from './operations'
import { fileScenarios, pileScenarios } from './scenarios'

function operation<S extends BaseSnapshot>(
  operations: OperationDef<S>[],
  id: string,
): OperationDef<S> {
  const found = operations.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Unknown operation ${id}`)
  return found
}

function runPile(
  id: string,
  values: number[],
  params: ParamValues = {},
): PileSnapshot {
  const steps = operation(pileOperations, id).run(createPile(values), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps[steps.length - 1]!.snapshot
}

function runFile(
  id: string,
  values: number[],
  params: ParamValues = {},
): FileSnapshot {
  const steps = operation(fileOperations, id).run(createFile(values), params)
  expect(steps.length).toBeGreaterThan(0)
  return steps[steps.length - 1]!.snapshot
}

function expectCodeLines<S extends BaseSnapshot>(
  steps: Step<S>[],
  code: Record<string, { lines: string[] }>,
  label: string,
): void {
  for (const step of steps) {
    const source = code[step.fn]
    expect(source, `${label} / ${step.fn}`).toBeDefined()
    expect(step.line).toBeGreaterThanOrEqual(0)
    expect(step.line).toBeLessThan(source!.lines.length)
    expect(step.caption.trim().length).toBeGreaterThan(0)
  }
}

describe('chapitre 3 — pile dynamique', () => {
  it('empile dans l’ordre LIFO', () => {
    let snapshot = createPile([])
    for (const value of [25, 7, 12]) {
      const steps = operation(pileOperations, 'empiler').run(snapshot, { valeur: value })
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkPileInvariants(snapshot)).toEqual([])
    }
    expect(stackValues(snapshot)).toEqual([12, 7, 25])
    expect(snapshot.globals.sommet).toEqual({ kind: 'node', id: 3 })
  })

  it('conserve les slots des nœuds existants lors d’un empilement puis dépilement', () => {
    const initial = createPile([25, 7, 12])
    const pushed = operation(pileOperations, 'empiler').run(initial, { valeur: 15 })
    const pushedSnapshot = pushed[pushed.length - 1]!.snapshot
    expect(
      pushedSnapshot.nodes
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((node) => [node.value, node.slot]),
    ).toEqual([
      [15, -1],
      [25, 0],
      [7, 1],
      [12, 2],
    ])
    expect(pushedSnapshot.globals.sommet).toEqual({ kind: 'node', id: 4 })

    const popped = operation(pileOperations, 'depiler').run(pushedSnapshot, {})
    const poppedSnapshot = popped[popped.length - 1]!.snapshot
    expect(
      poppedSnapshot.nodes
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((node) => [node.value, node.slot]),
    ).toEqual([
      [25, 0],
      [7, 1],
      [12, 2],
    ])
    expect(poppedSnapshot.globals.sommet).toEqual({ kind: 'node', id: 1 })
    expect(checkPileInvariants(poppedSnapshot)).toEqual([])
  })

  it('dépile jusqu’à vider la pile', () => {
    let snapshot = createPile([12, 7, 25])
    expect(stackValues(snapshot)).toEqual([12, 7, 25])
    for (const expected of [7, 25]) {
      const steps = operation(pileOperations, 'depiler').run(snapshot, {})
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkPileInvariants(snapshot)).toEqual([])
      expect(stackValues(snapshot)).toEqual(
        expected === 7 ? [7, 25] : [25],
      )
    }
    snapshot = runPile('depiler', [25])
    expect(snapshot.globals.sommet).toEqual({ kind: 'null' })
    expect(snapshot.nodes).toEqual([])
    expect(checkPileInvariants(snapshot)).toEqual([])
  })

  it('dépiler une pile vide renvoie -1', () => {
    const steps = operation(pileOperations, 'depiler').run(createPile([]), {})
    const last = steps[steps.length - 1]!
    expect(last.console.returnValue).toBe(-1)
    expect(last.console.output).toContain('Pile vide')
    expect(checkPileInvariants(last.snapshot)).toEqual([])
  })

  it('pileVide renvoie 1 sur une pile vide et 0 sinon', () => {
    const emptySteps = operation(pileOperations, 'pileVide').run(createPile([]), {})
    expect(emptySteps[emptySteps.length - 1]!.console.returnValue).toBe(1)
    const fullSteps = operation(pileOperations, 'pileVide').run(createPile([7]), {})
    expect(fullSteps[fullSteps.length - 1]!.console.returnValue).toBe(0)
  })

  it('détruit toute la pile sans fuite du retour de depiler', () => {
    const steps = operation(pileOperations, 'detruirePile').run(createPile([12, 7]), {})
    // Les étapes internes de depiler gardent leur propre retour ; les étapes
    // de detruirePile, déclarée void, ne doivent jamais l'afficher.
    for (const step of steps) {
      if (step.fn === 'detruirePile') {
        expect(step.console.returnValue).toBeUndefined()
      }
    }
    const last = steps[steps.length - 1]!
    expect(last.console.returnValue).toBeUndefined()
    expect(last.snapshot.globals.sommet).toEqual({ kind: 'null' })
    expect(last.snapshot.nodes).toEqual([])
    expect(checkPileInvariants(last.snapshot)).toEqual([])
  })

  it('détruit une pile vide sans fuite du retour de depiler', () => {
    const steps = operation(pileOperations, 'detruirePile').run(createPile([]), {})
    for (const step of steps) {
      expect(step.console.returnValue).toBeUndefined()
    }
    const last = steps[steps.length - 1]!
    expect(last.snapshot.globals.sommet).toEqual({ kind: 'null' })
    expect(checkPileInvariants(last.snapshot)).toEqual([])
  })

  it('dépiler renvoie la valeur retirée', () => {
    const steps = operation(pileOperations, 'depiler').run(createPile([12, 7]), {})
    expect(steps[steps.length - 1]!.console.returnValue).toBe(12)
  })

  it('empilerCopie délègue à empiler et corrigerCopie dépile', () => {
    let snapshot = createPile([])
    for (const numero of [101, 102, 103]) {
      const steps = operation(pileOperations, 'empilerCopie').run(snapshot, { numero })
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkPileInvariants(snapshot)).toEqual([])
    }
    expect(stackValues(snapshot)).toEqual([103, 102, 101])

    const steps = operation(pileOperations, 'corrigerCopie').run(snapshot, {})
    const last = steps[steps.length - 1]!
    expect(stackValues(last.snapshot)).toEqual([102, 101])
    expect(last.console.output).toContain('Correction de la copie 103')
    expect(checkPileInvariants(last.snapshot)).toEqual([])
  })

  it('chaque étape pointe vers une ligne existante du fichier C', () => {
    const cases: Array<['pile' | 'file', string, number[], ParamValues?]> = [
      ['pile', 'empiler', [25], { valeur: 7 }],
      ['pile', 'depiler', [7]],
      ['pile', 'pileVide', [7]],
      ['pile', 'detruirePile', [7, 9]],
      ['pile', 'empilerCopie', [], { numero: 101 }],
      ['pile', 'corrigerCopie', [7]],
      ['file', 'enfiler', [7], { valeur: 12 }],
      ['file', 'defiler', [7]],
      ['file', 'fileVide', [7]],
      ['file', 'detruireFile', [7, 9]],
      ['file', 'enregistrerArrivee', [], { numero: 201 }],
      ['file', 'servirSuivant', [7]],
    ]
    for (const [profile, id, values, params] of cases) {
      const label = `${profile} / ${id}`
      if (profile === 'pile') {
        const steps = operation(pileOperations, id).run(createPile(values), params ?? {})
        expectCodeLines(steps, pileCode, label)
      } else {
        const steps = operation(fileOperations, id).run(createFile(values), params ?? {})
        expectCodeLines(steps, fileCode, label)
      }
    }
  })

  it('les instantanés sont figés et les étapes sont déterministes', () => {
    const source = createPile([12, 7, 25])
    const steps = operation(pileOperations, 'detruirePile').run(source, {})
    const first = steps[0]!
    expect(Object.isFrozen(first.snapshot)).toBe(true)
    expect(Object.isFrozen(first.snapshot.nodes[0])).toBe(true)
    const before = JSON.stringify(steps.map((entry) => entry.snapshot))
    source.nodes[0]!.value = 999
    expect(JSON.stringify(steps.map((entry) => entry.snapshot))).toBe(before)

    const again = operation(pileOperations, 'detruirePile').run(createPile([12, 7, 25]), {})
    expect(JSON.stringify(again)).toBe(JSON.stringify(steps))
  })

  it('les scénarios de pile se terminent avec les bonnes valeurs', () => {
    const expected: Record<string, number[]> = {
      pileCours: [12, 7, 25],
      pileDepiler: [],
      pileCopie: [101],
      pileCopieCorrigee: [],
      pileVide: [],
    }
    for (const scenario of pileScenarios) {
      let snapshot = scenario.state
      for (const step of scenario.steps) {
        const steps = operation(pileOperations, step.operationId).run(snapshot, step.params)
        snapshot = steps[steps.length - 1]!.snapshot
      }
      expect(stackValues(snapshot), scenario.id).toEqual(expected[scenario.id])
      expect(checkPileInvariants(snapshot), scenario.id).toEqual([])
    }
  })
})

describe('chapitre 3 — file dynamique', () => {
  it('enfile dans l’ordre FIFO et met fin à jour', () => {
    let snapshot = createFile([])
    for (const value of [7, 12, 25]) {
      const steps = operation(fileOperations, 'enfiler').run(snapshot, { valeur: value })
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkFileInvariants(snapshot)).toEqual([])
    }
    expect(queueValues(snapshot)).toEqual([7, 12, 25])
    expect(snapshot.globals.fin).toEqual({ kind: 'node', id: 3 })
  })

  it('défile dans l’ordre et remet fin à NULL au dernier retrait', () => {
    let snapshot = createFile([7, 12, 25])
    const firstSteps = operation(fileOperations, 'defiler').run(snapshot, {})
    expect(queueValues(firstSteps[firstSteps.length - 1]!.snapshot)).toEqual([12, 25])

    const lastSteps = operation(fileOperations, 'defiler').run(createFile([25]), {})
    const trapStep = lastSteps.find(
      (step) => step.cond?.expr === 'debut == NULL' && step.cond.result,
    )
    expect(trapStep).toBeDefined()
    expect(trapStep!.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(trapStep!.snapshot.globals.fin.kind).toBe('node')
    expect(lastSteps.some((step) => step.badge === 'cas-particulier')).toBe(true)

    snapshot = runFile('defiler', [12, 25])
    snapshot = runFile('defiler', [25])
    expect(snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(snapshot.globals.fin).toEqual({ kind: 'null' })
    expect(snapshot.nodes).toEqual([])
    expect(checkFileInvariants(snapshot)).toEqual([])
  })

  it('défiler une file vide renvoie -1', () => {
    const steps = operation(fileOperations, 'defiler').run(createFile([]), {})
    const last = steps[steps.length - 1]!
    expect(last.console.returnValue).toBe(-1)
    expect(last.console.output).toContain('File vide')
    expect(checkFileInvariants(last.snapshot)).toEqual([])
  })

  it('fileVide renvoie 1 sur une file vide et 0 sinon', () => {
    const emptySteps = operation(fileOperations, 'fileVide').run(createFile([]), {})
    expect(emptySteps[emptySteps.length - 1]!.console.returnValue).toBe(1)
    const fullSteps = operation(fileOperations, 'fileVide').run(createFile([7]), {})
    expect(fullSteps[fullSteps.length - 1]!.console.returnValue).toBe(0)
  })

  it('détruit toute la file sans fuite du retour de defiler', () => {
    const steps = operation(fileOperations, 'detruireFile').run(createFile([7, 12]), {})
    // Les étapes internes de defiler gardent leur propre retour ; les étapes
    // de detruireFile, déclarée void, ne doivent jamais l'afficher.
    for (const step of steps) {
      if (step.fn === 'detruireFile') {
        expect(step.console.returnValue).toBeUndefined()
      }
    }
    const last = steps[steps.length - 1]!
    expect(last.console.returnValue).toBeUndefined()
    expect(last.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(last.snapshot.globals.fin).toEqual({ kind: 'null' })
    expect(last.snapshot.nodes).toEqual([])
    expect(checkFileInvariants(last.snapshot)).toEqual([])
  })

  it('détruit une file vide sans fuite du retour de defiler', () => {
    const steps = operation(fileOperations, 'detruireFile').run(createFile([]), {})
    for (const step of steps) {
      expect(step.console.returnValue).toBeUndefined()
    }
    const last = steps[steps.length - 1]!
    expect(last.snapshot.globals.debut).toEqual({ kind: 'null' })
    expect(last.snapshot.globals.fin).toEqual({ kind: 'null' })
    expect(checkFileInvariants(last.snapshot)).toEqual([])
  })

  it('défiler renvoie la valeur retirée', () => {
    const steps = operation(fileOperations, 'defiler').run(createFile([7, 12]), {})
    expect(steps[steps.length - 1]!.console.returnValue).toBe(7)
  })

  it('enregistrerArrivee et servirSuivant respectent FIFO', () => {
    let snapshot = createFile([])
    for (const numero of [201, 202, 203]) {
      const steps = operation(fileOperations, 'enregistrerArrivee').run(snapshot, { numero })
      snapshot = steps[steps.length - 1]!.snapshot
      expect(checkFileInvariants(snapshot)).toEqual([])
    }
    expect(queueValues(snapshot)).toEqual([201, 202, 203])

    const steps = operation(fileOperations, 'servirSuivant').run(snapshot, {})
    const last = steps[steps.length - 1]!
    expect(queueValues(last.snapshot)).toEqual([202, 203])
    expect(last.console.output).toContain('Etudiant 201 servi')
    expect(checkFileInvariants(last.snapshot)).toEqual([])
  })

  it('les instantanés de file sont figés et déterministes', () => {
    const source = createFile([7, 12, 25])
    const steps = operation(fileOperations, 'detruireFile').run(source, {})
    const first = steps[0]!
    expect(Object.isFrozen(first.snapshot)).toBe(true)
    const before = JSON.stringify(steps.map((entry) => entry.snapshot))
    source.nodes[0]!.value = 999
    expect(JSON.stringify(steps.map((entry) => entry.snapshot))).toBe(before)

    const again = operation(fileOperations, 'detruireFile').run(createFile([7, 12, 25]), {})
    expect(JSON.stringify(again)).toBe(JSON.stringify(steps))
  })

  it('les scénarios de file se terminent avec les bonnes valeurs', () => {
    const expected: Record<string, number[]> = {
      fileCours: [7, 12, 25],
      fileServir: [],
      fileArrivees: [203],
      fileVide: [],
    }
    for (const scenario of fileScenarios) {
      let snapshot = scenario.state
      for (const step of scenario.steps) {
        const steps = operation(fileOperations, step.operationId).run(snapshot, step.params)
        snapshot = steps[steps.length - 1]!.snapshot
      }
      expect(queueValues(snapshot), scenario.id).toEqual(expected[scenario.id])
      expect(checkFileInvariants(snapshot), scenario.id).toEqual([])
    }
  })
})
