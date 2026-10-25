import type { ScenarioDef, StudentValue } from '../../core/types'
import { fr } from '../../i18n/fr'
import { createCircularSnapshot } from './memory'
import type { LdcItem, LdcSnapshot } from './memory'

const intItems = (values: number[]): LdcItem[] => values.map((value) => ({ kind: 'int', value }))

const studentItems = (students: StudentValue[]): LdcItem[] =>
  students.map((student) => ({ kind: 'etudiant', student }))

const E1: StudentValue = { numero: 101, nom: 'AAA', prenom: 'aaa' }
const E2: StudentValue = { numero: 102, nom: 'BBB', prenom: 'bbb' }
const E3: StudentValue = { numero: 103, nom: 'CCC', prenom: 'ccc' }

const base925 = createCircularSnapshot('int', intItems([9, 2, 5]))
const unique = createCircularSnapshot('int', intItems([9]))
const registry = createCircularSnapshot('etudiant', studentItems([E1, E2, E3]))
const empty = createCircularSnapshot('int', [])
const emptyRegistry = createCircularSnapshot('etudiant', [])

const S = fr.lddc.scenarios

export const intScenarios: ScenarioDef<LdcSnapshot>[] = [
  {
    id: 'cours',
    title: S.cours.title,
    description: S.cours.description,
    profileId: 'int',
    state: base925,
    steps: [],
  },
  {
    id: 'tour',
    title: S.tour.title,
    description: S.tour.description,
    profileId: 'int',
    state: empty,
    steps: [
      { operationId: 'insererEnFin', params: { valeur: 101 } },
      { operationId: 'insererEnFin', params: { valeur: 102 } },
      { operationId: 'insererEnFin', params: { valeur: 103 } },
      { operationId: 'passerAuSuivant', params: {} },
      { operationId: 'passerAuSuivant', params: {} },
    ],
  },
  {
    id: 'tete',
    title: S.tete.title,
    description: S.tete.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'insererEnTete', params: { valeur: 7 } }],
  },
  {
    id: 'queue',
    title: S.queue.title,
    description: S.queue.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'insererEnFin', params: { valeur: 7 } }],
  },
  {
    id: 'suppression',
    title: S.suppression.title,
    description: S.suppression.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 2 } },
      { operationId: 'supprimerValeur', params: { valeur: 9 } },
    ],
  },
  {
    id: 'unique',
    title: S.unique.title,
    description: S.unique.description,
    profileId: 'int',
    state: unique,
    steps: [
      { operationId: 'supprimerValeur', params: { valeur: 9 } },
      { operationId: 'insererEnTete', params: { valeur: 4 } },
    ],
  },
  {
    id: 'envers',
    title: S.envers.title,
    description: S.envers.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'afficherListeEnvers', params: {} }],
  },
  {
    id: 'recherche',
    title: S.recherche.title,
    description: S.recherche.description,
    profileId: 'int',
    state: base925,
    steps: [
      { operationId: 'rechercher', params: { valeur: 2 } },
      { operationId: 'rechercher', params: { valeur: 99 } },
    ],
  },
  {
    id: 'detruire',
    title: S.detruire.title,
    description: S.detruire.description,
    profileId: 'int',
    state: base925,
    steps: [{ operationId: 'detruireListe', params: {} }],
  },
]

export const studentScenarios: ScenarioDef<LdcSnapshot>[] = [
  {
    id: 'registre',
    title: S.registre.title,
    description: S.registre.description,
    profileId: 'etudiant',
    state: emptyRegistry,
    steps: [
      { operationId: 'inscrireEtudiant', params: { numero: E1.numero, nom: E1.nom, prenom: E1.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E2.numero, nom: E2.nom, prenom: E2.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E3.numero, nom: E3.nom, prenom: E3.prenom } },
      { operationId: 'radierEtudiant', params: { num: 102 } },
    ],
  },
  {
    id: 'tourEtudiants',
    title: S.tourEtudiants.title,
    description: S.tourEtudiants.description,
    profileId: 'etudiant',
    state: emptyRegistry,
    steps: [
      { operationId: 'inscrireEtudiant', params: { numero: E1.numero, nom: E1.nom, prenom: E1.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E2.numero, nom: E2.nom, prenom: E2.prenom } },
      { operationId: 'inscrireEtudiant', params: { numero: E3.numero, nom: E3.nom, prenom: E3.prenom } },
      { operationId: 'passerAuSuivant', params: {} },
      { operationId: 'passerAuSuivant', params: {} },
      { operationId: 'afficherListe', params: {} },
    ],
  },
  {
    id: 'detruire',
    title: S.detruireEtudiants.title,
    description: S.detruireEtudiants.description,
    profileId: 'etudiant',
    state: registry,
    steps: [{ operationId: 'detruireListe', params: {} }],
  },
]
