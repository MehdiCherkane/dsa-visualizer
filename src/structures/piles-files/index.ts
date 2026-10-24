import type { OperationDef, StructurePlugin } from '../../core/types'
import { fr } from '../../i18n/fr'
import { fileCode, fileTypes } from './code/file'
import { pileCode, pileTypes } from './code/pile'
import {
  MAX_NODES,
  countNodes,
  emptySnapshot,
  formatVarValue,
  payloadKey,
  requireFileNode,
  requirePileNode,
} from './memory'
import type { PfSnapshot } from './memory'
import { fileOperations, pileOperations } from './operations'
import { fileScenarios, pileScenarios } from './scenarios'
import PilesFilesVisualization from './Visualization'

/**
 * The plugin contract erases the concrete profile snapshot type, while each
 * operation is written against the profile it belongs to. The profiles below
 * are only ever run with their own snapshot, so widening here is safe.
 */
function asPfOperations<S extends PfSnapshot>(operations: OperationDef<S>[]): OperationDef<PfSnapshot>[] {
  return operations as unknown as OperationDef<PfSnapshot>[]
}

export const pilesFilesPlugin: StructurePlugin<PfSnapshot> = {
  id: 'piles-files',
  chapter: 3,
  title: fr.chapters.pilesFiles.title,
  description: fr.chapters.pilesFiles.description,
  profileSwitchLabel: fr.profiles.structureLabel,
  profiles: [
    {
      id: 'pile',
      label: fr.profiles.pile,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('pile') as PfSnapshot,
      operations: asPfOperations(pileOperations),
      scenarios: pileScenarios,
      code: pileCode,
      typesCode: pileTypes,
      defaultOperationId: 'empiler',
      emptyInsertOperationId: 'empiler',
    },
    {
      id: 'file',
      label: fr.profiles.file,
      maxNodes: MAX_NODES,
      initialState: () => emptySnapshot('file') as PfSnapshot,
      operations: asPfOperations(fileOperations),
      scenarios: fileScenarios,
      code: fileCode,
      typesCode: fileTypes,
      defaultOperationId: 'enfiler',
      emptyInsertOperationId: 'enfiler',
    },
  ],
  Visualization: PilesFilesVisualization,
  countNodes,
  formatValue: formatVarValue,
  nodeKey: (snapshot, nodeId) =>
    payloadKey(
      snapshot.profile === 'pile'
        ? requirePileNode(snapshot, nodeId)
        : requireFileNode(snapshot, nodeId),
    ) ?? 0,
  summarize: (snapshot) =>
    snapshot.profile === 'pile'
      ? `sommet = ${formatVarValue(snapshot, snapshot.globals.sommet)}`
      : `debut = ${formatVarValue(snapshot, snapshot.globals.debut)} · fin = ${formatVarValue(
          snapshot,
          snapshot.globals.fin,
        )}`,
}
