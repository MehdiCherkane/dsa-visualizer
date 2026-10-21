import type { BaseSnapshot, Step } from './types'

export interface PlayerState {
  index: number
  total: number
  playing: boolean
  speed: number
}

const BASE_INTERVAL_MS = 1500
const SPEEDS = [0.5, 1, 2, 4] as const

export class Player<S extends BaseSnapshot> {
  private _steps: Step<S>[] = []
  private _index = 0
  private _playing = false
  private _speed = 1
  private timer: ReturnType<typeof setTimeout> | null = null
  private listeners = new Set<() => void>()

  get steps(): Step<S>[] {
    return this._steps
  }

  get state(): PlayerState {
    return {
      index: this._index,
      total: this._steps.length,
      playing: this._playing,
      speed: this._speed,
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }

  load(steps: Step<S>[]): void {
    this.stopTimer()
    this._steps = steps
    this._index = 0
    this._playing = false
    this.notify()
  }

  clear(): void {
    this.load([])
  }

  play(): void {
    if (this._steps.length === 0) return
    if (this._index >= this._steps.length - 1) return
    this._playing = true
    this.notify()
    this.schedule()
  }

  pause(): void {
    this._playing = false
    this.stopTimer()
    this.notify()
  }

  toggle(): void {
    if (this._playing) this.pause()
    else this.play()
  }

  next(): void {
    if (this._index < this._steps.length - 1) {
      this._index += 1
      this.notify()
      if (this._index >= this._steps.length - 1) {
        this.pause()
      }
    }
  }

  prev(): void {
    if (this._index > 0) {
      this._index -= 1
      this.notify()
    }
  }

  goto(index: number): void {
    if (this._steps.length === 0) return
    const clamped = Math.max(0, Math.min(this._steps.length - 1, index))
    if (clamped === this._index) return
    this._index = clamped
    if (clamped >= this._steps.length - 1 && this._playing) {
      this._playing = false
      this.stopTimer()
    }
    this.notify()
  }

  first(): void {
    this.goto(0)
  }

  last(): void {
    this.goto(this._steps.length - 1)
  }

  setSpeed(speed: number): void {
    if (!SPEEDS.includes(speed as (typeof SPEEDS)[number])) return
    this._speed = speed
    this.notify()
    if (this._playing) {
      this.stopTimer()
      this.schedule()
    }
  }

  faster(): void {
    const index = SPEEDS.indexOf(this._speed as (typeof SPEEDS)[number])
    if (index >= 0 && index < SPEEDS.length - 1) {
      this.setSpeed(SPEEDS[index + 1])
    }
  }

  slower(): void {
    const index = SPEEDS.indexOf(this._speed as (typeof SPEEDS)[number])
    if (index > 0) this.setSpeed(SPEEDS[index - 1])
  }

  destroy(): void {
    this.stopTimer()
    this.listeners.clear()
  }

  private schedule(): void {
    this.stopTimer()
    this.timer = setTimeout(() => {
      this.timer = null
      if (!this._playing) return
      if (this._index >= this._steps.length - 1) {
        this._playing = false
        this.notify()
        return
      }
      this._index += 1
      this.notify()
      if (this._index >= this._steps.length - 1) {
        this._playing = false
        this.notify()
        return
      }
      this.schedule()
    }, BASE_INTERVAL_MS / this._speed)
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}
