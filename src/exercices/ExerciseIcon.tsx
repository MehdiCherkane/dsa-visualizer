import type { JSX } from 'react'

/** Small checklist icon shared by the menu, the header and the exercise pages. */
export function ExerciseIcon({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className ? `exercise-icon ${className}` : 'exercise-icon'}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M10 5.5h10.5l5 5v16H10z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M20.2 5.8v5h5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m13.2 18.1 2.4 2.5 5-5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.2 24h8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
