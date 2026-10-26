import type { JSX } from 'react'
import { config } from '../config'
import { fr } from '../i18n/fr'
import './SiteFooter.css'

/** Shared footer for the menu and every chapter page. */
export function SiteFooter(): JSX.Element {
  const email = fr.footer.email
  return (
    <footer className="site-footer">
      <span className="site-footer-credit">
        {config.institution}
        <span className="site-footer-source"> · {config.source}</span>
      </span>
      <span className="site-footer-contact">
        {fr.footer.contact} :{' '}
        <a href={`mailto:${email}`} aria-label={fr.footer.emailAria(email)}>
          {email}
        </a>
      </span>
    </footer>
  )
}
