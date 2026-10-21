import { afterEach, describe, expect, it, vi } from 'vitest'
import { Player } from './player'
import { intOperations } from '../structures/ldc/operations'
import { createSnapshot } from '../structures/ldc/memory'

function makeSteps() {
  const operation = intOperations.find((candidate) => candidate.id === 'supprimerValeur')!
  return operation.run(
    createSnapshot('int', [
      { kind: 'int', value: 9 },
      { kind: 'int', value: 2 },
      { kind: 'int', value: 5 },
    ]),
    { valeur: 2 },
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('Player', () => {
  it('charge, avance, recule et borne les indices', () => {
    const player = new Player()
    player.load(makeSteps())
    expect(player.state.index).toBe(0)
    expect(player.state.total).toBeGreaterThan(1)
    player.prev()
    expect(player.state.index).toBe(0)
    player.next()
    expect(player.state.index).toBe(1)
    player.goto(999)
    expect(player.state.index).toBe(player.state.total - 1)
    player.next()
    expect(player.state.index).toBe(player.state.total - 1)
    player.first()
    expect(player.state.index).toBe(0)
  })

  it('ne dépasse jamais la fin pendant la lecture automatique', () => {
    vi.useFakeTimers()
    const player = new Player()
    const steps = makeSteps()
    player.load(steps)
    player.play()
    vi.advanceTimersByTime(1500 * steps.length * 2)
    expect(player.state.index).toBe(steps.length - 1)
    expect(player.state.playing).toBe(false)
    player.play()
    expect(player.state.playing).toBe(false)
  })

  it('respecte la vitesse et se met en pause', () => {
    vi.useFakeTimers()
    const player = new Player()
    const steps = makeSteps()
    player.load(steps)
    player.setSpeed(4)
    player.play()
    vi.advanceTimersByTime(375)
    expect(player.state.index).toBe(1)
    player.pause()
    expect(player.state.playing).toBe(false)
    vi.advanceTimersByTime(3000)
    expect(player.state.index).toBe(1)
  })
})
