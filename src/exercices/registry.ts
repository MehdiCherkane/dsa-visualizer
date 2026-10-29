import type { Exercise } from './types'

const registered: Exercise[] = []

/** Adds sheets to the exercise registry. Duplicate identifiers are refused. */
export function registerExercices(...exercises: Exercise[]): void {
  for (const exercise of exercises) {
    if (registered.some((candidate) => candidate.id === exercise.id)) {
      throw new Error(`Exercice déjà enregistré : ${exercise.id}`)
    }
    registered.push(exercise)
  }
}

export function getExercices(): readonly Exercise[] {
  return registered
}

export function exerciceById(id: string): Exercise | undefined {
  return registered.find((exercise) => exercise.id === id)
}
