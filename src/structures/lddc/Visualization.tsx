import type { JSX } from 'react'
import type { VisualizationProps } from '../../core/types'
import LdcVisualization from '../ldc/Visualization'
import type { LdcSnapshot } from './memory'

/**
 * Chapter 5 shows the doubly linked circular list as a ring of nodes while
 * reusing chapter 4's simulation, camera and styling.
 */
export default function LddcVisualization(
  props: VisualizationProps<LdcSnapshot>,
): JSX.Element {
  return <LdcVisualization {...props} layoutMode="circle" />
}
