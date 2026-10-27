import type { JSX } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import LinkedVisualization from '../shared/LinkedVisualization'
import type { LinkedModel, VizNode, VizPin } from '../shared/linkedViz'
import { payloadText } from './memory'
import type { PfSnapshot } from './memory'

function framePins(snapshot: PfSnapshot): VizPin[] {
  const frame = snapshot.frames[snapshot.frames.length - 1]
  if (!frame) return []
  const pins: VizPin[] = []
  for (const [name, value] of Object.entries(frame.vars)) {
    if (value.kind === 'node' || value.kind === 'null' || value.kind === 'uninit') {
      pins.push({ name, value })
    }
  }
  return pins
}

const pileModel: LinkedModel<PfSnapshot> = {
  orientation: 'vertical',
  field: 'precedent',
  fieldLabel: fr.viz.prevCell,
  rowLabel: fr.viz.rowPile,
  emptyText: fr.viz.emptyPile,
  emptyInsert: fr.viz.insertEmptyPile,
  ariaLabel: fr.chapters.pilesFiles.title,
  showHeap: true,
  fitContent: true,
  fitPadding: 48,
  adaptiveLabels: true,
  directionalMotion: true,
  nodes(snapshot) {
    if (snapshot.profile !== 'pile') return []
    return snapshot.nodes.map<VizNode>((node) => ({
      id: node.id,
      address: node.address,
      slot: node.slot,
      lane: 'heap',
      freed: node.freed,
      value: payloadText(node),
      uninit: node.value === null,
      pointer: node.precedent,
      pointerUninit: node.precedent.kind === 'uninit',
    }))
  },
  globals(snapshot) {
    if (snapshot.profile !== 'pile') return []
    return [{ name: 'sommet', value: snapshot.globals.sommet, placement: 'row' }]
  },
  pins: framePins,
}

const fileModel: LinkedModel<PfSnapshot> = {
  orientation: 'horizontal',
  field: 'suivant',
  fieldLabel: fr.viz.nextCell,
  rowLabel: fr.viz.rowFile,
  emptyText: fr.viz.emptyFile,
  emptyInsert: fr.viz.insertEmptyFile,
  ariaLabel: fr.chapters.pilesFiles.title,
  pinAnchor: 'right',
  fitContent: true,
  fitPadding: 48,
  adaptiveLabels: true,
  directionalMotion: true,
  nodes(snapshot) {
    if (snapshot.profile !== 'file') return []
    return snapshot.nodes.map<VizNode>((node) => ({
      id: node.id,
      address: node.address,
      slot: node.slot,
      lane: node.lane,
      freed: node.freed,
      value: payloadText(node),
      uninit: node.value === null,
      pointer: node.suivant,
      pointerUninit: node.suivant.kind === 'uninit',
    }))
  },
  globals(snapshot) {
    if (snapshot.profile !== 'file') return []
    return [
      { name: 'debut', value: snapshot.globals.debut, placement: 'top-center' },
      { name: 'fin', value: snapshot.globals.fin, placement: 'bottom' },
    ]
  },
  pins: framePins,
}

export default function PilesFilesVisualization(
  props: VisualizationProps<PfSnapshot>,
): JSX.Element {
  const model = props.snapshot.profile === 'pile' ? pileModel : fileModel
  return <LinkedVisualization {...props} model={model} />
}
