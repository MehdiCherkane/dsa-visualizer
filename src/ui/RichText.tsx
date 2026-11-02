import type { JSX, ReactNode } from 'react'
import { CodeBlock } from './CodeBlock'

interface RichTextProps {
  text: string
  className?: string
  /** Render paragraphs and fenced code blocks instead of a single inline run. */
  block?: boolean
}

function InlineText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (part.length > 1 && part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={`${index}-${part}`} className="inline-code">
              {part.slice(1, -1)}
            </code>
          )
        }
        return <span key={`${index}-${part.slice(0, 12)}`}>{part}</span>
      })}
    </>
  )
}

function Paragraphs({ text }: { text: string }): JSX.Element {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index}>
          <InlineText text={paragraph} />
        </p>
      ))}
    </>
  )
}

/**
 * Exercise statements use backticks for C identifiers and snippets, and fenced
 * ```c blocks for longer examples. Rendering them directly keeps the content in
 * the data file and avoids a Markdown dependency in the offline bundle.
 */
export function RichText({ text, className, block = false }: RichTextProps): JSX.Element {
  if (!block && !text.includes('```')) {
    return <InlineText text={text} />
  }

  const blocks = text.split('```')
  const children: ReactNode[] = []

  blocks.forEach((part, index) => {
    if (index % 2 === 1) {
      const code = part.replace(/^[A-Za-z0-9-]*\n/, '').replace(/\n$/, '')
      children.push(<CodeBlock code={code} key={`code-${index}`} />)
      return
    }

    const trimmed = part.trim()
    if (trimmed) children.push(<Paragraphs text={trimmed} key={`text-${index}`} />)
  })

  return <div className={className}>{children}</div>
}
