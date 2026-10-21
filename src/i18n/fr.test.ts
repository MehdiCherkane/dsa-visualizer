import { describe, expect, it } from 'vitest'
import { fr } from './fr'

const samples: unknown[] = [1, '0x1A40', true, { numero: 101, nom: 'AAA', prenom: 'aaa' }]

describe('légendes françaises', () => {
  it('garde les délimiteurs de code équilibrés dans toutes les légendes', () => {
    for (const [name, value] of Object.entries(fr.captions)) {
      const text =
        typeof value === 'function'
          ? Reflect.apply(value as (...args: unknown[]) => string, undefined, samples.slice(0, value.length))
          : value
      const delimiters = (text.match(/`/g) ?? []).length
      expect(delimiters % 2, name).toBe(0)
    }
  })
})
