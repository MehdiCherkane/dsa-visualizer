import { describe, expect, it } from 'vitest'
import html from '../../index.html?raw'

function readPhoneDetector(): (width: number, height: number) => boolean {
  const match = html.match(
    /function isPhoneScreen\(width, height\) \{\s*return Math\.min\(width, height\) < 600\s*\}/,
  )
  if (!match) throw new Error('isPhoneScreen introuvable dans index.html')
  return new Function(`${match[0]}; return isPhoneScreen`)() as (
    width: number,
    height: number,
  ) => boolean
}

function readPresaRoute(): (hash: string) => boolean {
  const match = html.match(/function isPresaRoute\(hash\) \{\s*return ([^\n]+)\n\s*\}/)
  if (!match) throw new Error('isPresaRoute introuvable dans index.html')
  return new Function('hash', `return ${match[1].trim()}`) as (hash: string) => boolean
}

const isPhoneScreen = readPhoneDetector()
const isPresaRoute = readPresaRoute()

const cases = [
  { label: 'iPhone SE portrait', width: 375, height: 667, phone: true },
  { label: 'iPhone 14 Pro Max portrait', width: 430, height: 932, phone: true },
  { label: 'iPhone 14 Pro Max paysage', width: 932, height: 430, phone: true },
  { label: 'Pixel 7', width: 412, height: 915, phone: true },
  { label: 'Galaxy Z Fold replié', width: 280, height: 653, phone: true },
  { label: 'juste sous le seuil', width: 599, height: 960, phone: true },
  { label: 'seuil exact', width: 600, height: 960, phone: false },
  { label: 'iPad Mini', width: 744, height: 1133, phone: false },
  { label: 'iPad Air', width: 820, height: 1180, phone: false },
  { label: 'iPad Pro 11', width: 834, height: 1194, phone: false },
  { label: 'iPad Pro 12,9', width: 1024, height: 1366, phone: false },
  { label: 'ordinateur 1366×768', width: 1366, height: 768, phone: false },
  { label: 'ordinateur 1920×1080', width: 1920, height: 1080, phone: false },
]

describe('détection téléphone', () => {
  it.each(cases)('$label : $width×$height → $phone', ({ width, height, phone }) => {
    expect(isPhoneScreen(width, height)).toBe(phone)
  })

  it('laisse la page Presa accessible depuis un téléphone', () => {
    expect(isPresaRoute('#/presa')).toBe(true)
    expect(isPresaRoute('#/presa/')).toBe(true)
    expect(isPresaRoute('#/')).toBe(false)
    expect(isPresaRoute('#/chapitre-4')).toBe(false)
    expect(isPresaRoute('#/exercices/tp3-somme-grands-nombres')).toBe(false)
  })

  it('propose un lien vers la présentation Presa depuis l’avis téléphone', () => {
    expect(html).toContain(
      '<a id="phone-notice-presa" class="phone-notice-presa" href="#/presa">',
    )
    expect(html).toContain('Découvrir Presa')
  })
})
