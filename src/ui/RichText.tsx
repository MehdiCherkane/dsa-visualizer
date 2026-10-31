import type { JSX } from 'react'

/**
 * Exercise statements use backticks for C identifiers and snippets. Rendering
 * them as real inline code keeps the content in the data file and avoids a
 * Markdown dependency in the offline bundle.
 */
export function RichText({ text }: { text: string }): JSX.Element {
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
