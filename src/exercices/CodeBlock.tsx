import type { JSX } from 'react'
import { tokenizeC } from '../ui/tokenizer'

interface CodeBlockProps {
  code: string
  ariaLabel?: string
  numbered?: boolean
}

/** C code block reusing the visualizer tokenizer and code colours. */
export function CodeBlock({ code, ariaLabel, numbered = true }: CodeBlockProps): JSX.Element {
  const lines = code.replace(/\n$/, '').split('\n')

  return (
    <pre className="exercices-code" tabIndex={0} aria-label={ariaLabel}>
      <code>
        {lines.map((line, lineIndex) => (
          <span className="exercices-code-line" key={lineIndex}>
            {numbered ? (
              <span className="exercices-code-number" aria-hidden="true">
                {lineIndex + 1}
              </span>
            ) : null}
            <span className="exercices-code-text">
              {line.length === 0
                ? ' '
                : tokenizeC(line).map((token, tokenIndex) => (
                    <span className={`token-${token.kind}`} key={tokenIndex}>
                      {token.text}
                    </span>
                  ))}
            </span>
          </span>
        ))}
      </code>
    </pre>
  )
}
