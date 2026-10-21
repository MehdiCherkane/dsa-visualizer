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
import type { LdcSnapshot } from './memory'
import { intOperations, studentOperations } from './operations'
import { intScenarios, studentScenarios } from './scenarios'
import LdcVisualization from './Visualization'

export const ldcPlugin: StructurePlugin<LdcSnapshot> = {
  id: 'ldc',
  title: fr.app.title,
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
    },
  ],
  Visualization: LdcVisualization,
  countNodes: countListNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
}
