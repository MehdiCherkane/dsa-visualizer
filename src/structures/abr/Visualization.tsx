import type { JSX } from 'react'
import type { VisualizationProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import type { TreeSnapshot } from '../trees/memory'
import TreeVisualization from '../trees/Visualization'

export default function AbrVisualization(
  props: VisualizationProps<TreeSnapshot>,
): JSX.Element {
  return (
    <TreeVisualization
      {...props}
      ariaLabel={fr.chapters.abr.title}
      visitedLabel={fr.abr.viz.visited}
    />
  )
}
