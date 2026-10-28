import type { JSX } from 'react'

/** One icon per chapter, in the visual language of the course cards. */
function glyph(chapter: number): JSX.Element {
  switch (chapter) {
    case 1:
      return (
        <g>
          <rect x="2.5" y="11" width="5.5" height="10" rx="1.5" />
          <rect x="9.8" y="11" width="5.5" height="10" rx="1.5" />
          <rect x="17.1" y="11" width="5.5" height="10" rx="1.5" />
          <rect
            x="24.4"
            y="11"
            width="5.5"
            height="10"
            rx="1.5"
            className="chapter-card-glyph-accent"
          />
        </g>
      )
    case 2:
      return (
        <g>
          <rect x="2" y="12" width="7" height="8" rx="1.5" />
          <rect x="12.5" y="12" width="7" height="8" rx="1.5" />
          <rect x="23" y="12" width="7" height="8" rx="1.5" />
          <path d="M9 16h3.5M19.5 16H23" />
        </g>
      )
    case 3:
      return (
        <g>
          <rect x="4" y="5" width="24" height="6" rx="2" className="chapter-card-glyph-accent" />
          <rect x="4" y="13" width="24" height="6" rx="2" />
          <rect x="4" y="21" width="24" height="6" rx="2" />
        </g>
      )
    case 4:
      return (
        <g>
          <rect x="2" y="11" width="8" height="10" rx="1.5" />
          <rect x="22" y="11" width="8" height="10" rx="1.5" />
          <path d="M10 14h12M19 11l3 3-3 3" />
          <path d="M22 19H10M13 16l-3 3 3 3" className="chapter-card-glyph-accent" />
        </g>
      )
    case 5:
      return (
        <g>
          <circle cx="16" cy="16" r="9" />
          <circle cx="16" cy="7" r="2.6" className="chapter-card-glyph-accent" />
          <circle cx="25" cy="16" r="2.6" className="chapter-card-glyph-solid" />
          <circle cx="16" cy="25" r="2.6" className="chapter-card-glyph-solid" />
          <circle cx="7" cy="16" r="2.6" className="chapter-card-glyph-solid" />
        </g>
      )
    case 6:
      return (
        <g>
          <path d="M16 9L8 14M16 9l8 5M8 19l-4 4M8 19l4 4M24 19l4 4" />
          <circle cx="16" cy="6" r="3.2" className="chapter-card-glyph-accent" />
          <circle cx="8" cy="16.5" r="3.2" />
          <circle cx="24" cy="16.5" r="3.2" />
          <circle cx="4" cy="26" r="2.4" />
          <circle cx="12" cy="26" r="2.4" />
          <circle cx="28" cy="26" r="2.4" />
        </g>
      )
    case 7:
      return (
        <g>
          <path d="M11 8L6 14M11 8l5 6" />
          <circle cx="11" cy="5.5" r="3" />
          <circle cx="6" cy="16" r="3" />
          <circle cx="16" cy="16" r="3" />
          <circle cx="23" cy="23" r="5" className="chapter-card-glyph-stroke" />
          <path d="M27 27l3 3" className="chapter-card-glyph-stroke" />
        </g>
      )
    default:
      return <circle cx="16" cy="16" r="9" />
  }
}

export function ChapterIcon({ chapter }: { chapter: number }): JSX.Element {
  return (
    <span className="chapter-card-icon" aria-hidden="true">
      <svg className="chapter-card-star" viewBox="0 0 72 72" focusable="false">
        <g className="chapter-card-star-shape">
          <rect x="13" y="13" width="46" height="46" rx="5" />
          <rect x="13" y="13" width="46" height="46" rx="5" transform="rotate(45 36 36)" />
        </g>
      </svg>
      <svg className="chapter-card-glyph" viewBox="0 0 32 32" focusable="false">
        {glyph(chapter)}
      </svg>
    </span>
  )
}
