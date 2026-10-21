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

function card(): HTMLAnchorElement {
  const element = container.querySelector<HTMLAnchorElement>('.chapter-card:not(.is-soon)')
  if (!element) throw new Error('Aucune carte de chapitre rendue')
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

  it('affiche les chapitres à venir comme des cartes désactivées', () => {
    const soon = container.querySelectorAll('.chapter-card.is-soon')
    expect(soon).toHaveLength(fr.menu.soonItems.length)
    for (const element of soon) {
      expect(element.getAttribute('aria-disabled')).toBe('true')
      expect(element.textContent).toContain(fr.menu.soon)
    }
  })

  it('ouvre le chapitre 4 au clic sur la carte', () => {
    act(() => {
      card().click()
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })

  it('ouvre le chapitre au clavier avec Entrée', () => {
    act(() => {
      card().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })

  it('ouvre le chapitre au clavier avec Espace', () => {
    act(() => {
      card().dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
    })
    expect(window.location.hash).toBe('#/chapitre-4')
  })
})
