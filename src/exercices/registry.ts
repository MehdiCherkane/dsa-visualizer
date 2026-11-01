import { chapitre1Exercises } from './data/chapitre1'
import type { Exercise } from './types'

/**
 * Adding a new PDF is deliberately a two-step operation: create a typed data
 * file, then spread its exercises into this list.
 */
const registeredExercises: Exercise[] = [...chapitre1Exercises]

export const exercises: readonly Exercise[] = registeredExercises

export function exerciseById(id: string): Exercise | undefined {
  return registeredExercises.find((exercise) => exercise.id === id)
}

export function exercisesForChapter(chapter: number): readonly Exercise[] {
  return registeredExercises.filter((exercise) => exercise.chapter === chapter)
}

export function totalQuestionCount(list: readonly Exercise[] = registeredExercises): number {
  return list.reduce((total, exercise) => total + exercise.questions.length, 0)
}
