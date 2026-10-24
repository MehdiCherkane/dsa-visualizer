import type { JSX, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { BaseSnapshot, Step } from '../core/types'
import { fr } from '../i18n/fr'

type AvatarKind = 'neutral' | 'pointer' | 'condition' | 'malloc' | 'free'

function avatarKind<S extends BaseSnapshot>(step: Step<S>): AvatarKind {
  if (step.caption === fr.captions.idle) return 'neutral'
  if (step.changes.some((change) => change.kind === 'free')) return 'free'
  if (step.caption.includes('malloc') || step.changes.some((change) => change.kind === 'create')) {
    return 'malloc'
  }
  if (step.cond || step.badge) return 'condition'
  if (
    step.changes.some(
      (change) =>
        change.kind === 'pointer' ||
        change.kind === 'variable' ||
        change.kind === 'layout' ||
        change.kind === 'cell' ||
        change.kind === 'remove',
    )
  ) {
    return 'pointer'
  }
  return 'neutral'
}

function chipKind(text: string): string {
  if (text === 'suivant') return 'code-suivant'
  if (text === 'precedent') return 'code-precedent'
  if (text === 'debut') return 'code-debut'
  if (text === 'sommet') return 'code-sommet'
  if (text === 'fin') return 'code-fin'
  if (text === 'courant') return 'code-courant'
  if (text === 'nouveau') return 'code-nouveau'
  if (text === 'ancienDebut' || text === 'ancienSommet' || text === 'ancienPremier') {
    return 'code-ancien'
  }
  if (text === 'NULL') return 'code-null'
  if (/^0x[0-9A-Fa-f]+$/.test(text)) return 'code-address'
  if (/^\d+$/.test(text)) return 'code-number'
  return 'code-ident'
}

function renderChip(text: string): ReactNode {
  const parts = text.split(/([A-Za-z_][A-Za-z0-9_]*|0x[0-9A-Fa-f]+|\d+)/g)
  return parts.map((part, index) =>
    part.length === 0 ? null : /^(?:[A-Za-z_]|0x|\d)/.test(part) ? (
      <span key={`${part}-${index}`} className={`caption-token ${chipKind(part)}`}>
        {part}
      </span>
    ) : (
      <span key={`${part}-${index}`} className="caption-token caption-token-punct">
        {part}
      </span>
    ),
  )
}

function renderPlain(text: string): ReactNode {
  return text.split(/(nœud\s+\d+)/gi).map((part, index) =>
    /^nœud\s+\d+$/i.test(part) ? <strong key={`${part}-${index}`}>{part}</strong> : part,
  )
}

function renderCaption(caption: string): ReactNode {
  return caption.split(/(`[^`]*`)/g).map((part, index) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      const text = part.slice(1, -1)
      return (
        <code key={`chip-${index}`} className="caption-chip">
          {renderChip(text)}
        </code>
      )
    }
    return <span key={`text-${index}`}>{renderPlain(part)}</span>
  })
}

interface CaptionPanelProps<S extends BaseSnapshot> {
  step: Step<S>
  previewCall?: string
  previewComplexity?: string
}

export function CaptionPanel<S extends BaseSnapshot>({
  step,
  previewCall,
  previewComplexity,
}: CaptionPanelProps<S>): JSX.Element {
  const textRef = useRef<HTMLParagraphElement | null>(null)
  const [dense, setDense] = useState(false)
  const kind = avatarKind(step)
  const idle = step.caption === fr.captions.idle
  const preview = idle && previewCall ? previewCall : undefined

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = textRef.current
      if (!element) return
      const wasDense = element.classList.contains('caption-dense')
      if (wasDense) element.classList.remove('caption-dense')
      const overflow = element.scrollHeight > element.clientHeight + 1
      if (wasDense) element.classList.add('caption-dense')
      setDense(overflow)
    })
    return () => cancelAnimationFrame(frame)
  }, [step.caption, step.fn, preview])

  return (
    <div className="caption-band" aria-live="polite" aria-label={fr.captionPanel.title}>
      <span className={`caption-avatar avatar-${kind}`} aria-hidden="true">
        <AvatarIcon kind={kind} />
      </span>
      <div className="caption-main">
        <p ref={textRef} className={dense ? 'caption-text caption-dense' : 'caption-text'}>
          {preview ? (
            <span className="caption-preview">
              <code className="caption-chip">{renderChip(preview)}</code>
              {previewComplexity ? (
                <span className="caption-preview-note"> {previewComplexity}</span>
              ) : null}
            </span>
          ) : (
            renderCaption(step.caption)
          )}
        </p>
        {step.evals && step.evals.length > 0 ? (
          <div className="caption-resolved" aria-label={fr.watch.evals}>
            {step.evals.slice(0, 4).map((entry, index) => (
              <code key={`${entry.expr}-${index}`} className="caption-resolved-chip">
                {entry.expr} = {entry.value}
              </code>
            ))}
          </div>
        ) : null}
      </div>
      <div className="caption-end">
        {step.badge === 'cas-particulier' ? (
          <span className="badge badge-gold">{fr.captionPanel.badgeParticular}</span>
        ) : null}
        {step.badge === 'debut-modifie' ? (
          <span className="badge badge-gold">{fr.captionPanel.badgeDebut}</span>
        ) : null}
        {step.cond ? (
          <span className={step.cond.result ? 'badge badge-success' : 'badge badge-alert'}>
            {step.cond.result ? fr.common.true : fr.common.false}
          </span>
        ) : null}
      </div>
    </div>
  )
}

function AvatarIcon({ kind }: { kind: AvatarKind }): JSX.Element {
  if (kind === 'pointer') {
    return (
      <svg viewBox="0 0 20 20">
        <path d="M4 10h11M11.5 6.5 15 10l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  if (kind === 'condition') {
    return (
      <svg viewBox="0 0 20 20">
        <path d="M10 3.5 16.5 10 10 16.5 3.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M10 7.2v3.4M10 13.2v.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'malloc') {
    return (
      <svg viewBox="0 0 20 20">
        <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'free') {
    return (
      <svg viewBox="0 0 20 20">
        <path d="m5.5 5.5 9 9M14.5 5.5l-9 9" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20">
      <path d="m7 4.5 8 5.5-8 5.5Z" fill="currentColor" />
    </svg>
  )
}
