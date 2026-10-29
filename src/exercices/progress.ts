/** Versioned browser storage for exercise progress. */
export const EXERCICES_STORAGE_KEY = 'exercices-progress-v1'

const STORAGE_VERSION = 1

export interface ExerciseProgress {
  /** Zero-based index of the question currently displayed. */
  question: number
  /** Identifiers of the solutions revealed for this sheet. */
  revealed: string[]
}

interface ProgressDocument {
  version: number
  exercises: Record<string, unknown>
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readDocument(): ProgressDocument | null {
  const store = storage()
  if (!store) return null

  try {
    const raw = store.getItem(EXERCICES_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== STORAGE_VERSION) return null
    if (!isRecord(parsed.exercises)) return null
    return { version: STORAGE_VERSION, exercises: parsed.exercises }
  } catch {
    return null
  }
}

function clampQuestion(value: unknown, questionCount: number): number {
  if (questionCount <= 0) return 0
  if (typeof value !== 'number' || !Number.isInteger(value)) return 0
  return Math.min(Math.max(value, 0), questionCount - 1)
}

function validRevealed(value: unknown, questionIds: readonly string[]): string[] {
  if (!Array.isArray(value)) return []
  const unique = new Set<string>()
  for (const entry of value) {
    if (typeof entry === 'string' && questionIds.includes(entry)) unique.add(entry)
  }
  return [...unique]
}

export function readExerciseProgress(
  exerciseId: string,
  questions: readonly { id: string }[],
): ExerciseProgress {
  const fallback: ExerciseProgress = { question: 0, revealed: [] }
  const document = readDocument()
  if (!document) return fallback

  const entry = document.exercises[exerciseId]
  if (!isRecord(entry)) return fallback

  return {
    question: clampQuestion(entry.question, questions.length),
    revealed: validRevealed(entry.revealed, questions.map((question) => question.id)),
  }
}

export function writeExerciseProgress(
  exerciseId: string,
  question: number,
  revealed: readonly string[],
  questions: readonly { id: string }[],
): void {
  const store = storage()
  if (!store) return

  const document = readDocument() ?? { version: STORAGE_VERSION, exercises: {} }
  const next: ProgressDocument = {
    version: STORAGE_VERSION,
    exercises: {
      ...document.exercises,
      [exerciseId]: {
        question: clampQuestion(question, questions.length),
        revealed: validRevealed(revealed, questions.map((item) => item.id)),
      },
    },
  }

  try {
    store.setItem(EXERCICES_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // Private mode, quota exceeded or storage disabled: progress is optional.
  }
}
