import { registerExercices } from './registry'
import { tp3Exercise } from './tp3'

// Next PDF: import its typed data file here and add it to this single call.
registerExercices(tp3Exercise)

export { exerciceById, getExercices } from './registry'
export type { Exercise, Question } from './types'
