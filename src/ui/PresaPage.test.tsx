// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { fr } from '../i18n/fr'
import { PresaPage } from './PresaPage'
import { MENU_HASH } from './useHashRoute'

function renderPage(): HTMLElement {
  const host = document.createElement('div')
  host.innerHTML = renderToStaticMarkup(<PresaPage theme="light" onTheme={() => {}} />)
  return host
}

describe('page Presa', () => {
  it('présente l’application et ses deux appels à l’action', () => {
    const page = renderPage()
    const text = page.textContent ?? ''

    expect(page.querySelector('.presa-hero-title')?.textContent).toBe(fr.presa.heroTitle)
    expect(text).toContain(fr.presa.heroLead)
    expect(text).toContain(fr.presa.heroNote)
    for (const item of fr.presa.meta) expect(text).toContain(item)

    const apk = page.querySelector<HTMLAnchorElement>(`a[href="${fr.presa.apkUrl}"]`)
    expect(apk).not.toBeNull()
    expect(apk?.getAttribute('target')).toBe('_blank')
    expect(apk?.getAttribute('rel')).toContain('noopener')
    expect(apk?.textContent).toContain(fr.presa.apkCta)

    const repo = page.querySelector<HTMLAnchorElement>(`a[href="${fr.presa.repoUrl}"]`)
    expect(repo).not.toBeNull()
    expect(repo?.getAttribute('target')).toBe('_blank')
  })

  it('affiche les fonctionnalités, les captures et les trois étapes', () => {
    const page = renderPage()
    const text = page.textContent ?? ''

    for (const feature of fr.presa.features) {
      expect(text).toContain(feature.title)
      expect(text).toContain(feature.text)
    }

    const shots = [...page.querySelectorAll<HTMLImageElement>('.presa-shot img')]
    expect(shots).toHaveLength(fr.presa.screenshots.length)
    fr.presa.screenshots.forEach((shot, index) => {
      expect(shots[index].getAttribute('alt')).toBe(shot.alt)
      expect(text).toContain(shot.caption)
    })

    for (const step of fr.presa.steps) {
      expect(text).toContain(step.title)
      expect(text).toContain(step.text)
    }
  })

  it('affiche la compatibilité, la confidentialité et les crédits', () => {
    const page = renderPage()
    const text = page.textContent ?? ''

    for (const row of fr.presa.compatibility) {
      expect(text).toContain(row.system)
      expect(text).toContain(row.note)
    }
    expect(text).toContain(fr.presa.privacyTitle)
    expect(text).toContain(fr.presa.privacyText)

    expect(text).toContain(fr.presa.creditsTitle)
    expect(text).toContain(fr.presa.creditsSupervisor)
    for (const name of fr.credits.names) expect(text).toContain(name)
  })

  it('revient au menu depuis l’en-tête', () => {
    const page = renderPage()
    expect(page.querySelector('.brand-institution-name')).toBeNull()
    expect(page.querySelector('.brand-credit')).toBeNull()
    const back = page.querySelector<HTMLAnchorElement>(
      `.exercices-header-link[href="${MENU_HASH}"]`,
    )
    expect(back).not.toBeNull()
    expect(back?.textContent).toContain(fr.exercices.backMenu)
  })
})
