import type { JSX } from 'react'
import type { PlayerState } from '../core/player'
import { fr } from '../i18n/fr'

const SPEEDS = [0.5, 1, 2, 4]

interface ControlsProps {
  state: PlayerState
  onFirst: () => void
  onPrev: () => void
  onToggle: () => void
  onNext: () => void
  onLast: () => void
  onGoto: (index: number) => void
  onSpeed: (speed: number) => void
  fullscreen: boolean
  onFullscreen: () => void
}

export function Controls({
  state,
  onFirst,
  onPrev,
  onToggle,
  onNext,
  onLast,
  onGoto,
  onSpeed,
  fullscreen,
  onFullscreen,
}: ControlsProps): JSX.Element {
  const empty = state.total === 0
  const atStart = empty || state.index <= 0
  const atEnd = empty || state.index >= state.total - 1

  return (
    <section className="controls">
      <div className="transport">
        <button
          type="button"
          className="icon-button"
          onClick={onFirst}
          disabled={atStart}
          title={fr.controls.first}
          aria-label={fr.controls.first}
        >
          ⏮
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onPrev}
          disabled={atStart}
          title={fr.controls.prev}
          aria-label={fr.controls.prev}
        >
          ◀
        </button>
        <button
          type="button"
          className="icon-button play-button"
          onClick={onToggle}
          disabled={empty || atEnd}
          title={state.playing ? fr.controls.pause : fr.controls.play}
          aria-label={state.playing ? fr.controls.pause : fr.controls.play}
        >
          {state.playing ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onNext}
          disabled={atEnd}
          title={fr.controls.next}
          aria-label={fr.controls.next}
        >
          ▶
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={onLast}
          disabled={atEnd}
          title={fr.controls.last}
          aria-label={fr.controls.last}
        >
          ⏭
        </button>
      </div>

      <div className="step-slider">
        <input
          type="range"
          min={0}
          max={Math.max(0, state.total - 1)}
          value={state.index}
          onChange={(event) => onGoto(Number(event.target.value))}
          disabled={empty}
          aria-label={fr.controls.slider}
        />
        <span className={empty ? 'step-counter ready' : 'step-counter'}>
          {empty ? fr.controls.ready : `${fr.controls.step} ${state.index + 1} / ${state.total}`}
        </span>
      </div>

      <div className="speeds" aria-label={fr.controls.speed}>
        <span className="speed-label">{fr.controls.speed}</span>
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            type="button"
            className={state.speed === speed ? 'speed-button active' : 'speed-button'}
            onClick={() => onSpeed(speed)}
          >
            {speed}×
          </button>
        ))}
      </div>

      <button
        type="button"
        className="icon-button fullscreen-toggle"
        onClick={onFullscreen}
        title={`${fullscreen ? fr.controls.exitFullscreen : fr.controls.fullscreen} (${fr.controls.fullscreenShortcut})`}
        aria-label={fullscreen ? fr.controls.exitFullscreen : fr.controls.fullscreen}
        aria-pressed={fullscreen}
      >
        {fullscreen ? '⤡' : '⤢'}
      </button>
    </section>
  )
}
