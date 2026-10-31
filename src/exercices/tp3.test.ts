import { describe, expect, it } from 'vitest'
import { tp3Exercise } from './tp3'

describe('données de la feuille d’exercices (TP 3)', () => {
  it('expose une feuille unique de la somme de deux grands nombres', () => {
    expect(tp3Exercise.id).toBe('tp3-somme-grands-nombres')
    expect(tp3Exercise.title).toContain('Somme de deux grands nombres')
    expect(tp3Exercise.chapter).toBe(3)
    expect(typeof tp3Exercise.intro).toBe('string')
    expect(tp3Exercise.intro?.length ?? 0).toBeGreaterThan(0)
  })

  it('extrait cinq questions en conservant la numérotation', () => {
    expect(tp3Exercise.questions).toHaveLength(5)

    tp3Exercise.questions.forEach((question) => {
      expect(question.id.length).toBeGreaterThan(0)
      expect(question.title.length).toBeGreaterThan(0)
      expect(question.statement.trim().length).toBeGreaterThan(0)
      expect(question.solutionCode.trim().length).toBeGreaterThan(0)
      if (question.hints) {
        expect(question.hints.length).toBeGreaterThan(0)
        for (const hint of question.hints) {
          expect(hint.trim().length).toBeGreaterThan(0)
        }
      }
      if (question.solutionNotes) {
        expect(question.solutionNotes.trim().length).toBeGreaterThan(0)
      }
    })

    const ids = tp3Exercise.questions.map((question) => question.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('suit la progression de l’énoncé vers le corrigé', () => {
    const statements = tp3Exercise.questions.map((question) => question.statement)
    expect(statements[0]).toContain('pileVide')
    expect(statements[1]).toContain('remplir')
    expect(statements[2]).toContain('somme')
    expect(statements[3]).toContain('afficher')
    expect(statements[4]).toContain('main')
  })

  it('suit la numérotation demandée ex1-q1 … ex1-q5', () => {
    tp3Exercise.questions.forEach((question, index) => {
      expect(question.id).toBe(`ex1-q${index + 1}`)
      expect(question.title).toBe(`Question ${index + 1}`)
    })
  })

  it('fournit une simulation pas à pas pour chaque question', () => {
    for (const question of tp3Exercise.questions) {
      const simulation = question.simulation
      expect(simulation).toBeDefined()
      if (!simulation) continue

      expect(simulation.title.trim().length).toBeGreaterThan(0)
      expect(simulation.frames.length).toBeGreaterThan(1)

      for (const frame of simulation.frames) {
        expect(frame.title.trim().length).toBeGreaterThan(0)
        expect(frame.detail.trim().length).toBeGreaterThan(0)
        const hasVisual =
          (frame.stacks?.length ?? 0) > 0 ||
          frame.digits !== undefined ||
          frame.carry !== undefined ||
          frame.output !== undefined ||
          (frame.calls?.length ?? 0) > 0 ||
          (frame.vars?.length ?? 0) > 0
        expect(hasVisual).toBe(true)
      }
    }
  })

  it('empile les paquets de remplir du plus significatif au moins significatif', () => {
    const lastFrame = tp3Exercise.questions[1].simulation?.frames.at(-1)
    expect(lastFrame?.stacks?.[0].packets).toEqual([7890, 3456, 12])
  })

  it('garde le paquet des unités au sommet de la pile résultat', () => {
    const frames = tp3Exercise.questions[2].simulation?.frames ?? []
    const transfer = frames.find((frame) => frame.title.startsWith('Transférer'))
    expect(transfer?.stacks?.find((stack) => stack.label === 'S')?.packets).toEqual([
      1100,
      1111,
      111,
    ])

    const lastFrame = frames.at(-1)
    expect(lastFrame?.stacks?.[0].packets).toEqual([1100, 1111, 111])
  })
})
