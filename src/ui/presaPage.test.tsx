// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { PresaPage } from './PresaPage'
import { MENU_HASH } from './useHashRoute'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  act(() => {
    root.render(<PresaPage theme="light" onTheme={() => {}} />)
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('page Presa', () => {
  it('présente l’application et ses points forts', () => {
    expect(container.textContent).toContain(fr.presa.tagline)
    expect(container.textContent).toContain(fr.presa.lead)
    expect(container.textContent).toContain(fr.presa.featuresTitle)

    const features = container.querySelectorAll('.presa-feature')
    expect(features).toHaveLength(fr.presa.features.length)
    for (const feature of fr.presa.features) {
      expect(container.textContent).toContain(feature.title)
      expect(container.textContent).toContain(feature.body)
    }
  })

  it('renvoie vers le dépôt GitHub dans un nouvel onglet', () => {
    const cta = container.querySelector<HTMLAnchorElement>('.presa-cta')
    expect(cta).not.toBeNull()
    expect(cta?.getAttribute('href')).toBe('https://github.com/HamzaAGOUR/Presa')
    expect(cta?.getAttribute('target')).toBe('_blank')
    expect(cta?.getAttribute('rel')).toContain('noopener')
    expect(cta?.textContent).toContain(fr.presa.repo)
  })

  it('permet de revenir au menu', () => {
    const back = container.querySelector<HTMLAnchorElement>('.presa-back')
    expect(back?.getAttribute('href')).toBe(MENU_HASH)
    expect(back?.textContent).toContain(fr.presa.back)
  })

  it('affiche l’icône avec un texte alternatif', () => {
    const icon = container.querySelector<HTMLImageElement>('.presa-art-icon')
    expect(icon).not.toBeNull()
    expect(icon?.getAttribute('alt')).toBe(fr.presa.iconAlt)
  })
})
