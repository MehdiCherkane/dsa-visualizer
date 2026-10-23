import type { JSX } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { BaseSnapshot, CodeSource, ProfileDef, Step } from '../core/types'
import { fr } from '../i18n/fr'
import { tokenizeC } from './tokenizer'

interface CodePanelProps<S extends BaseSnapshot> {
  profile: ProfileDef<S>
  step: Step<S>
  presentation?: boolean
  hideBreadcrumb?: boolean
  secondaryLine?: { fn: string; line: number } | null
}

const measureSample = 'MMMMMMMMMMMMMMMMMMMM'

function functionSignature(source: CodeSource): string {
  const declaration = source.lines.find((line) => line.includes('(')) ?? source.fn
  return declaration
    .replace(
      /^\s*(?:(?:void|int|float|double|char|long|short|unsigned|signed)\s+|(?:struct\s+)?[A-Za-z_][A-Za-z0-9_]*\s*\*+\s*)/,
      '',
    )
    .replace(/\s*\{\s*$/, '')
    .trim()
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    return
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

export function CodePanel<S extends BaseSnapshot>({
  profile,
  step,
  presentation = false,
  hideBreadcrumb = false,
  secondaryLine = null,
}: CodePanelProps<S>): JSX.Element {
  const [showTypes, setShowTypes] = useState(false)
  const [copied, setCopied] = useState(false)
  const activeLine = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const measureRef = useRef<HTMLSpanElement | null>(null)
  const [fitSize, setFitSize] = useState<number | null>(null)

  const stack = step.snapshot.frames.map((frame) => frame.fn)
  if (step.fn && stack[stack.length - 1] !== step.fn) stack.push(step.fn)
  const source = showTypes ? profile.typesCode : (profile.code[step.fn] ?? profile.typesCode)
  const idle = step.caption === fr.captions.idle
  const signature = showTypes ? fr.code.types : functionSignature(source)
  const breadcrumb = stack.filter(Boolean).join(' › ')

  const handleCopy = (): void => {
    void copyText(source.lines.join('\n')).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    })
  }

  useEffect(() => {
    setShowTypes(false)
  }, [step.fn, profile.id])

  useEffect(() => {
    activeLine.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [step.fn, step.line, showTypes, fitSize])

  useLayoutEffect(() => {
    if (!presentation) return
    const element = bodyRef.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const compute = (): void => {
      const height = element.clientHeight
      const width = element.clientWidth
      if (height <= 0 || width <= 0) return
      const measure = measureRef.current
      const charEm = measure
        ? measure.getBoundingClientRect().width / measureSample.length / 100
        : 0.62
      const lineNumber = element.querySelector<HTMLElement>('.line-number')
      const gutter = lineNumber ? lineNumber.getBoundingClientRect().width : 34
      const lineCount = Math.max(source.lines.length, 10)
      const maxLen = source.lines.reduce((max, line) => Math.max(max, line.length), 1)
      const availableWidth = Math.max(1, width - gutter - 18)
      const byHeight = (height - 10) / lineCount / 1.55
      const byWidth = availableWidth / (charEm * (maxLen + 0.5))
      const size = Math.floor(Math.min(26, Math.max(14, Math.min(byHeight, byWidth))))
      setFitSize((current) => (current === size ? current : size))
    }
    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(element)
    return () => observer.disconnect()
  }, [presentation, source, step.fn, showTypes])

  return (
    <section className="panel code-panel">
      <div className="panel-header code-header">
        <div className="code-heading">
          <span className="code-lang-badge" aria-hidden="true">
            C
          </span>
          <code className="code-signature">{signature}</code>
          {!hideBreadcrumb && stack.length > 1 ? (
            <span className="code-breadcrumb" title={fr.code.breadcrumb}>
              {breadcrumb}
            </span>
          ) : null}
        </div>
        <div className="code-actions">
          <button type="button" className="ghost-button small code-copy" onClick={handleCopy}>
            {copied ? fr.code.copied : fr.code.copy}
          </button>
          <button
            type="button"
            className="ghost-button small"
            onClick={() => setShowTypes((value) => !value)}
          >
            {showTypes ? fr.code.showFunction : fr.code.showTypes}
          </button>
        </div>
      </div>
      <div className="code-body" ref={bodyRef}>
        <span className="code-measure" ref={measureRef} aria-hidden="true">
          {measureSample}
        </span>
        {source.lines.map((line, index) => {
          const isActive = !idle && !showTypes && source.fn === step.fn && index === step.line
          const isSecondary =
            !isActive &&
            !idle &&
            !showTypes &&
            secondaryLine?.fn === source.fn &&
            secondaryLine.line === index
          return (
            <div
              key={`${source.fn}-${index}`}
              ref={isActive ? activeLine : undefined}
              className={isActive ? 'code-line active' : isSecondary ? 'code-line secondary-active' : 'code-line'}
              style={presentation && fitSize !== null ? { fontSize: `${fitSize}px` } : undefined}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className="line-number">{index + 1}</span>
              <code className="line-code">
                {tokenizeC(line).map((token, tokenIndex) => (
                  <span key={`${index}-${tokenIndex}`} className={`token token-${token.kind}`}>
                    {token.text}
                  </span>
                ))}
              </code>
            </div>
          )
        })}
      </div>
    </section>
  )
}
