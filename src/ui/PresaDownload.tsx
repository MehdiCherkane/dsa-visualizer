import type { JSX } from 'react'
import { fr } from '../i18n/fr'

const PRESA_REPO_URL = 'https://github.com/HamzaAGOUR/Presa'

/** Link from the main menu to the Presa Android remote repository. */
export function PresaDownload(): JSX.Element {
  return (
    <a
      className="presa-download"
      href={PRESA_REPO_URL}
      target="_blank"
      rel="noreferrer noopener"
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
