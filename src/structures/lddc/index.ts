import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import LddcVisualization from './Visualization'
import { intCode, intTypes } from './code/int'
import { studentCode, studentTypes } from './code/student'
import {
  MAX_NODES,
  countListNodes,
  emptyCircularSnapshot,
  formatVarValue,
  payloadKey,
  requireNode,
} from './memory'
import type { LdcSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'

export const lddcPlugin: StructurePlugin<LdcSnapshot> = {
  id: 'lddc',
  chapter: 5,
  title: fr.chapters.lddc.title,
  description: fr.chapters.lddc.description,
  profiles: [
    {
      id: 'int',
      label: fr.profiles.int,
      maxNodes: MAX_NODES,
      initialState: () => emptyCircularSnapshot('int'),
      operations: intOperations,
      scenarios: intScenarios,
      code: intCode,
      typesCode: intTypes,
      defaultOperationId: 'afficherListe',
      defaultScenarioId: 'vide',
      emptyInsertOperationId: 'insererEnTete',
    },
    {
      id: 'etudiant',
      label: fr.profiles.etudiant,
      maxNodes: MAX_NODES,
      initialState: () => emptyCircularSnapshot('etudiant'),
      operations: studentOperations,
      scenarios: studentScenarios,
      code: studentCode,
      typesCode: studentTypes,
      defaultOperationId: 'inscrireEtudiant',
      emptyInsertOperationId: 'inscrireEtudiant',
    },
  ],
  Visualization: LddcVisualization,
  countNodes: countListNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
}
