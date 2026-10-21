import type { JSX } from 'react'

export function BrandMark(): JSX.Element {
  return (
    <svg viewBox="0 0 36 36" className="brand-mark-svg" aria-hidden="true">
      <circle cx="11" cy="12.5" r="3.1" fill="currentColor" />
      <circle cx="25" cy="23.5" r="3.1" fill="currentColor" />
      <path
        d="M14.2 12.5h7.2M21.8 23.5h-7.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="m19.2 10.1 3.3 2.4-3.3 2.4M16.8 21.1l-3.3 2.4 3.3 2.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 17.5c2.7 0 2.7 5 5.3 5M28 18.5c-2.7 0-2.7-5-5.3-5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity=".55" />
    </svg>
  )
}
