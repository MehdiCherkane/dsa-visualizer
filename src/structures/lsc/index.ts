import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { circularCode, circularTypes } from './code/circular'
import { intCode, intTypes } from './code/int'
import {
  MAX_NODES,
  countListNodes,
  emptySnapshot,
  formatVarValue,
  payloadKey,
  requireNode,
} from './memory'
import type { LscSnapshot } from './memory'
import { circularOperations, linearOperations } from './operations'
import { circularScenarios, linearScenarios } from './scenarios'
import LscVisualization from './Visualization'

export const lscPlugin: StructurePlugin<LscSnapshot> = {
  id: 'lsc',
  chapter: 2,
  title: fr.chapters.lsc.title,
  description: fr.chapters.lsc.description,
  profileSwitchLabel: fr.profiles.structureLabel,
  profiles: [
    {
      id: 'lineaire',
      label: fr.profiles.lineaire,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('lineaire'),
      operations: linearOperations,
      scenarios: linearScenarios,
      code: intCode,
      typesCode: intTypes,
      defaultOperationId: 'supprimerValeur',
      emptyInsertOperationId: 'insererEnTete',
    },
    {
      id: 'circulaire',
      label: fr.profiles.circulaire,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('circulaire'),
      operations: circularOperations,
      scenarios: circularScenarios,
      code: circularCode,
      typesCode: circularTypes,
      defaultOperationId: 'supprimerValeur',
      emptyInsertOperationId: 'insererEnTete',
    },
  ],
  Visualization: LscVisualization,
  countNodes: countListNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
  summarize: (snapshot) =>
    `debut = ${formatVarValue(snapshot, snapshot.globals.debut ?? { kind: 'null' })}`,
}
