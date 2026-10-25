import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { intCode, intTypes } from './code/int'
import { countTreeNodes, emptyTreeSnapshot, formatVarValue, MAX_NODES, payloadKey, requireNode } from './memory'
import type { TreeSnapshot } from './memory'
import { treeOperations } from './ops/intOps'
import { treeScenarios } from './scenarios'
import TreeVisualization from './Visualization'

export const treesPlugin: StructurePlugin<TreeSnapshot> = {
  id: 'trees',
  chapter: 6,
  title: fr.chapters.trees.title,
  description: fr.chapters.trees.description,
  profiles: [
    {
      id: 'int',
      label: fr.profiles.int,
      maxNodes: MAX_NODES,
      initialState: emptyTreeSnapshot,
      operations: treeOperations,
      scenarios: treeScenarios,
      code: intCode,
      typesCode: intTypes,
      defaultOperationId: 'construireArbre',
    },
  ],
  Visualization: TreeVisualization,
  countNodes: countTreeNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
}
