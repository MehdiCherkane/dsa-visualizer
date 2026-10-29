// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { EXERCICES_STORAGE_KEY, readExerciseProgress } from './progress'
import { ExerciseSheetPage } from './ExerciseSheetPage'
import { tp3Exercise } from './tp3'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderSheet(): void {
  act(() => {
    root.render(<ExerciseSheetPage exercise={tp3Exercise} theme="light" onTheme={() => {}} />)
  })
}

function revealButton(): HTMLButtonElement {
  const button = container.querySelector<HTMLButtonElement>('.exercices-solution-head button')
  expect(button).not.toBeNull()
  return button as HTMLButtonElement
}

beforeEach(() => {
  window.location.hash = '#/exercices'
  window.localStorage.clear()
  Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  renderSheet()
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

describe('feuille d’exercices', () => {
  it('cache la solution par défaut derrière le bouton d’affichage', () => {
    expect(container.textContent).toContain(fr.exercices.callout)
    expect(container.textContent).toContain(fr.exercices.solutionHiddenText)

    const button = revealButton()
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('.exercices-solution-warning')).toBeNull()
    expect(container.querySelector('.exercices-solution .exercices-code')).toBeNull()

    act(() => {
      button.click()
    })
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('.exercices-solution-warning')).not.toBeNull()
    expect(container.querySelector('.exercices-solution .exercices-code')).not.toBeNull()
    expect(container.querySelector('.exercices-solution .exercices-code')?.textContent).toContain('void initialiser')

    act(() => {
      button.click()
    })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.querySelector('.exercices-solution-warning')).toBeNull()
    expect(container.querySelector('.exercices-solution .exercices-code')).toBeNull()
  })

  it('montre le texte obligatoire d’avertissement au-dessus du code', () => {
    const button = revealButton()
    expect(container.textContent).not.toContain(fr.exercices.solutionWarning)

    act(() => {
      button.click()
    })
    expect(container.textContent).toContain(fr.exercices.solutionWarning)
  })

  it('navigue avec le stepper, les boutons, et remet la solution à zéro', () => {
    expect(container.textContent).toContain(fr.exercices.questionProgress(1, 5))

    const stepperButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.exercices-stepper button'),
    )
    expect(stepperButtons).toHaveLength(5)

    act(() => {
      stepperButtons[2].click()
    })
    expect(container.textContent).toContain(fr.exercices.questionProgress(3, 5))
    expect(container.textContent).not.toContain('Écrire les fonctions')

    const reveal = revealButton()
    act(() => {
      reveal.click()
    })
    expect(container.querySelector('.exercices-solution .exercices-code')?.textContent).toContain('void somme')

    const next = container.querySelector<HTMLButtonElement>('.exercices-nav .primary-button')
    const previous = container.querySelector<HTMLButtonElement>('.exercices-nav .secondary-button')
    expect(next).not.toBeNull()
    expect(next?.disabled).toBe(false)
    expect(previous?.disabled).toBe(false)

    act(() => {
      next?.click()
    })
    expect(container.textContent).toContain(fr.exercices.questionProgress(4, 5))
    expect(container.querySelector('.exercices-solution .exercices-code')).toBeNull()

    act(() => {
      previous?.click()
    })
    expect(container.textContent).toContain(fr.exercices.questionProgress(3, 5))
  })

  it('change de question avec le clavier et annonce le changement', () => {
    expect(container.textContent).toContain(fr.exercices.questionProgress(1, 5))

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain(fr.exercices.questionProgress(2, 5))

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      )
    })
    expect(container.textContent).toContain(fr.exercices.questionProgress(1, 5))
  })

  it('retourne au menu principal avec Échap', () => {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(window.location.hash).toBe('#/')
  })

  it('persiste la question courante et les solutions révélées', () => {
    const button = revealButton()
    act(() => {
      button.click()
    })

    expect(JSON.parse(window.localStorage.getItem(EXERCICES_STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      exercises: {
        'tp3-somme-grands-nombres': { question: 0, revealed: ['ex1-q1'] },
      },
    })
    expect(readExerciseProgress(tp3Exercise.id, tp3Exercise.questions)).toEqual({
      question: 0,
      revealed: ['ex1-q1'],
    })

    act(() => {
      root.unmount()
    })

    const remountedContainer = document.createElement('div')
    document.body.append(remountedContainer)
    const remountedRoot = createRoot(remountedContainer)
    act(() => {
      remountedRoot.render(<ExerciseSheetPage exercise={tp3Exercise} theme="light" onTheme={() => {}} />)
    })
    container.remove()

    expect(remountedContainer.querySelector<HTMLButtonElement>('.exercices-solution-head button')?.getAttribute('aria-expanded')).toBe('true')
    act(() => {
      remountedRoot.unmount()
    })
    remountedContainer.remove()
  })
})
