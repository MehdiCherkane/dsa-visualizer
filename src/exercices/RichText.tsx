import type { JSX, ReactNode } from 'react'
import { CodeBlock } from './CodeBlock'

interface RichTextProps {
  text: string
  className?: string
}

function InlineText({ text }: { text: string }): JSX.Element {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, index) =>
        part.startsWith('`') && part.endsWith('`') ? (
          <code key={index}>{part.slice(1, -1)}</code>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
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
 * Renders the small Markdown subset used by the exercise content: paragraphs,
 * inline code between backticks and fenced ```c blocks.
 */
export function RichText({ text, className }: RichTextProps): JSX.Element {
  const blocks = text.split('```')
  const children: ReactNode[] = []

  blocks.forEach((block, index) => {
    if (index % 2 === 1) {
      const code = block.replace(/^[A-Za-z0-9-]*\n/, '').replace(/\n$/, '')
      children.push(<CodeBlock code={code} key={`code-${index}`} numbered={false} />)
      return
    }

    const trimmed = block.trim()
    if (trimmed) children.push(<Paragraphs text={trimmed} key={`text-${index}`} />)
  })

  return <div className={className}>{children}</div>
}
