import { describe, expect, it } from 'vitest'
import { wheelIntent } from './wheelGestures'

function wheel(overrides: Partial<WheelEvent> = {}): WheelEvent {
  return {
    deltaMode: 0,
    deltaX: 0,
    deltaY: 0,
    ctrlKey: false,
    ...overrides,
  } as WheelEvent
}

describe('intentions de la molette et du pavé tactile', () => {
  it('déplace la caméra avec un défilement à deux doigts', () => {
    expect(wheelIntent(wheel({ deltaX: 12, deltaY: -8 }), 600)).toEqual({
      kind: 'pan',
      dx: 12,
      dy: -8,
    })
  })

  it('déplace la caméra avec un petit défilement vertical', () => {
    expect(wheelIntent(wheel({ deltaY: 24 }), 600)).toEqual({
      kind: 'pan',
      dx: 0,
      dy: 24,
    })
  })

  it('reconnaît les deltas fractionnaires du pavé tactile', () => {
    expect(wheelIntent(wheel({ deltaY: 60.5 }), 600)).toEqual({
      kind: 'pan',
      dx: 0,
      dy: 60.5,
    })
  })

  it('garde le zoom pour une grande roue de souris', () => {
    const intent = wheelIntent(wheel({ deltaY: 100 }), 600)
    expect(intent.kind).toBe('zoom')
    if (intent.kind === 'zoom') expect(intent.factor).toBeCloseTo(Math.exp(-0.15), 6)
  })

  it('zoome vers l’avant avec une roue de souris vers le haut', () => {
    const intent = wheelIntent(wheel({ deltaY: -100 }), 600)
    expect(intent.kind).toBe('zoom')
    if (intent.kind === 'zoom') expect(intent.factor).toBeGreaterThan(1)
  })

  it('traite Ctrl+molette (pincement) comme un zoom', () => {
    const intent = wheelIntent(wheel({ deltaY: -10, ctrlKey: true }), 600)
    expect(intent.kind).toBe('zoom')
    if (intent.kind === 'zoom') {
      expect(intent.factor).toBeCloseTo(Math.exp(10 * 0.0035), 6)
    }
  })

  it('normalise les événements en lignes comme une roue de souris', () => {
    const intent = wheelIntent(wheel({ deltaMode: 1, deltaY: 3 }), 600)
    expect(intent.kind).toBe('zoom')
    if (intent.kind === 'zoom') {
      expect(intent.factor).toBeCloseTo(Math.exp(-3 * 16 * 0.0015), 6)
    }
  })

  it('normalise les événements en pages avec la hauteur de la scène', () => {
    const intent = wheelIntent(wheel({ deltaMode: 2, deltaY: 1 }), 600)
    expect(intent.kind).toBe('zoom')
    if (intent.kind === 'zoom') expect(intent.factor).toBeCloseTo(Math.exp(-0.9), 6)
  })
})
