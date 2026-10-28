import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { TreeSnapshot } from '../trees/memory'
import { abrCourseSnapshot, emptyAbrSnapshot, registreSnapshot } from './memory'

export const abrScenarios: ScenarioDef<TreeSnapshot>[] = [
  {
    id: 'registre',
    title: fr.abr.scenarios.registre.title,
    description: fr.abr.scenarios.registre.description,
    profileId: 'int',
    state: emptyAbrSnapshot(),
    steps: [
      { operationId: 'construireRegistre', params: {} },
      { operationId: 'estInscrit', params: { numero: 180 } },
      { operationId: 'radierEtudiant', params: { numero: 205 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
  {
    id: 'cours',
    title: fr.abr.scenarios.cours.title,
    description: fr.abr.scenarios.cours.description,
    profileId: 'int',
    state: abrCourseSnapshot(),
    steps: [
      { operationId: 'estInscrit', params: { numero: 60 } },
      { operationId: 'estInscrit', params: { numero: 65 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
  {
    id: 'radiations',
    title: fr.abr.scenarios.radiations.title,
    description: fr.abr.scenarios.radiations.description,
    profileId: 'int',
    state: registreSnapshot(),
    steps: [
      { operationId: 'radierEtudiant', params: { numero: 120 } },
      { operationId: 'radierEtudiant', params: { numero: 260 } },
      { operationId: 'radierEtudiant', params: { numero: 205 } },
    ],
  },
  {
    id: 'vide',
    title: fr.abr.scenarios.vide.title,
    description: fr.abr.scenarios.vide.description,
    profileId: 'int',
    state: emptyAbrSnapshot(),
    steps: [
      { operationId: 'estInscrit', params: { numero: 205 } },
      { operationId: 'radierEtudiant', params: { numero: 205 } },
      { operationId: 'parcoursInfixe', params: {} },
    ],
  },
]
