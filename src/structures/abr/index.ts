import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { countTreeNodes, formatVarValue, payloadKey, requireNode } from '../trees/memory'
import type { TreeSnapshot } from '../trees/memory'
import { abrCode, abrTypes } from './code/int'
import { ABR_MAX_NODES, emptyAbrSnapshot } from './memory'
import { abrOperations } from './ops/abrOps'
import { abrScenarios } from './scenarios'
import AbrSupportPanels from './SupportPanels'
import AbrVisualization from './Visualization'

export const abrPlugin: StructurePlugin<TreeSnapshot> = {
  id: 'abr',
  chapter: 7,
  title: fr.chapters.abr.title,
  description: fr.chapters.abr.description,
  profiles: [
    {
      id: 'int',
      label: fr.profiles.int,
      maxNodes: ABR_MAX_NODES,
      initialState: emptyAbrSnapshot,
      operations: abrOperations,
      scenarios: abrScenarios,
      code: abrCode,
      typesCode: abrTypes,
      defaultOperationId: 'construireRegistre',
      defaultScenarioId: 'registre',
      emptyInsertOperationId: 'inscrireEtudiant',
      counterLabels: { traversed: fr.abr.counters.parcourus, comparisons: fr.abr.counters.comparaisons },
    },
  ],
  Visualization: AbrVisualization,
  SupportingPanels: AbrSupportPanels,
  countNodes: countTreeNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
}
