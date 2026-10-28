import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { countTreeNodes, formatVarValue, payloadKey, requireNode } from '../trees/memory'
import type { TreeSnapshot } from '../trees/memory'
import { abrCode, abrTypes } from './code/int'
import { studentAbrCode } from './code/etudiant'
import { ABR_MAX_NODES, emptyAbrSnapshot } from './memory'
import { abrIntOperations, abrStudentOperations } from './ops/abrOps'
import { abrIntScenarios, abrStudentScenarios } from './scenarios'
import AbrSupportPanels from './SupportPanels'
import AbrVisualization from './Visualization'

const counterLabels = {
  traversed: fr.abr.counters.parcourus,
  comparisons: fr.abr.counters.comparaisons,
}

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
      operations: abrIntOperations,
      scenarios: abrIntScenarios,
      code: abrCode,
      typesCode: abrTypes,
      defaultOperationId: 'rechercherABR',
      defaultScenarioId: 'cours',
      emptyInsertOperationId: 'insererABR',
      counterLabels,
    },
    {
      id: 'etudiant',
      label: fr.profiles.etudiant,
      maxNodes: ABR_MAX_NODES,
      initialState: emptyAbrSnapshot,
      operations: abrStudentOperations,
      scenarios: abrStudentScenarios,
      code: studentAbrCode,
      typesCode: abrTypes,
      defaultOperationId: 'construireRegistre',
      defaultScenarioId: 'registre',
      emptyInsertOperationId: 'inscrireEtudiant',
      counterLabels,
    },
  ],
  Visualization: AbrVisualization,
  SupportingPanels: AbrSupportPanels,
  countNodes: countTreeNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => payloadKey(requireNode(snapshot, nodeId)) ?? 0,
}
