// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'
import App from './App'
import { fr } from './i18n/fr'
import { defaultPlugin } from './registry'

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
    expect(markup).toContain('la liste est vide')
    expect(markup).toContain(fr.viz.emptyInsert)
    expect(markup).toContain(defaultPlugin.id === 'ldc' ? 'Chapitre 4' : 'Chapitre 4')
  })

  it('affiche les paramètres de l’opération par défaut', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain(fr.params.valeur)
  })

  it('ajoute la décoration de fond, invisible pour les lecteurs d’écran', () => {
    const markup = renderToStaticMarkup(<App />)
    expect(markup).toContain('class="site-backdrop"')
    expect(markup).toContain('zl-tile')
  })
})
