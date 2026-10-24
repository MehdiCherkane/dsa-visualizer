import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { intCode, intTypes } from './code/int'
import { studentCode, studentTypes } from './code/student'
import {
  MAX_NODES,
  countListNodes,
  emptySnapshot,
  formatVarValue,
  payloadKey,
  requireNode,
} from './memory'
import type { LscSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'
import LscVisualization from './Visualization'

export const lscPlugin: StructurePlugin<LscSnapshot> = {
  id: 'lsc',
  chapter: 2,
  title: fr.chapters.lsc.title,
  description: fr.chapters.lsc.description,
  profiles: [
    {
      id: 'int',
      label: fr.profiles.int,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('int'),
      operations: intOperations,
      scenarios: intScenarios,
      code: intCode,
      typesCode: intTypes,
      defaultOperationId: 'supprimerValeur',
      emptyInsertOperationId: 'insererEnTete',
    },
    {
      id: 'etudiant',
      label: fr.profiles.etudiant,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('etudiant'),
      operations: studentOperations,
      scenarios: studentScenarios,
      code: studentCode,
      typesCode: studentTypes,
      defaultOperationId: 'radierEtudiant',
      emptyInsertOperationId: 'inscrireEtudiant',
    },
  ],
  Visualization: LscVisualization,
  countNodes: countListNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
  summarize: (snapshot) =>
    `debut = ${formatVarValue(snapshot, snapshot.globals.debut ?? { kind: 'null' })}`,
}
