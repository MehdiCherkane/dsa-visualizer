import type { ScenarioDef } from '../../core/types'
import { fr } from '../../i18n/fr'
import { courseTreeSnapshot, emptyTreeSnapshot, exerciseTreeSnapshot } from './memory'
import type { TreeSnapshot } from './memory'

export const treeScenarios: ScenarioDef<TreeSnapshot>[] = [
  {
    id: 'cours',
    title: fr.trees.scenarios.cours.title,
    description: fr.trees.scenarios.cours.description,
    profileId: 'int',
    state: emptyTreeSnapshot(),
    steps: [
      { operationId: 'construireArbre', params: {} },
      { operationId: 'parcoursPrefixe', params: {} },
      { operationId: 'parcoursInfixe', params: {} },
      { operationId: 'parcoursPostfixe', params: {} },
    ],
  },
  {
    id: 'exercice',
    title: fr.trees.scenarios.exercice.title,
    description: fr.trees.scenarios.exercice.description,
    profileId: 'int',
    state: exerciseTreeSnapshot(),
    steps: [
      { operationId: 'parcoursPrefixe', params: {} },
      { operationId: 'parcoursInfixe', params: {} },
      { operationId: 'parcoursPostfixe', params: {} },
    ],
  },
  {
    id: 'vide',
    title: fr.trees.scenarios.vide.title,
    description: fr.trees.scenarios.vide.description,
    profileId: 'int',
    state: emptyTreeSnapshot(),
    steps: [
      { operationId: 'parcoursPrefixe', params: {} },
      { operationId: 'parcoursInfixe', params: {} },
      { operationId: 'parcoursPostfixe', params: {} },
    ],
  },
  {
    id: 'destruction',
    title: fr.trees.scenarios.destruction.title,
    description: fr.trees.scenarios.destruction.description,
    profileId: 'int',
    state: courseTreeSnapshot(),
    steps: [{ operationId: 'detruireArbre', params: {} }],
  },
]
