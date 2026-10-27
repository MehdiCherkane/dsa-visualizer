import type { JSX } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import LinkedVisualization from '../shared/LinkedVisualization'
import type { LinkedModel, VizNode, VizPin } from '../shared/linkedViz'
import { payloadText } from './memory'
import type { LscSnapshot } from './memory'

function makeModel(profile: LscSnapshot['profile']): LinkedModel<LscSnapshot> {
  const circular = profile === 'circulaire'
  return {
    orientation: 'horizontal',
    field: 'suivant',
    fieldLabel: fr.viz.nextCell,
    rowLabel: fr.viz.row,
    circular,
    emptyText: circular ? fr.viz.emptyLscCirculaire : fr.viz.emptyLsc,
    emptyInsert: circular ? fr.viz.insertEmptyLscCirculaire : fr.viz.insertEmptyLsc,
    ariaLabel: fr.chapters.lsc.title,
    nodes(snapshot) {
      return snapshot.nodes.map<VizNode>((node) => ({
        id: node.id,
        address: node.address,
        slot: node.slot,
        lane: node.lane,
        freed: node.freed,
        value: payloadText(node),
        uninit: node.payload.kind === 'uninit',
        pointer: node.suivant,
        pointerUninit: node.suivant.kind === 'uninit',
      }))
    },
    globals(snapshot) {
      return [
        { name: 'debut', value: snapshot.globals.debut ?? { kind: 'null' }, placement: 'top' },
      ]
    },
    pins(snapshot) {
      const frame = snapshot.frames[snapshot.frames.length - 1]
      if (!frame) return []
      const pins: VizPin[] = []
      for (const [name, value] of Object.entries(frame.vars)) {
        if (value.kind === 'node' || value.kind === 'null' || value.kind === 'uninit') {
          pins.push({ name, value })
        }
      }
      return pins
    },
  }
}

const linearModel = makeModel('lineaire')
const circularModel = makeModel('circulaire')

export default function LscVisualization(props: VisualizationProps<LscSnapshot>): JSX.Element {
  const model = props.snapshot.profile === 'circulaire' ? circularModel : linearModel
  return <LinkedVisualization {...props} model={model} />
}
