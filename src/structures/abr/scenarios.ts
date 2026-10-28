import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { TreeSnapshot } from '../trees/memory'
import { abrCourseSnapshot, emptyAbrSnapshot, registreSnapshot } from './memory'

export const abrIntScenarios: ScenarioDef<TreeSnapshot>[] = [
  {
    id: 'cours',
    title: fr.abr.scenarios.cours.title,
    description: fr.abr.scenarios.cours.description,
    profileId: 'int',
    state: abrCourseSnapshot(),
    steps: [
      { operationId: 'rechercherABR', params: { valeur: 60 } },
      { operationId: 'rechercherABR', params: { valeur: 65 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
  {
    id: 'vide',
    title: fr.abr.scenarios.vide.title,
    description: fr.abr.scenarios.vide.description,
    profileId: 'int',
    state: emptyAbrSnapshot(),
    steps: [
      { operationId: 'rechercherABR', params: { valeur: 205 } },
      { operationId: 'supprimerABR', params: { valeur: 205 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
]

export const abrStudentScenarios: ScenarioDef<TreeSnapshot>[] = [
  {
    id: 'registre',
    title: fr.abr.scenarios.registre.title,
    description: fr.abr.scenarios.registre.description,
    profileId: 'etudiant',
    state: emptyAbrSnapshot(),
    steps: [
      { operationId: 'construireRegistre', params: {} },
      { operationId: 'estInscrit', params: { numero: 180 } },
      { operationId: 'radierEtudiant', params: { numero: 205 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
  {
    id: 'radiations',
    title: fr.abr.scenarios.radiations.title,
    description: fr.abr.scenarios.radiations.description,
    profileId: 'etudiant',
    state: registreSnapshot(),
    steps: [
      { operationId: 'radierEtudiant', params: { numero: 120 } },
      { operationId: 'radierEtudiant', params: { numero: 260 } },
      { operationId: 'radierEtudiant', params: { numero: 205 } },
    ],
  },
]
