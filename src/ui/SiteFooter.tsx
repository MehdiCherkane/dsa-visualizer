import type { JSX } from 'react'
import estbmLogo from '../assets/estbm-logo.svg'
import { config } from '../config'
import { fr } from '../i18n/fr'
import './SiteFooter.css'

/** Shared footer for the menu and every chapter page. */
export function SiteFooter(): JSX.Element {
  const email = fr.footer.email
  return (
    <footer className="site-footer">
      <span className="site-footer-brand">
        <img
          className="site-footer-logo"
          src={estbmLogo}
          alt={fr.footer.logoAlt}
          width={26}
          height={26}
        />
        <span className="site-footer-credit">
          {config.institution}
          <span className="site-footer-source"> · {config.source}</span>
        </span>
      </span>
      <span className="site-footer-contact">
        {fr.footer.contact} :{' '}
        <a href={`mailto:${email}`} aria-label={fr.footer.emailAria(email)}>
          {email}
        </a>
      </span>
      <span className="site-footer-authors">{fr.footer.credit}</span>
    </footer>
  )
}
