import type { Exercise } from './types'

/**
 * Exercise progress is intentionally small and versioned, like the layout
 * storage: a stale or malformed value must never prevent the page from
 * opening.
 */
export const EXERCICES_STORAGE_KEY = 'ldc-exercices-v1'
const EXERCICES_VERSION = 1

export interface ExercicesProgress {
  /** Exercise id -> current question index. */
  current: Record<string, number>
  /** Exercise id -> ids of questions whose solution has been revealed. */
  revealed: Record<string, string[]>
}

export function createEmptyProgress(): ExercicesProgress {
  return { current: {}, revealed: {} }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeProgress(
  value: unknown,
  list: readonly Exercise[],
): ExercicesProgress {
  const fallback = createEmptyProgress()
  if (!isRecord(value)) return fallback

  const currentValue = isRecord(value.current) ? value.current : {}
  const revealedValue = isRecord(value.revealed) ? value.revealed : {}
  const current: Record<string, number> = {}
  const revealed: Record<string, string[]> = {}

  for (const exercise of list) {
    const rawIndex = currentValue[exercise.id]
    if (
      typeof rawIndex === 'number' &&
      Number.isInteger(rawIndex) &&
      rawIndex >= 0 &&
      rawIndex < exercise.questions.length
    ) {
      current[exercise.id] = rawIndex
    }

    const rawRevealed = revealedValue[exercise.id]
    if (Array.isArray(rawRevealed)) {
      const validIds = new Set(exercise.questions.map((question) => question.id))
      const ids = rawRevealed.filter(
        (id): id is string => typeof id === 'string' && validIds.has(id),
      )
      const uniqueIds = [...new Set(ids)]
      if (uniqueIds.length > 0) revealed[exercise.id] = uniqueIds
    }
  }

  return { current, revealed }
}

export function readProgress(list: readonly Exercise[]): ExercicesProgress {
  if (typeof window === 'undefined') return createEmptyProgress()
  try {
    const raw = window.localStorage.getItem(EXERCICES_STORAGE_KEY)
    if (!raw) return createEmptyProgress()
    const parsed = JSON.parse(raw) as { version?: unknown; progress?: unknown }
    if (parsed.version !== EXERCICES_VERSION) return createEmptyProgress()
    return normalizeProgress(parsed.progress, list)
  } catch {
    return createEmptyProgress()
  }
}

export function writeProgress(progress: ExercicesProgress): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      EXERCICES_STORAGE_KEY,
      JSON.stringify({ version: EXERCICES_VERSION, progress }),
    )
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function currentQuestionIndex(
  progress: ExercicesProgress,
  exerciseId: string,
  total: number,
): number {
  const stored = progress.current[exerciseId]
  if (typeof stored !== 'number' || !Number.isInteger(stored) || stored < 0) return 0
  return Math.min(stored, Math.max(0, total - 1))
}

export function isSolutionRevealed(
  progress: ExercicesProgress,
  exerciseId: string,
  questionId: string,
): boolean {
  return progress.revealed[exerciseId]?.includes(questionId) ?? false
}

export function withCurrentQuestion(
  progress: ExercicesProgress,
  exerciseId: string,
  index: number,
): ExercicesProgress {
  if (progress.current[exerciseId] === index) return progress
  return {
    ...progress,
    current: { ...progress.current, [exerciseId]: index },
  }
}

export function withSolutionRevealed(
  progress: ExercicesProgress,
  exerciseId: string,
  questionId: string,
): ExercicesProgress {
  const current = progress.revealed[exerciseId] ?? []
  if (current.includes(questionId)) return progress
  return {
    ...progress,
    revealed: { ...progress.revealed, [exerciseId]: [...current, questionId] },
  }
}

export function withSolutionHidden(
  progress: ExercicesProgress,
  exerciseId: string,
  questionId: string,
): ExercicesProgress {
  const current = progress.revealed[exerciseId]
  if (!current?.includes(questionId)) return progress
  const next = current.filter((id) => id !== questionId)
  const revealed = { ...progress.revealed }
  if (next.length === 0) {
    delete revealed[exerciseId]
  } else {
    revealed[exerciseId] = next
  }
  return { ...progress, revealed }
}
