export type Question = {
  id: string
  title: string
  statement: string
  hints?: string[]
  solutionCode: string
  solutionNotes?: string
}

export type Exercise = {
  id: string
  title: string
  chapter: number
  intro?: string
  questions: Question[]
}
