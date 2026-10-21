import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'
import { fr } from './i18n/fr'
import { defaultPlugin } from './registry'

describe('coquille de l’application', () => {
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
})
