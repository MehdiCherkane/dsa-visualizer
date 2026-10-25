import type { StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { fileCirculaire, fileDecalage, fileOrdinaire } from './code/file'
import { pileCode, pileTypes } from './code/pile'
import {
  MAX_CELLS,
  countOccupied,
  emptySnapshot,
  formatVarValue,
  summarize,
} from './memory'
import type { ArraySnapshot } from './memory'
import {
  fileCirculaireOperations,
  fileDecalageOperations,
  fileOrdinaireOperations,
  pileOperations,
} from './operations'
import {
  fileCirculaireScenarios,
  fileDecalageScenarios,
  fileOrdinaireScenarios,
  pileScenarios,
} from './scenarios'
import StaticStructuresVisualization from './Visualization'
import { StaticStructuresSupport } from './SupportPanels'

const labels = fr.staticStructures.counterLabels

export const pilesFilesStatiquesPlugin: StructurePlugin<ArraySnapshot> = {
  id: 'piles-files-statiques',
  chapter: 1,
  title: fr.chapters.staticStructures.title,
  description: fr.chapters.staticStructures.description,
  profileSwitchLabel: fr.profiles.structureLabel,
  profiles: [
    {
      id: 'pile',
      label: fr.profiles.pile,
      maxNodes: MAX_CELLS,
      initialState: () => emptySnapshot('pile'),
      operations: pileOperations,
      scenarios: pileScenarios,
      code: pileCode,
      typesCode: pileTypes,
      defaultOperationId: 'empiler',
      emptyInsertOperationId: 'empiler',
      counterLabels: labels.pile,
    },
    {
      id: 'file-ordinaire',
      label: fr.profiles.file1,
      maxNodes: MAX_CELLS,
      initialState: () => emptySnapshot('file-ordinaire'),
      operations: fileOrdinaireOperations,
      scenarios: fileOrdinaireScenarios,
      code: fileOrdinaire.code,
      typesCode: fileOrdinaire.types,
      defaultOperationId: 'enregistrerArrivee',
      emptyInsertOperationId: 'enregistrerArrivee',
      counterLabels: labels.file1,
    },
    {
      id: 'file-decalage',
      label: fr.profiles.file2,
      maxNodes: MAX_CELLS,
      initialState: () => emptySnapshot('file-decalage'),
      operations: fileDecalageOperations,
      scenarios: fileDecalageScenarios,
      code: fileDecalage.code,
      typesCode: fileDecalage.types,
      defaultOperationId: 'enregistrerArrivee',
      emptyInsertOperationId: 'enregistrerArrivee',
      counterLabels: labels.file2,
    },
    {
      id: 'file-circulaire',
      label: fr.profiles.file3,
      maxNodes: MAX_CELLS,
      initialState: () => emptySnapshot('file-circulaire'),
      operations: fileCirculaireOperations,
      scenarios: fileCirculaireScenarios,
      code: fileCirculaire.code,
      typesCode: fileCirculaire.types,
      defaultOperationId: 'enregistrerArrivee',
      emptyInsertOperationId: 'enregistrerArrivee',
      counterLabels: labels.file3,
    },
  ],
  Visualization: StaticStructuresVisualization,
  SupportingPanels: StaticStructuresSupport,
  countNodes: countOccupied,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) => {
    const entry = snapshot.cells[nodeId]
    return entry ? entry.value.value : 0
  },
  summarize,
}
