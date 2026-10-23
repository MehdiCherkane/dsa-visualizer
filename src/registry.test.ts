import { describe, expect, it } from 'vitest'
import { defaultPlugin, pluginForChapter, plugins } from './registry'

describe('registre des chapitres', () => {
  it('expose les chapitres 2 à 6', () => {
    expect(plugins.map((plugin) => plugin.chapter)).toEqual([2, 3, 4, 5, 6])
    expect(plugins.map((plugin) => plugin.id)).toEqual(['lsc', 'piles-files', 'ldc', 'lddc', 'trees'])
    expect(defaultPlugin.chapter).toBe(4)
  })

  it('résout chaque chapitre et refuse les chapitres non implémentés', () => {
    expect(pluginForChapter(2)?.id).toBe('lsc')
    expect(pluginForChapter(3)?.id).toBe('piles-files')
    expect(pluginForChapter(4)?.id).toBe('ldc')
    expect(pluginForChapter(5)?.id).toBe('lddc')
    expect(pluginForChapter(6)?.id).toBe('trees')
    expect(pluginForChapter(1)).toBeUndefined()
  })

  it('chaque plugin possède au moins un profil et une visualisation', () => {
    for (const plugin of plugins) {
      expect(plugin.profiles.length).toBeGreaterThan(0)
      expect(typeof plugin.Visualization).toBe('function')
      expect(plugin.title.trim().length).toBeGreaterThan(0)
      expect(plugin.description.trim().length).toBeGreaterThan(0)
    }
  })
})
