import type { ScenarioDef, StudentValue } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createSnapshot } from './memory'
import type { LscItem, LscSnapshot } from './memory'

const intItems = (values: number[]): LscItem[] => values.map((value) => ({ kind: 'int', value }))

const studentItems = (students: StudentValue[]): LscItem[] =>
  students.map((student) => ({ kind: 'etudiant', student }))

const E1: StudentValue = { numero: 101, nom: 'AAA', prenom: 'aaa' }
const E2: StudentValue = { numero: 102, nom: 'BBB', prenom: 'bbb' }
const E3: StudentValue = { numero: 103, nom: 'CCC', prenom: 'ccc' }

const base925 = createSnapshot('int', intItems([9, 2, 5]))
const base25 = createSnapshot('int', intItems([2, 5]))
const emptyInt = createSnapshot('int', [])
const emptyRegistry = createSnapshot('etudiant', [])

const S = fr.lsc.scenarios

export const intScenarios: ScenarioDef<LscSnapshot>[] = [
  {
    id: 'cours',
    title: S.cours.title,
    description: S.cours.description,
    profileId: 'int',
    state: base925,
    steps: [],
  },
  {
    id: 'milieu',
    title: S.milieu.title,
    description: S.milieu.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 2 } },
      { operationId: 'supprimerValeur', params: { valeur: 5 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'tete',
    title: S.tete.title,
    description: S.tete.description,
    profileId: 'int',
    state: base25,
    steps: [
      { operationId: 'insererEnTete', params: { valeur: 9 } },
      { operationId: 'insererEnFin', params: { valeur: 7 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'absente',
    title: S.absente.title,
    description: S.absente.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 99 } },
      { operationId: 'rechercher', params: { valeur: 99 } },
    ],
  },
  {
    id: 'detruire',
    title: S.detruire.title,
    description: S.detruire.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'detruireListe', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'vide',
    title: 'Liste vide',
    description: 'Point de départ vide pour insérer un premier nœud.',
    profileId: 'int',
    state: emptyInt,
    steps: [],
  },
]

export const studentScenarios: ScenarioDef<LscSnapshot>[] = [
  {
    id: 'registre',
    title: S.registre.title,
    description: S.registre.description,
    profileId: 'etudiant',
    state: emptyRegistry,
    steps: [
      {
        operationId: 'inscrireEtudiant',
        params: { numero: E1.numero, nom: E1.nom, prenom: E1.prenom },
      },
      {
        operationId: 'inscrireEtudiant',
        params: { numero: E2.numero, nom: E2.nom, prenom: E2.prenom },
      },
      {
        operationId: 'inscrireEtudiant',
        params: { numero: E3.numero, nom: E3.nom, prenom: E3.prenom },
      },
      { operationId: 'radierEtudiant', params: { numero: 102 } },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'registreDepart',
    title: 'Registre de départ',
    description: 'Registre 101 → 102 → 103 prêt pour les exercices.',
    profileId: 'etudiant',
    state: createSnapshot('etudiant', studentItems([E1, E2, E3])),
    steps: [],
  },
]
