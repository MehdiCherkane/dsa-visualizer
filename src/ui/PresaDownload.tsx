import type { JSX } from 'react'
import { fr } from '../i18n/fr'
import { PRESA_HASH } from './useHashRoute'

/** Menu link to the Presa presentation page. */
export function PresaDownload(): JSX.Element {
  return (
    <a
      className="presa-download"
      href={PRESA_HASH}
      title={fr.presa.downloadHint}
      aria-label={fr.presa.downloadHint}
    >
      <DownloadIcon />
      <span>{fr.presa.download}</span>
    </a>
  )
}

function DownloadIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <path
        d="M10 2.8v8.4M6.6 8l3.4 3.4L13.4 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 13.2v3.2h13.2v-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
