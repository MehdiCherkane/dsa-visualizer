import type { JSX } from 'react'
import { useCallback, useState } from 'react'
import { fr } from '../i18n/fr'
import type { QuestionSimulation, SimulationDigits, SimulationStack } from './types'

interface QuestionSimulationProps {
  simulation: QuestionSimulation
  questionId: string
  questionTitle: string
}

/** Small, data-driven trace that walks through the logic of one question. */
export function QuestionSimulationView({
  simulation,
  questionId,
  questionTitle,
}: QuestionSimulationProps): JSX.Element | null {
  const frames = simulation.frames
  const [index, setIndex] = useState(0)
  const safeIndex = Math.min(index, frames.length - 1)
  const frame = frames[safeIndex]

  const goTo = useCallback(
    (next: number): void => {
      if (next < 0 || next >= frames.length) return
      setIndex(next)
    },
    [frames.length],
  )

  if (!frame) return null

  const isFirst = safeIndex === 0
  const isLast = safeIndex === frames.length - 1

  return (
    <section className="exercices-sim" aria-labelledby={`exercices-sim-title-${questionId}`}>
      <header className="exercices-sim-head">
        <div className="exercices-sim-head-copy">
          <span className="exercices-sim-kicker">{fr.exercices.simulationKicker}</span>
          <h3 className="exercices-sim-title" id={`exercices-sim-title-${questionId}`}>
            {simulation.title}
          </h3>
          <p className="exercices-sim-intro">{fr.exercices.simulationFor(questionTitle)}</p>
        </div>
        <span className="exercices-sim-counter">
          {fr.exercices.simulationStep(safeIndex + 1, frames.length)}
        </span>
      </header>

      <div className="exercices-sim-board">
        {frame.digits ? <DigitsView digits={frame.digits} /> : null}
        {frame.stacks && frame.stacks.length > 0 ? <StacksView stacks={frame.stacks} /> : null}
        {frame.carry !== undefined || frame.vars ? (
          <div className="exercices-sim-facts">
            {frame.carry !== undefined ? (
              <span className={`exercices-sim-carry${frame.carry > 0 ? ' active' : ''}`}>
                {fr.exercices.simulationCarry}{' '}
                <strong>{frame.carry}</strong>
              </span>
            ) : null}
            {frame.vars?.map((variable) => (
              <span className="exercices-sim-var" key={variable.name}>
                <span>{variable.name}</span>
                <strong>{variable.value}</strong>
              </span>
            ))}
          </div>
        ) : null}
        {frame.calls && frame.calls.length > 0 ? <CallsView calls={frame.calls} /> : null}
        {frame.output !== undefined ? <OutputView output={frame.output} /> : null}
        {frame.detail ? <p className="exercices-sim-detail">{frame.detail}</p> : null}
      </div>

      <div className="exercices-sim-step" aria-live="polite" aria-atomic="true">
        <span className="exercices-sim-step-title">{frame.title}</span>
      </div>

      <div className="exercices-sim-controls">
        <button
          type="button"
          className="ghost-button small"
          onClick={() => goTo(0)}
          disabled={isFirst}
        >
          {fr.exercices.simulationReset}
        </button>
        <button
          type="button"
          className="ghost-button small"
          onClick={() => goTo(safeIndex - 1)}
          disabled={isFirst}
        >
          {fr.exercices.simulationPrevious}
        </button>
        <button
          type="button"
          className="primary-button small"
          onClick={() => goTo(safeIndex + 1)}
          disabled={isLast}
        >
          {fr.exercices.simulationNext}
        </button>
        <div className="exercices-sim-dots" role="group" aria-label={fr.exercices.simulationDotsLabel}>
          {frames.map((item, frameIndex) => (
            <button
              type="button"
              key={`${item.title}-${frameIndex}`}
              className={`exercices-sim-dot${frameIndex === safeIndex ? ' active' : ''}`}
              onClick={() => goTo(frameIndex)}
              aria-label={fr.exercices.simulationJump(frameIndex + 1, frames.length, item.title)}
              aria-current={frameIndex === safeIndex ? 'step' : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function StacksView({ stacks }: { stacks: SimulationStack[] }): JSX.Element {
  return (
    <div className="exercices-sim-stacks">
      {stacks.map((stack) => (
        <div className="exercices-sim-stack" key={stack.label}>
          <div className="exercices-sim-stack-head">
            <span className="exercices-sim-stack-label">{stack.label}</span>
            <span className="exercices-sim-stack-count">
              {fr.exercices.simulationPacketCount(stack.packets.length)}
            </span>
          </div>
          <div className="exercices-sim-nodes">
            {stack.packets.length === 0 ? (
              <span className="exercices-sim-null">NULL</span>
            ) : (
              stack.packets.map((packet, packetIndex) => (
                <div
                  className={`exercices-sim-node${packetIndex === 0 ? ' is-top' : ''}${
                    packetIndex === stack.packets.length - 1 && stack.packets.length > 1
                      ? ' is-bottom'
                      : ''
                  }`}
                  key={`${stack.label}-${packetIndex}-${packet}`}
                >
                  <code>{packet}</code>
                  <span className="exercices-sim-node-tag">
                    {packetIndex === 0
                      ? fr.exercices.simulationTop
                      : packetIndex === stack.packets.length - 1
                        ? fr.exercices.simulationBottom
                        : ''}
                  </span>
                </div>
              ))
            )}
          </div>
          {stack.hint ? <p className="exercices-sim-stack-hint">{stack.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

function DigitsView({ digits }: { digits: SimulationDigits }): JSX.Element {
  return (
    <div className="exercices-sim-digits">
      <div className="exercices-sim-digits-head">
        <span className="exercices-sim-stack-label">{digits.label}</span>
        {digits.hint ? <span className="exercices-sim-digits-hint">{digits.hint}</span> : null}
      </div>
      <div className="exercices-sim-groups">
        {digits.groups.map((group, groupIndex) => (
          <span
            className={`exercices-sim-group${groupIndex === digits.active ? ' active' : ''}`}
            key={`${group}-${groupIndex}`}
          >
            {group}
          </span>
        ))}
      </div>
    </div>
  )
}

function CallsView({ calls }: { calls: string[] }): JSX.Element {
  return (
    <div className="exercices-sim-calls">
      <span className="exercices-sim-stack-label">{fr.exercices.simulationCalls}</span>
      <ol>
        {calls.map((call, callIndex) => (
          <li
            className={callIndex === calls.length - 1 ? 'active' : ''}
            key={`${callIndex}-${call}`}
          >
            {call}
          </li>
        ))}
      </ol>
    </div>
  )
}

function OutputView({ output }: { output: string }): JSX.Element {
  return (
    <div className="exercices-sim-output">
      <span className="exercices-sim-stack-label">{fr.exercices.simulationOutput}</span>
      <pre>{output.length > 0 ? output : '—'}</pre>
    </div>
  )
}
