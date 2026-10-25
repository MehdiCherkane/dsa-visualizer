import type { JSX } from 'react'
import type { SupportingPanelsProps } from '../../core/types'
import { fr } from '../../i18n/fr'
import { deriveCircular } from './memory'
import type { ArraySnapshot } from './memory'

const S = fr.staticStructures.support

function activeKind(
  snapshot: ArraySnapshot,
  step: SupportingPanelsProps<ArraySnapshot>['step'],
): 'enfiler' | 'defiler' | null {
  const formula = (snapshot.circular ?? deriveCircular(snapshot)).formula
  if (formula) return formula.kind
  const fn = step.fn ?? ''
  if (/defiler|guichet/i.test(fn)) return 'defiler'
  if (/enfiler|arrivee|recuperer/i.test(fn)) return 'enfiler'
  return null
}

function Marker({
  kind,
  index,
}: {
  kind: 'av' | 'ar' | 'both'
  index: number
}): JSX.Element {
  if (kind === 'both') {
    return (
      <span className="ss-memory-marker is-both">
        <span className="ss-memory-marker-half is-av">av</span>
        <span className="ss-memory-marker-half is-ar">ar</span>
      </span>
    )
  }
  return (
    <span className={`ss-memory-marker is-${kind === 'av' ? 'av' : 'ar'}`}>
      {kind} = {index}
    </span>
  )
}

export function StaticStructuresSupport({
  snapshot,
  step,
}: SupportingPanelsProps<ArraySnapshot>): JSX.Element | null {
  if (snapshot.profile !== 'file-circulaire') return null
  const circular = snapshot.circular ?? deriveCircular(snapshot)
  const { max, taille, av, ar } = circular
  const empty = taille === 0
  const full = taille === max
  const one = taille === 1
  const formula = circular.formula
  const kind = activeKind(snapshot, step)
  const target = (ar + 1) % max
  const targetSlot = circular.elements[target]
  const targetLive = circular.order.includes(target)
  const targetStale = targetSlot?.state === 'stale'
  const dequeueTarget = (av + 1) % max
  const changed = new Set(
    step.changes.flatMap((change) =>
      change.kind === 'cell' ? [change.index] : [],
    ),
  )

  const wrapApplied = formula?.wrapped === true && formula.applied
  const wrapUpcoming =
    !wrapApplied && !empty && (circular.ar === max - 1 || formula?.wrapped === true)

  let caption: string
  if (empty) caption = S.memoryEmpty(max)
  else if (one) caption = S.memoryOne(av)
  else if (wrapApplied && formula) caption = S.memoryApplied(formula.from, max)
  else if (full) caption = S.memoryFull(ar)
  else if (wrapUpcoming) caption = S.memoryUpcoming(ar)
  else caption = S.memoryLinear(av, ar, max - 1)

  return (
    <div className="ss-support">
      <section
        className="panel ss-support-card ss-calc-card"
        aria-labelledby="ss-calc-title"
      >
        <header className="ss-support-head">
          <h2 id="ss-calc-title">{S.indicesTitle}</h2>
          <span>{S.capacity(max)}</span>
        </header>
        <div className="ss-calc-rows">
          <div className={`ss-calc-row${kind === 'enfiler' ? ' is-active' : ''}`}>
            <span className="ss-calc-op">{S.enqueue}</span>
            <div className="ss-calc-body">
              <code className="ss-calc-template">{S.enqueueTemplate}</code>
              <div className="ss-calc-eval">
                <span>{`(${ar} + 1) % ${max} =`}</span>
                <span className="ss-calc-result">{target}</span>
                {targetLive ? (
                  <span className="ss-calc-warning">{S.occupied(target)}</span>
                ) : targetStale ? (
                  <span className="ss-calc-note">{S.staleTarget(target)}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={`ss-calc-row${kind === 'defiler' ? ' is-active' : ''}`}>
            <span className="ss-calc-op">{S.dequeue}</span>
            <div className="ss-calc-body">
              <code className="ss-calc-template">{S.dequeueTemplate}</code>
              <div className="ss-calc-eval">
                <span>{`(${av} + 1) % ${max} =`}</span>
                <span className="ss-calc-result">{dequeueTarget}</span>
                {empty ? <span className="ss-calc-note">{S.emptyQueue}</span> : null}
              </div>
            </div>
          </div>

          <div
            className={`ss-calc-row${kind === null && full ? ' is-active' : ''}${full ? ' is-full' : ''}`}
          >
            <span className="ss-calc-op">{S.fullQuestion}</span>
            <div className="ss-calc-body">
              <code className="ss-calc-template">{S.fullTemplate}</code>
              <div className="ss-calc-eval">
                <span>{`${taille} == ${max}`}</span>
                <span className={`ss-calc-verdict ${full ? 'is-yes' : 'is-no'}`}>
                  {full ? S.yes : S.no}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="panel ss-support-card ss-memory-card"
        aria-labelledby="ss-memory-title"
      >
        <header className="ss-support-head">
          <h2 id="ss-memory-title">{S.memoryTitle}</h2>
          <span>{S.capacity(max)}</span>
        </header>

        <div
          className="ss-memory-grid"
          style={{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }}
          role="list"
          aria-label={S.memoryAria}
        >
          {circular.elements.map((slot) => {
            const head = !empty && slot.index === av
            const tail = !empty && slot.index === ar
            const marker = one
              ? 'both'
              : head
                ? 'av'
                : tail
                  ? 'ar'
                  : null
            const roles = one ? 'tête et queue' : head ? 'tête' : tail ? 'queue' : ''
            const classes = [
              'ss-memory-column',
              slot.state === 'used' ? 'is-used' : '',
              slot.state === 'stale' ? 'is-stale' : '',
              slot.state === 'free' ? 'is-free' : '',
              head ? 'is-head' : '',
              tail ? 'is-tail' : '',
              one ? 'is-one' : '',
              changed.has(slot.index) ? 'is-recent' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <div
                key={`memory-${slot.index}`}
                className={classes}
                role="listitem"
                aria-label={S.memoryCell(slot.index, slot.state, slot.value, roles)}
              >
                <span className="ss-memory-marker-track" aria-hidden="true">
                  {marker ? <Marker kind={marker} index={slot.index} /> : null}
                </span>
                <span className="ss-memory-cell" aria-hidden="true">
                  {slot.state === 'free' ? (
                    <span className="ss-memory-free">{fr.staticStructures.viz.free}</span>
                  ) : (
                    <span className="ss-memory-value">{slot.value}</span>
                  )}
                </span>
                <span className="ss-memory-index" aria-hidden="true">
                  {slot.index}
                </span>
              </div>
            )
          })}
        </div>

        <div
          className={`ss-memory-wrap${wrapApplied ? ' is-applied' : wrapUpcoming ? ' is-upcoming' : ' is-muted'}`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 100 18" preserveAspectRatio="none">
            <path d="M 97 3 C 97 16 3 16 3 7" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="ss-memory-wrap-arrow">←</span>
          <span className="ss-memory-wrap-label">{S.wrap}</span>
        </div>
        <p className="ss-memory-caption">{caption}</p>
      </section>
    </div>
  )
}
