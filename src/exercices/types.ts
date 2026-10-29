/** A single exercise sheet: one TP, its context and its numbered questions. */
export interface Exercise {
  id: string
  title: string
  chapter: number
  intro?: string
  questions: Question[]
}

/** One question of a sheet. The solution is stored beside the statement. */
export interface Question {
  id: string
  title: string
  statement: string
  hints?: string[]
  solutionCode: string
  solutionNotes?: string
}
