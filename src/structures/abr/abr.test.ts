import { describe, expect, it } from 'vitest'
import type { Step } from '../../core/types'
import { getNode, rootPointer } from '../trees/memory'
import type { TreeSnapshot } from '../trees/memory'
import { abrCode } from './code/int'
import { abrPlugin } from './index'
import {
  abrCourseSnapshot,
  createAbrSnapshot,
  emptyAbrSnapshot,
  inorderValues,
  isAbr,
  registreSnapshot,
} from './memory'
import {
  abrOperations,
  runConstruireRegistre,
  runEstInscrit,
  runInscrireEtudiant,
  runRadierEtudiant,
} from './ops/abrOps'
import { abrScenarios } from './scenarios'

const last = (steps: Step<TreeSnapshot>[]): Step<TreeSnapshot> => {
  const step = steps[steps.length - 1]
  if (!step) throw new Error('No step produced')
  return step
}

const rootValue = (snapshot: TreeSnapshot): number | null => {
  const root = rootPointer(snapshot)
  if (root.kind !== 'node') return null
  const node = getNode(snapshot, root.id)
  return node && node.payload.kind === 'int' ? node.payload.value : null
}

const liveCount = (snapshot: TreeSnapshot): number =>
  snapshot.nodes.filter((node) => !node.freed).length

describe('mémoire des ABR', () => {
  it('donne le parcours infixe trié des arbres du cours et de l’exercice', () => {
    expect(inorderValues(abrCourseSnapshot())).toEqual([20, 30, 40, 50, 60, 70, 80])
    expect(inorderValues(registreSnapshot())).toEqual([120, 150, 180, 205, 240, 260, 280])
    expect(inorderValues(emptyAbrSnapshot())).toEqual([])
  })

  it('vérifie l’invariant d’ordre strict', () => {
    expect(isAbr(emptyAbrSnapshot())).toBe(true)
    expect(isAbr(abrCourseSnapshot())).toBe(true)
    expect(isAbr(registreSnapshot())).toBe(true)

    const broken = registreSnapshot()
    const root = rootPointer(broken)
    if (root.kind !== 'node') throw new Error('Root expected')
    const node = getNode(broken, root.id)
    if (!node) throw new Error('Node expected')
    node.payload = { kind: 'int', value: 300 }
    expect(isAbr(broken)).toBe(false)
  })

  it('ignore les nœuds libérés et les cycles dans le parcours infixe', () => {
    const snapshot = createAbrSnapshot([2, 1], [[0, 'gauche', 1]])
    const root = rootPointer(snapshot)
    if (root.kind !== 'node') throw new Error('Root expected')
    const left = getNode(snapshot, 2)
    if (!left) throw new Error('Left node expected')
    left.gauche = { kind: 'node', id: 1 }
    expect(inorderValues(snapshot)).toEqual([1, 2])
  })
})

describe('recherche dans un ABR', () => {
  it('descend d’un seul côté et s’arrête sur la valeur trouvée', () => {
    const steps = runEstInscrit(abrCourseSnapshot(), { numero: 60 })
    const result = last(steps)
    expect(result.console.output).toBe('60 est inscrit\n')
    expect(result.snapshot.traversal?.visitedNodeIds).toEqual([1, 3, 6])
    expect(result.counters.comparisons).toBe(5)
    expect(result.caption).toBe('60 est inscrit : résultat 1.')
    expect(isAbr(result.snapshot)).toBe(true)
  })

  it('termine sur NULL quand la valeur est absente', () => {
    const steps = runEstInscrit(abrCourseSnapshot(), { numero: 65 })
    const result = last(steps)
    expect(result.console.output).toBe('65 n’est pas inscrit\n')
    expect(result.snapshot.traversal?.visitedNodeIds).toEqual([1, 3, 6])
    expect(result.counters.comparisons).toBe(6)
    expect(result.caption).toBe('65 n’est pas inscrit : résultat 0.')
  })

  it('gère l’arbre vide avec le cas de base', () => {
    const steps = runEstInscrit(emptyAbrSnapshot(), { numero: 205 })
    expect(steps.length).toBeGreaterThan(1)
    expect(last(steps).console.output).toBe('205 n’est pas inscrit\n')
    expect(last(steps).snapshot.nodes).toHaveLength(0)
  })
})

describe('insertion dans un ABR', () => {
  it('crée la racine d’un arbre vide et réaffecte racine', () => {
    const steps = runInscrireEtudiant(emptyAbrSnapshot(), { numero: 205 })
    const result = last(steps)
    expect(rootValue(result.snapshot)).toBe(205)
    expect(liveCount(result.snapshot)).toBe(1)
    expect(inorderValues(result.snapshot)).toEqual([205])
    expect(isAbr(result.snapshot)).toBe(true)
    expect(result.console.output).toBe('')
    expect(steps.some((step) => step.fn === 'creerNoeud')).toBe(true)
  })

  it('reconstruit le registre de l’exercice dans l’ordre du cours', () => {
    const steps = runConstruireRegistre(emptyAbrSnapshot())
    const result = last(steps)
    expect(liveCount(result.snapshot)).toBe(7)
    expect(rootValue(result.snapshot)).toBe(205)
    expect(inorderValues(result.snapshot)).toEqual([120, 150, 180, 205, 240, 260, 280])
    expect(isAbr(result.snapshot)).toBe(true)
    expect(result.caption).toBe(
      'Registre construit. Parcours infixe : 120 150 180 205 240 260 280.',
    )
  })

  it('ignore un numéro déjà inscrit', () => {
    const steps = runInscrireEtudiant(registreSnapshot(), { numero: 205 })
    const result = last(steps)
    expect(liveCount(result.snapshot)).toBe(7)
    expect(inorderValues(result.snapshot)).toEqual([120, 150, 180, 205, 240, 260, 280])
    expect(steps.some((step) => step.changes.some((change) => change.kind === 'create'))).toBe(false)
    expect(result.caption).toBe('Inscription de 205 terminée : l’invariant d’ordre est conservé.')
  })

  it('refuse une insertion au-delà de la capacité', () => {
    const snapshot = emptyAbrSnapshot()
    snapshot.maxNodes = 1
    snapshot.nodes.push({
      id: 1,
      address: '0x1A40',
      payload: { kind: 'int', value: 205 },
      gauche: { kind: 'null' },
      droit: { kind: 'null' },
      freed: false,
    })
    snapshot.globals.racine = { kind: 'node', id: 1 }
    snapshot.nextNodeId = 2
    snapshot.nextAddressIndex = 1
    const steps = runInscrireEtudiant(snapshot, { numero: 150 })
    expect(last(steps).caption).toBe(
      'Maximum de 1 nœuds atteint : l’insertion est annulée.',
    )
    expect(liveCount(last(steps).snapshot)).toBe(1)
  })
})

describe('suppression dans un ABR', () => {
  it('cas 1 : libère une feuille et laisse l’arbre valide', () => {
    const steps = runRadierEtudiant(registreSnapshot(), { numero: 120 })
    const result = last(steps)
    expect(inorderValues(result.snapshot)).toEqual([150, 180, 205, 240, 260, 280])
    expect(isAbr(result.snapshot)).toBe(true)
    expect(getNode(result.snapshot, 4)?.freed).toBe(true)
    expect(steps.some((step) => step.caption.includes('feuille'))).toBe(true)
  })

  it('cas 2 : l’enfant restant prend la place du nœud', () => {
    const snapshot = createAbrSnapshot([205, 150, 260, 240], [
      [0, 'gauche', 1],
      [0, 'droit', 2],
      [2, 'gauche', 3],
    ])
    const steps = runRadierEtudiant(snapshot, { numero: 260 })
    const result = last(steps)
    expect(rootValue(result.snapshot)).toBe(205)
    expect(inorderValues(result.snapshot)).toEqual([150, 205, 240])
    expect(isAbr(result.snapshot)).toBe(true)
    expect(getNode(result.snapshot, 3)?.freed).toBe(true)
    expect(getNode(result.snapshot, 4)?.freed).toBe(false)
    expect(steps.some((step) => step.caption.includes('un seul enfant'))).toBe(true)
  })

  it('cas 3 : le successeur 240 remplace la racine 205', () => {
    const steps = runRadierEtudiant(registreSnapshot(), { numero: 205 })
    const result = last(steps)
    expect(rootValue(result.snapshot)).toBe(240)
    expect(inorderValues(result.snapshot)).toEqual([120, 150, 180, 240, 260, 280])
    expect(isAbr(result.snapshot)).toBe(true)
    expect(getNode(result.snapshot, 1)?.payload).toEqual({ kind: 'int', value: 240 })
    expect(getNode(result.snapshot, 6)?.freed).toBe(true)
    expect(rootPointer(result.snapshot)).toEqual({ kind: 'node', id: 1 })

    const afterCopy = steps.find((step) => step.fn === 'supprimerABR' && step.line === 20)
    expect(afterCopy?.caption).toBe('Le nœud qui contenait 205 reçoit la valeur 240.')
    expect(afterCopy ? isAbr(afterCopy.snapshot) : true).toBe(false)

    const successor = steps.find((step) => step.caption.includes('Le successeur est le minimum'))
    expect(successor?.caption).toBe('Le successeur est le minimum du sous-arbre droit : 240.')

    const minimumReturn = steps.find(
      (step) => step.caption === 'Aucun enfant gauche : 240 est le minimum.',
    )
    expect(minimumReturn?.line).toBe(4)
    expect(
      steps.some(
        (step) => step.caption === 'supprimerABR retourne le nœud 240 à son appelant.',
      ),
    ).toBe(true)
  })

  it('ne modifie rien quand le numéro est absent', () => {
    const steps = runRadierEtudiant(registreSnapshot(), { numero: 999 })
    const result = last(steps)
    expect(result.snapshot.nodes).toHaveLength(7)
    expect(result.snapshot.nodes.every((node) => !node.freed)).toBe(true)
    expect(inorderValues(result.snapshot)).toEqual([120, 150, 180, 205, 240, 260, 280])
  })

  it('gère la suppression dans un arbre vide', () => {
    const steps = runRadierEtudiant(emptyAbrSnapshot(), { numero: 205 })
    expect(last(steps).snapshot.nodes).toHaveLength(0)
    expect(steps.some((step) => step.caption.includes('absent'))).toBe(true)
  })
})

describe('parcours et scénarios du chapitre 7', () => {
  it('affiche les numéros triés avec le parcours infixe', () => {
    const operation = abrOperations.find((candidate) => candidate.id === 'parcoursInfixe')
    if (!operation) throw new Error('Operation expected')
    const steps = operation.run(registreSnapshot(), {})
    expect(last(steps).console.output).toBe('120 150 180 205 240 260 280 ')
    expect(last(steps).snapshot.traversal?.visitedNodeIds).toHaveLength(7)
  })

  it('déclare des scénarios dont les opérations existent', () => {
    const ids = new Set(abrOperations.map((operation) => operation.id))
    expect(abrScenarios.map((scenario) => scenario.id)).toEqual([
      'registre',
      'cours',
      'radiations',
      'vide',
    ])
    for (const scenario of abrScenarios) {
      expect(scenario.profileId).toBe('int')
      for (const step of scenario.steps) expect(ids.has(step.operationId)).toBe(true)
    }
  })

  it('n’émet que des fonctions présentes dans le panneau de code', () => {
    const runs = [
      runConstruireRegistre(emptyAbrSnapshot()),
      runEstInscrit(abrCourseSnapshot(), { numero: 60 }),
      runInscrireEtudiant(registreSnapshot(), { numero: 200 }),
      runRadierEtudiant(registreSnapshot(), { numero: 205 }),
    ]
    for (const steps of runs) {
      for (const step of steps) expect(abrCode[step.fn], step.fn).toBeDefined()
    }
  })

  it('expose le chapitre 7 avec un maximum de douze nœuds', () => {
    expect(abrPlugin.chapter).toBe(7)
    expect(abrPlugin.id).toBe('abr')
    expect(abrPlugin.profiles[0]?.maxNodes).toBe(12)
    expect(abrPlugin.profiles[0]?.defaultScenarioId).toBe('registre')
    expect(abrPlugin.SupportingPanels).toBeDefined()
  })
})
