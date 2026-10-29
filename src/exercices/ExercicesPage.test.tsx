// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getExercices } from './index'
import { fr } from '../i18n/fr'
import { exerciseHash } from '../ui/useHashRoute'
import { ExercicesPage } from './ExercicesPage'
import { tp3Exercise } from './tp3'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderPage(): void {
  act(() => {
    root.render(<ExercicesPage exercises={[tp3Exercise]} theme="light" onTheme={() => {}} />)
  })
}

beforeEach(() => {
  window.location.hash = '#/'
  window.localStorage.clear()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  renderPage()
})

afterEach(() => {
  act(() => {
    root.unmount()
  })
  container.remove()
})

describe('page des exercices', () => {
  it('affiche l’appel à la résolution et le compteur du TP', () => {
    expect(container.textContent).toContain(fr.exercices.title)
    expect(container.textContent).toContain(fr.exercices.callout)
    expect(container.textContent).toContain(fr.exercices.questionCount(5))
  })

  it('rend une carte par exercice enregistré et ouvre la feuille', () => {
    expect(container.querySelectorAll('.exercise-card')).toHaveLength(getExercices().length)

    const card = container.querySelector<HTMLAnchorElement>('.exercise-card')
    expect(card?.getAttribute('href')).toBe(exerciseHash(tp3Exercise.id))

    act(() => {
      card?.click()
    })
    expect(window.location.hash).toBe(exerciseHash(tp3Exercise.id))
  })
})
