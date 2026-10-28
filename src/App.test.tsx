// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import App from './App'
import { fr } from './i18n/fr'
import { defaultPlugin } from './registry'
import { MENU_HASH } from './ui/useHashRoute'

describe('coquille de l’application', () => {
  beforeAll(() => {
    // The home screen is the entry point (#/); the demo lives at #/chapitre-4.
    window.location.hash = '#/chapitre-4'
    // jsdom reports 768px: keep the bottom dock expanded so every panel renders.
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true })
  })

  it('rend la page complète avec les deux profils et tous les panneaux', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain(fr.app.title)
    expect(markup).toContain(fr.profiles.int)
    expect(markup).toContain(fr.profiles.etudiant)
    expect(markup).toContain('supprimerValeur(int valeur)')
    expect(markup).toContain(fr.captionPanel.title)
    expect(markup).toContain(fr.watch.title)
    expect(markup).toContain(fr.console.title)
    expect(markup).toContain(fr.journal.title)
    expect(markup).toContain(fr.operation.execute)
    expect(markup).toContain(fr.scenarios.title)
    expect(markup).toContain('ldc-svg')
    expect(markup).toContain('viz-zellige')
    expect(markup).toContain('site-backdrop-zellige')
    expect(markup).toContain('la liste est vide')
    expect(markup).toContain(fr.viz.emptyInsert)
    expect(markup).toContain(defaultPlugin.id === 'ldc' ? 'Chapitre 4' : 'Chapitre 4')
    expect(markup).toContain('class="app has-footer"')
    expect(markup).toContain('class="site-footer"')
    expect(markup).toContain(fr.footer.email)
    expect(markup).toContain(`href="mailto:${fr.footer.email}"`)
    expect(markup).toContain(fr.footer.credit)
    expect(markup).toContain('site-footer-logo')
    expect(markup).toContain(fr.footer.logoAlt)
    expect(markup).not.toContain('DUT GI S3')
  })

  it('affiche les paramètres de l’opération par défaut', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain(fr.params.valeur)
  })

  it('ouvre le chapitre 1 sur la route #/chapitre-1', () => {
    const previousHash = window.location.hash
    window.location.hash = '#/chapitre-1'

    try {
      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain(fr.chapters.staticStructures.title)
      expect(markup).toContain(fr.profiles.pile)
      expect(markup).toContain(fr.profiles.file1)
      expect(markup).toContain(fr.profiles.file2)
      expect(markup).toContain(fr.profiles.file3)
      expect(markup).toContain('elements[MAX]')
      expect(markup).toContain('Pile vide : sommet = -1.')
    } finally {
      window.location.hash = previousHash
    }
  })

  it('ouvre le chapitre 2 sur les profils linéaire et circulaire', () => {
    const previousHash = window.location.hash
    window.location.hash = '#/chapitre-2'

    try {
      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain(fr.chapters.lsc.title)
      expect(markup).toContain(fr.profiles.structureLabel)
      expect(markup).toContain(fr.profiles.lineaire)
      expect(markup).toContain(fr.profiles.circulaire)
      expect(markup).not.toContain(fr.profiles.etudiant)
      expect(markup).toContain('supprimerValeur(int valeur)')
      expect(markup).toContain(fr.viz.emptyLsc)
    } finally {
      window.location.hash = previousHash
    }
  })

  it('ajoute la décoration de fond au menu principal', () => {
    const previousHash = window.location.hash
    window.location.hash = MENU_HASH

    try {
      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain('class="site-backdrop"')
      expect(markup).toContain('site-backdrop-zellige')
      expect(markup).toContain(fr.menu.title)
      expect(markup).toContain('class="site-footer"')
      expect(markup).toContain(fr.footer.email)
      expect(markup).toContain(`href="mailto:${fr.footer.email}"`)
      expect(markup).toContain(fr.footer.credit)
      expect(markup).toContain('site-footer-logo')
      expect(markup).toContain(fr.footer.logoAlt)
      expect(markup).not.toContain('DUT GI S3')
    } finally {
      window.location.hash = previousHash
    }
  })

  it('ouvre le chapitre 7 sur les opérations ABR', () => {
    const previousHash = window.location.hash
    window.location.hash = '#/chapitre-7'

    try {
      const markup = renderToStaticMarkup(<App />)
      expect(markup).toContain(fr.chapters.abr.title)
      expect(markup).toContain(fr.abr.operations.rechercherABR.label)
      expect(markup).toContain(fr.abr.operations.supprimerABR.label)
      expect(markup).toContain(fr.profiles.etudiant)
      expect(markup).toContain(fr.abr.support.title)
      expect(markup).toContain(fr.abr.support.inorder)
    } finally {
      window.location.hash = previousHash
    }
  })

  it('applique le fond zellige aux sept chapitres', () => {
    const previousHash = window.location.hash

    try {
      for (const chapter of [1, 2, 3, 4, 5, 6, 7]) {
        window.location.hash = `#/chapitre-${chapter}`
        const markup = renderToStaticMarkup(<App />)
        expect(markup).toContain('viz-zellige')
        expect(markup).toContain('viz-zellige-tile')
        expect(markup).toContain('site-backdrop-zellige')
        expect(markup).toContain('--zl-pattern')
      }
    } finally {
      window.location.hash = previousHash
    }
  })
})
