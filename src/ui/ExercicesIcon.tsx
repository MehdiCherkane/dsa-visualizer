import type { JSX } from 'react'

interface IconProps {
  className?: string
}

export function ExercicesIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3.2 4.4h4.3c1.1 0 2 .9 2 2v9.2c0-1.1-.9-2-2-2H3.2zM16.8 4.4h-4.3c-1.1 0-2 .9-2 2v9.2c0-1.1.9-2 2-2h4.3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m7.1 8.5 1.2 1.2 2.2-2.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ArrowRightIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function HomeIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M3.2 9.2 10 3.4l6.8 5.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 8.5v8h10v-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 16.5v-4.1h3.6v4.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PdfIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <path
        d="M5 2.6h6.2L15 6.4v11H5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M11.1 2.8v3.8H15M7.4 10.5h5.2M7.4 13.5h5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect
        x="4.2"
        y="8.5"
        width="11.6"
        height="8.2"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6.8 8.5V6.7a3.2 3.2 0 0 1 6.4 0v1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12.6" r="1.1" fill="currentColor" />
    </svg>
  )
}

export function ChevronLeftIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="m10 3-5 5 5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronRightIcon({ className = 'button-icon' }: IconProps): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="m6 3 5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
