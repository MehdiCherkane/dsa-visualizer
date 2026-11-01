// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { exercisePdfHref } from './pdf'
import { EXERCICES_STORAGE_KEY, readExerciseProgress } from './progress'
import { ExerciseSheetPage } from './ExerciseSheetPage'
import { tp3Exercise } from './tp3'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// jsdom does not implement the native <dialog> methods.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
  HTMLElement.prototype.hasPointerCapture = () => true
})

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

function pdfTrigger(): HTMLButtonElement {
  const trigger = container.querySelector<HTMLButtonElement>(
    `button[aria-label="${fr.exercices.openPdfAria(tp3Exercise.title)}"]`,
  )
  expect(trigger).not.toBeNull()
  return trigger as HTMLButtonElement
}

function openPdfDrawer(): { trigger: HTMLButtonElement; dialog: HTMLDialogElement } {
  const trigger = pdfTrigger()
  trigger.focus()
  act(() => {
    trigger.click()
  })
  const dialog = container.querySelector<HTMLDialogElement>('dialog.course-drawer')
  expect(dialog).not.toBeNull()
  return { trigger, dialog: dialog as HTMLDialogElement }
}

function finishClosingAnimation(dialog: HTMLDialogElement): void {
  act(() => {
    dialog.dispatchEvent(new Event('animationend', { bubbles: true }))
  })
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
  it('garde l’accueil mais retire le bouton Menu coloré de l’en-tête', () => {
    expect(container.querySelector('.exercices-header-link')).toBeNull()
    expect(container.querySelector(`button[aria-label="${fr.menu.homeLabel}"]`)).not.toBeNull()
    expect(container.querySelector('.brand-institution-name')).toBeNull()
    expect(container.querySelector('.brand-credit')).toBeNull()
    expect(container.textContent).not.toContain(fr.app.institution)
    expect(container.textContent).not.toContain(fr.app.professor)
  })

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

  it('bascule entre la question et la simulation sur la même page', () => {
    const tabs = Array.from(
      container.querySelectorAll<HTMLButtonElement>('.exercices-view-switch [role="tab"]'),
    )
    expect(tabs).toHaveLength(2)

    const workspace = container.querySelector('.exercices-workspace')
    const simulation = container.querySelector('.exercices-simulation')
    expect(workspace?.hasAttribute('hidden')).toBe(false)
    expect(simulation?.hasAttribute('hidden')).toBe(true)

    act(() => {
      tabs[1].click()
    })
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(workspace?.hasAttribute('hidden')).toBe(true)
    expect(simulation?.hasAttribute('hidden')).toBe(false)
    expect(container.querySelector('.exercices-simulation .app.app-embedded')).not.toBeNull()

    act(() => {
      tabs[0].click()
    })
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(workspace?.hasAttribute('hidden')).toBe(false)
    expect(simulation?.hasAttribute('hidden')).toBe(true)
  })

  it('ouvre la simulation depuis le raccourci en haut de la feuille', () => {
    const shortcut = Array.from(
      container.querySelectorAll<HTMLAnchorElement>('.exercices-sheet-actions a'),
    ).find((link) => link.textContent?.includes(fr.exercices.simulate))
    expect(shortcut).not.toBeUndefined()

    act(() => {
      shortcut?.click()
    })
    expect(container.querySelector('.exercices-simulation')?.hasAttribute('hidden')).toBe(false)
    expect(container.querySelector('.exercices-workspace')?.hasAttribute('hidden')).toBe(true)
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

  it('affiche la simulation de la question courante et la réinitialise au changement', () => {
    const first = tp3Exercise.questions[0].simulation
    expect(first).toBeDefined()
    expect(container.querySelector('.exercices-question-column .exercices-sim')).not.toBeNull()

    const sim = container.querySelector('.exercices-sim')
    expect(sim?.textContent).toContain(first?.title)
    expect(sim?.textContent).toContain(fr.exercices.simulationStep(1, first?.frames.length ?? 0))
    expect(sim?.textContent).toContain(first?.frames[0].title)

    const nextStep = sim?.querySelector<HTMLButtonElement>('.exercices-sim-controls .primary-button')
    act(() => {
      nextStep?.click()
    })
    expect(sim?.textContent).toContain(fr.exercices.simulationStep(2, first?.frames.length ?? 0))
    expect(sim?.textContent).toContain(first?.frames[1].title)

    const stepper = container.querySelectorAll<HTMLButtonElement>('.exercices-stepper button')
    act(() => {
      stepper[1].click()
    })

    const second = tp3Exercise.questions[1].simulation
    const secondSim = container.querySelector('.exercices-sim')
    expect(secondSim?.textContent).toContain(second?.title)
    expect(secondSim?.textContent).toContain(
      fr.exercices.simulationStep(1, second?.frames.length ?? 0),
    )
    expect(secondSim?.textContent).toContain(second?.frames[0].title)
  })

  it('retourne au menu principal avec Échap', () => {
    act(() => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(window.location.hash).toBe('#/')
  })

  it('ouvre le sujet PDF dans le même tiroir latéral que les chapitres', () => {
    expect(pdfTrigger().tagName).toBe('BUTTON')
    expect(container.querySelector('.exercices-sheet-actions a[href$=".pdf"]')).toBeNull()

    const { dialog } = openPdfDrawer()
    const src = exercisePdfHref(tp3Exercise.id)

    expect(dialog.open).toBe(true)
    expect(dialog.getAttribute('aria-label')).toBe(fr.exercices.pdfAria(tp3Exercise.title))
    expect(dialog.querySelector('.course-drawer-title')?.textContent).toContain(
      fr.exercices.pdfTitle,
    )
    expect(dialog.querySelector('.course-drawer-chapter')?.textContent).toBe(tp3Exercise.title)
    expect(dialog.querySelector('.course-drawer-body iframe')?.getAttribute('src')).toBe(src)
    expect(dialog.querySelector('.course-drawer-body iframe')?.getAttribute('title')).toBe(
      fr.exercices.pdfAria(tp3Exercise.title),
    )

    const fallback = dialog.querySelector<HTMLAnchorElement>('.course-drawer-foot a')
    expect(fallback?.getAttribute('href')).toBe(src)
    expect(fallback?.getAttribute('target')).toBe('_blank')
    expect(fallback?.textContent).toContain(fr.pdfViewer.openInTab)
  })

  it('ferme le tiroir avec Échap sans quitter la feuille et rend le focus au bouton', () => {
    const { trigger, dialog } = openPdfDrawer()

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    expect(dialog.classList.contains('is-closing')).toBe(true)

    finishClosingAnimation(dialog)
    expect(container.querySelector('dialog.course-drawer')).toBeNull()
    expect(window.location.hash).toBe('#/exercices')
    expect(document.activeElement).toBe(trigger)
  })

  it('ferme le tiroir avec son bouton Fermer', () => {
    const { dialog } = openPdfDrawer()
    const close = dialog.querySelector<HTMLButtonElement>(
      `button[aria-label="${fr.exercices.pdfCloseAria}"]`,
    )
    expect(close).not.toBeNull()

    act(() => {
      close?.click()
    })
    expect(dialog.classList.contains('is-closing')).toBe(true)
    finishClosingAnimation(dialog)
    expect(container.querySelector('dialog.course-drawer')).toBeNull()
  })

  it('redimensionne le sujet PDF au clavier et garde la largeur à la réouverture', () => {
    const { dialog } = openPdfDrawer()
    const resizer = dialog.querySelector<HTMLElement>('.course-drawer-resizer')
    expect(resizer).not.toBeNull()
    resizer!.focus()

    act(() => {
      resizer!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true }),
      )
    })
    expect(dialog.style.getPropertyValue('--course-width')).toBe('734px')
    expect(resizer!.getAttribute('aria-valuenow')).toBe('734')

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      )
    })
    finishClosingAnimation(dialog)

    expect(openPdfDrawer().dialog.style.getPropertyValue('--course-width')).toBe('734px')
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
