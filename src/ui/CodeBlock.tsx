import type { JSX } from 'react'
import { tokenizeC } from './tokenizer'

interface CodeBlockProps {
  code: string
  ariaLabel?: string
}

/** Small C code block used by the fenced snippets inside exercise statements. */
export function CodeBlock({ code, ariaLabel }: CodeBlockProps): JSX.Element {
  const lines = code.replace(/\n$/, '').split('\n')

  return (
    <pre className="exercise-code-block" tabIndex={0} aria-label={ariaLabel}>
      <code>
        {lines.map((line, lineIndex) => (
          <span className="exercise-code-line" key={lineIndex}>
            <span className="line-number" aria-hidden="true">
              {lineIndex + 1}
            </span>
            <span className="line-code">
              {line.length === 0
                ? ' '
                : tokenizeC(line).map((token, tokenIndex) => (
                    <span className={`token token-${token.kind}`} key={tokenIndex}>
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
