/** One visual stack of 4-digit packets, listed from the top of the stack. */
export interface SimulationStack {
  label: string
  packets: number[]
  hint?: string
}

/** A digit string cut into groups of up to 4, with one group highlighted. */
export interface SimulationDigits {
  label: string
  groups: string[]
  active: number
  hint?: string
}

/** A variable shown in the simulation board. */
export interface SimulationVariable {
  name: string
  value: string
}

/** One step of a question's logic trace. */
export interface SimulationFrame {
  title: string
  detail: string
  stacks?: SimulationStack[]
  digits?: SimulationDigits
  carry?: number
  output?: string
  calls?: string[]
  vars?: SimulationVariable[]
}

/** A short, self-contained simulation attached to a question. */
export interface QuestionSimulation {
  title: string
  intro: string
  frames: SimulationFrame[]
}

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
  /** Step-by-step trace of the question's logic, shown beside the statement. */
  simulation?: QuestionSimulation
}
