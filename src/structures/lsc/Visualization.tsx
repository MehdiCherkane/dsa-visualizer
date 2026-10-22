import type { JSX } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import LinkedVisualization from '../shared/LinkedVisualization'
import type { LinkedModel, VizNode, VizPin } from '../shared/linkedViz'
import { payloadText, studentSubtitle } from './memory'
import type { LscSnapshot } from './memory'

function makeModel(profile: LscSnapshot['profile']): LinkedModel<LscSnapshot> {
  return {
    orientation: 'horizontal',
    field: 'suivant',
    fieldLabel: fr.viz.nextCell,
    rowLabel: fr.viz.row,
    emptyText: fr.viz.emptyLsc,
    emptyInsert:
      profile === 'etudiant' ? fr.viz.insertEmptyEtudiant : fr.viz.insertEmptyLsc,
    ariaLabel: fr.chapters.lsc.title,
    globalLegend: fr.legend.debut,
    nodes(snapshot) {
      return snapshot.nodes.map<VizNode>((node) => {
        const subtitle = studentSubtitle(node)
        return {
          id: node.id,
          address: node.address,
          slot: node.slot,
          lane: node.lane,
          freed: node.freed,
          value: payloadText(node),
          ...(subtitle ? { subvalue: subtitle } : {}),
          uninit: node.payload.kind === 'uninit',
          pointer: node.suivant,
          pointerUninit: node.suivant.kind === 'uninit',
        }
      })
    },
    globals(snapshot) {
      return [{ name: 'debut', value: snapshot.globals.debut ?? { kind: 'null' } }]
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

const intModel = makeModel('int')
const studentModel = makeModel('etudiant')

export default function LscVisualization(props: VisualizationProps<LscSnapshot>): JSX.Element {
  const model = props.snapshot.profile === 'etudiant' ? studentModel : intModel
  return <LinkedVisualization {...props} model={model} />
}
