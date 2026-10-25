// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { plugins } from '../registry'
import { MainMenu } from './MainMenu'
import { chapterHash, MENU_HASH } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function renderMenu(): void {
  act(() => {
    root.render(<MainMenu plugins={plugins} theme="light" onTheme={() => {}} />)
  })
}

function cardForChapter(chapter: number): HTMLAnchorElement {
  const element = container.querySelector<HTMLAnchorElement>(
    `.chapter-card[href="${chapterHash(chapter)}"]`,
  )
  if (!element) throw new Error(`Aucune carte rendue pour le chapitre ${chapter}`)
  return element
}

beforeEach(() => {
  window.location.hash = MENU_HASH
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  renderMenu()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('menu principal', () => {
  it('affiche le titre et le sous-titre', () => {
    expect(container.textContent).toContain(fr.menu.title)
    expect(container.textContent).toContain(fr.menu.subtitle)
  })

  it('ouvre les crédits depuis la barre et affiche les noms dans l’ordre', () => {
    const trigger = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${fr.credits.title}"]`,
    )
    expect(trigger).not.toBeNull()
    act(() => {
      trigger?.click()
    })
    const credits = container.querySelector('#credits-popover')?.textContent ?? ''
    expect(credits).toContain(fr.credits.title)
    for (const name of fr.credits.names) expect(credits).toContain(name)
    expect(credits.indexOf('El Mahdi Cherkane')).toBeLessThan(credits.indexOf('Omar Moussaid'))
    expect(credits.indexOf('Omar Moussaid')).toBeLessThan(credits.indexOf('Hamza Agoure'))
  })

  it('rend une carte par plugin enregistré, construite depuis le registre', () => {
    const cards = container.querySelectorAll('.chapter-card:not(.is-soon)')
    expect(cards).toHaveLength(plugins.length)

    for (const plugin of plugins) {
      const element = container.querySelector<HTMLAnchorElement>(
        `.chapter-card[href="${chapterHash(plugin.chapter)}"]`,
      )
      expect(element, plugin.id).not.toBeNull()
      expect(element?.textContent).toContain(fr.menu.chapterLabel(plugin.chapter))
      expect(element?.textContent).toContain(plugin.title)
      expect(element?.textContent).toContain(plugin.description)
      expect(element?.textContent).toContain(fr.menu.open)
      expect(element?.getAttribute('aria-label')).toBe(fr.menu.openAria(plugin.title))
    }
  })

  it('classe tous les chapitres dans l’ordre numérique', () => {
    const chapters = [...container.querySelectorAll('.chapter-card')].map((element) => {
      const label = element.querySelector('.chapter-chip')?.textContent ?? ''
      return Number(label.replace(/\D/g, ''))
    })
    const expected = [
      ...plugins.map((plugin) => plugin.chapter),
      ...fr.menu.soonItems.map((item) => item.chapter),
    ].sort((first, second) => first - second)
    expect(chapters).toEqual(expected)
  })

  it('affiche les chapitres à venir comme des cartes désactivées', () => {
    const soon = container.querySelectorAll('.chapter-card.is-soon')
    expect(soon).toHaveLength(fr.menu.soonItems.length)
    const expected = [...fr.menu.soonItems].sort(
      (first, second) => first.chapter - second.chapter,
    )
    expected.forEach((item, index) => {
      const element = soon[index]
      expect(element, item.title).toBeTruthy()
      expect(element?.getAttribute('aria-disabled')).toBe('true')
      expect(element?.getAttribute('aria-label')).toBe(fr.menu.soonAria(item.title))
      expect(element?.textContent).toContain(fr.menu.soon)
      expect(element?.textContent).toContain(fr.menu.chapterLabel(item.chapter))
      expect(element?.textContent).toContain(item.title)
      expect(element?.textContent).toContain(item.description)
    })
  })

  it('ouvre le chapitre 4 au clic sur la carte', () => {
    act(() => {
      cardForChapter(4).click()
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })

  it('ouvre le chapitre au clavier avec Entrée', () => {
    act(() => {
      cardForChapter(4).dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })

  it('ouvre le chapitre au clavier avec Espace', () => {
    act(() => {
      cardForChapter(4).dispatchEvent(
        new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
      )
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })
})
