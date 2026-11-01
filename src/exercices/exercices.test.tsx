// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { ExercicesPage } from '../ui/ExercicesPage'
import { EXERCICES_HASH } from '../ui/useHashRoute'
import { createEmptyProgress, EXERCICES_STORAGE_KEY, normalizeProgress, readProgress } from './progress'
import { exerciseById, exercises, totalQuestionCount } from './registry'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderPage(exerciseId?: string): void {
  act(() => {
    root.render(
      <ExercicesPage
        exerciseId={exerciseId}
        theme="light"
        onTheme={() => {}}
        onMenu={() => {}}
      />,
    )
  })
}

function query<T extends Element>(selector: string): T | null {
  return container.querySelector<T>(selector)
}

function buttonWithText(text: string): HTMLButtonElement {
  const button = [...container.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.textContent?.trim() === text,
  )
  if (!button) throw new Error(`Bouton introuvable : ${text}`)
  return button
}

function click(button: HTMLButtonElement): void {
  act(() => {
    button.click()
  })
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  })
}

beforeEach(() => {
  window.localStorage.clear()
  window.location.hash = EXERCICES_HASH
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('données des exercices', () => {
  it('contient les fiches des chapitres 1 et 3', () => {
    expect(exercises).toHaveLength(4)
    expect(totalQuestionCount(exercises)).toBe(12)
    expect(exercises.map((exercise) => exercise.chapter)).toEqual([1, 1, 1, 3])
    expect(exerciseById('chapitre-1-fibonacci')?.questions).toHaveLength(2)
    expect(exerciseById('chapitre-1-grands-nombres')?.questions).toHaveLength(4)
    expect(exerciseById('chapitre-3-somme-grands-nombres')?.questions).toHaveLength(5)
  })

  it('respecte le modèle Question / Exercise et garde des identifiants uniques', () => {
    const exerciseIds = new Set<string>()
    const questionIds = new Set<string>()

    for (const exercise of exercises) {
      expect(exerciseIds.has(exercise.id), exercise.id).toBe(false)
      exerciseIds.add(exercise.id)
      expect(exercise.title.trim()).not.toBe('')
      expect(Number.isInteger(exercise.chapter)).toBe(true)
      expect(exercise.questions.length).toBeGreaterThan(0)

      for (const question of exercise.questions) {
        expect(questionIds.has(question.id), question.id).toBe(false)
        questionIds.add(question.id)
        expect(question.title.trim()).not.toBe('')
        expect(question.statement.trim()).not.toBe('')
        expect(question.solutionCode.trim()).not.toBe('')
        if (question.hints) {
          expect(question.hints.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('fournit une simulation pas à pas pour chaque question du TP 3', () => {
    const tp3 = exerciseById('chapitre-3-somme-grands-nombres')
    expect(tp3).toBeDefined()
    if (!tp3) return

    expect(tp3.title).toContain('Somme de deux grands nombres')
    expect(tp3.intro).toContain('ElementPile')
    expect(tp3.questions.map((question) => question.id)).toEqual([
      'primitives-pile',
      'remplir-paquets',
      'somme-paquets',
      'afficher-somme',
      'lire-deux-nombres',
    ])

    for (const question of tp3.questions) {
      const simulation = question.simulation
      expect(simulation, question.id).toBeDefined()
      if (!simulation) continue

      expect(simulation.title.trim()).not.toBe('')
      expect(simulation.intro.trim()).not.toBe('')
      expect(simulation.frames.length).toBeGreaterThan(1)

      for (const frame of simulation.frames) {
        expect(frame.title.trim()).not.toBe('')
        expect(frame.detail.trim()).not.toBe('')
        const hasVisual =
          (frame.stacks?.length ?? 0) > 0 ||
          frame.digits !== undefined ||
          frame.carry !== undefined ||
          frame.output !== undefined ||
          (frame.calls?.length ?? 0) > 0 ||
          (frame.vars?.length ?? 0) > 0
        expect(hasVisual, `${question.id} · ${frame.title}`).toBe(true)
      }
    }
  })

  it('empile les paquets du TP 3 du plus significatif au moins significatif', () => {
    const tp3 = exerciseById('chapitre-3-somme-grands-nombres')
    const lastFrame = tp3?.questions[1]?.simulation?.frames.at(-1)
    expect(lastFrame?.stacks?.[0].packets).toEqual([7890, 3456, 12])

    const sommeFrames = tp3?.questions[2]?.simulation?.frames ?? []
    const transfer = sommeFrames.find((frame) => frame.title.startsWith('Transférer'))
    expect(transfer?.stacks?.find((stack) => stack.label === 'S')?.packets).toEqual([
      1100,
      1111,
      111,
    ])
  })

  it('tolère une progression absente, corrompue ou d’une autre version', () => {
    expect(normalizeProgress(null, exercises)).toEqual(createEmptyProgress())
    expect(normalizeProgress({ current: { inconnu: 4 }, revealed: { inconnu: ['x'] } }, exercises)).toEqual(
      createEmptyProgress(),
    )

    window.localStorage.setItem(EXERCICES_STORAGE_KEY, '{pas du json')
    expect(readProgress(exercises)).toEqual(createEmptyProgress())

    window.localStorage.setItem(
      EXERCICES_STORAGE_KEY,
      JSON.stringify({ version: 99, progress: { current: { 'chapitre-1-fibonacci': 1 } } }),
    )
    expect(readProgress(exercises)).toEqual(createEmptyProgress())
  })
})

describe('page des exercices', () => {
  it('affiche la liste, les compteurs et les deux consignes', () => {
    renderPage()

    expect(container.querySelectorAll('.exercice-card')).toHaveLength(4)
    expect(container.textContent).toContain(fr.exercices.listTitle)
    expect(container.textContent).toContain(fr.exercices.questionCount(12))
    expect(container.querySelector('.exercices-mandatory')?.textContent).toContain(
      fr.exercices.mandatoryBefore,
    )
    expect(container.querySelector('.exercices-mandatory')?.textContent).toContain(
      fr.exercices.mandatoryCompare,
    )
  })

  it('ouvre une fiche depuis la liste', () => {
    renderPage()
    const card = query<HTMLAnchorElement>('.exercice-card')
    expect(card).not.toBeNull()

    act(() => {
      card?.click()
    })

    expect(window.location.hash).toBe('#/exercices/chapitre-1-exercice-1')
  })

  it('affiche « Fiche introuvable » pour un identifiant inconnu', () => {
    renderPage('fiche-inconnue')

    expect(query('.exercise-not-found')?.textContent).toContain(fr.exercices.notFound)
    expect(query('.exercise-not-found a')?.getAttribute('href')).toBe(EXERCICES_HASH)
  })

  it('cache le code par défaut et le révèle uniquement sur demande', () => {
    renderPage('chapitre-1-exercice-1')

    const toggle = buttonWithText(fr.exercices.showSolution)
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(query('.solution-code-body')).toBeNull()
    expect(container.textContent).not.toContain('La chaine \\"%s\\"')

    click(toggle)

    expect(buttonWithText(fr.exercices.hideSolution).getAttribute('aria-expanded')).toBe('true')
    expect(query('.solution-code-body')).not.toBeNull()
    expect(container.textContent).toContain('La chaine \\"%s\\"')
  })

  it('masque de nouveau le code sans le laisser dans le DOM', () => {
    renderPage('chapitre-1-exercice-1')
    click(buttonWithText(fr.exercices.showSolution))
    click(buttonWithText(fr.exercices.hideSolution))

    expect(query('.solution-code-body')).toBeNull()
    expect(buttonWithText(fr.exercices.showSolution).getAttribute('aria-expanded')).toBe('false')
  })

  it('affiche les deux consignes en haut de page et dans la section de code', () => {
    renderPage('chapitre-1-fibonacci')

    const pageNotice = query('.exercices-mandatory')
    const solutionNotice = query('.solution-mandatory')
    expect(pageNotice).not.toBeNull()
    expect(solutionNotice).not.toBeNull()

    for (const notice of [pageNotice, solutionNotice]) {
      expect(notice?.textContent).toContain(fr.exercices.mandatoryBefore)
      expect(notice?.textContent).toContain(fr.exercices.mandatoryCompare)
    }
  })

  it('navigue avec les boutons, le stepper et les flèches du clavier', () => {
    renderPage('chapitre-1-fibonacci')

    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(1, 2),
    )
    expect(query('[aria-live="polite"]')?.textContent).toContain(
      fr.exercices.questionAnnouncement(1, 2, exerciseById('chapitre-1-fibonacci')!.questions[0]!.title),
    )

    click(buttonWithText(fr.exercices.next))
    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(2, 2),
    )
    expect(buttonWithText(fr.exercices.showSolution).getAttribute('aria-expanded')).toBe('false')

    press('ArrowLeft')
    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(1, 2),
    )

    press('ArrowRight')
    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(2, 2),
    )

    const steps = container.querySelectorAll<HTMLButtonElement>('.exercise-step')
    click(steps[0]!)
    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(1, 2),
    )
    expect(steps[0]!.getAttribute('aria-current')).toBe('step')
  })

  it('conserve la question courante et les solutions révélées après un remontage', () => {
    renderPage('chapitre-1-fibonacci')
    click(buttonWithText(fr.exercices.showSolution))
    click(buttonWithText(fr.exercices.next))
    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(2, 2),
    )

    act(() => root.unmount())
    container.innerHTML = ''
    root = createRoot(container)
    renderPage('chapitre-1-fibonacci')

    expect(query('.exercise-question-count')?.textContent).toContain(
      fr.exercices.questionLabel(2, 2),
    )
    expect(buttonWithText(fr.exercices.showSolution).getAttribute('aria-expanded')).toBe('false')

    click(container.querySelectorAll<HTMLButtonElement>('.exercise-step')[0]!)
    expect(buttonWithText(fr.exercices.hideSolution).getAttribute('aria-expanded')).toBe('true')
  })

  it('affiche le TP 3, sa simulation et le lien vers le visualiseur', () => {
    renderPage('chapitre-3-somme-grands-nombres')

    expect(query('.exercise-code-block')?.textContent).toContain('ElementPile')
    expect(query('.exercices-sim-title')?.textContent).toBe(
      exerciseById('chapitre-3-somme-grands-nombres')?.questions[0]?.simulation?.title,
    )
    expect(query('.exercices-sim-counter')?.textContent).toContain(
      fr.exercices.simulationStep(1, 6),
    )

    const visualizer = query<HTMLAnchorElement>('.exercices-simulate-link')
    expect(visualizer?.getAttribute('href')).toBe('#/chapitre-3')

    click(buttonWithText(fr.exercices.simulationNext))
    expect(query('.exercices-sim-counter')?.textContent).toContain(
      fr.exercices.simulationStep(2, 6),
    )

    click(buttonWithText(fr.exercices.next))
    expect(query('.exercices-sim-title')?.textContent).toBe(
      exerciseById('chapitre-3-somme-grands-nombres')?.questions[1]?.simulation?.title,
    )
    expect(query('.exercices-sim-counter')?.textContent).toContain(
      fr.exercices.simulationStep(1, 5),
    )
  })
})
