import type { JSX } from 'react'
import presaDark from '../assets/presa/main-dark.jpg'
import presaLight from '../assets/presa/main-light.jpg'
import presaConnection from '../assets/presa/connection.jpg'
import presaIcon from '../assets/presa/presa-icon.svg'
import presaSettings from '../assets/presa/settings.jpg'
import { fr } from '../i18n/fr'
import { ExercicesShell } from '../exercices/ExercicesShell'
import './PresaPage.css'

interface PresaPageProps {
  theme: 'light' | 'dark'
  onTheme: () => void
}

const SCREENSHOTS = [presaLight, presaConnection, presaSettings, presaDark]

function DownloadIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="M10 2.8v8.4M6.6 8l3.4 3.4L13.4 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 13.2v3.2h13.2v-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CodeIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m7 5.5-4.5 4.5L7 14.5M13 5.5l4.5 4.5L13 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ArrowIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ShieldIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3 5 6v5.4c0 4.2 2.8 7.7 7 9.6 4.2-1.9 7-5.4 7-9.6V6l-7-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2.1 2.1L15.4 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FeatureIcon({ index }: { index: number }): JSX.Element {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {index === 0 ? (
        <>
          <rect x="2.5" y="6" width="19" height="12" rx="2.5" {...common} />
          <path d="M6 9.5h.01M9.5 9.5h.01M13 9.5h.01M16.5 9.5h.01M7.5 14h9" {...common} />
        </>
      ) : index === 1 ? (
        <>
          <rect x="4" y="3.5" width="16" height="13" rx="2.5" {...common} />
          <path d="m10 13 4.5 8 1.2-5.3 5.3-1.2L10 13Z" {...common} />
        </>
      ) : index === 2 ? (
        <>
          <rect x="2.5" y="4" width="19" height="13" rx="2" {...common} />
          <path d="M8 21h8M12 17v4M9 11.5l2.5 2L17 8" {...common} />
        </>
      ) : (
        <>
          <path
            d="M12 3.5l1.7 4.3 4.3 1.7-4.3 1.7L12 15.5l-1.7-4.3L6 9.5l4.3-1.7L12 3.5Z"
            {...common}
          />
          <path d="M18.2 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" {...common} />
        </>
      )}
    </svg>
  )
}

/** Presentation page for Presa, reached from the main-menu download button. */
export function PresaPage({ theme, onTheme }: PresaPageProps): JSX.Element {
  const presa = fr.presa
  const featuresTitleId = 'presa-features-title'
  const screenshotsTitleId = 'presa-screenshots-title'
  const stepsTitleId = 'presa-steps-title'
  const compatibilityTitleId = 'presa-compatibility-title'

  return (
    <ExercicesShell
      eyebrow={presa.eyebrow}
      title={presa.headerTitle}
      theme={theme}
      onTheme={onTheme}
      showMenuLink
    >
      <div className="presa-page">
        <section className="presa-hero" aria-labelledby="presa-hero-title">
          <div className="presa-hero-copy">
            <span className="presa-app-icon">
              <img src={presaIcon} alt="" width={58} height={58} />
            </span>
            <p className="presa-hero-eyebrow">{presa.heroKicker}</p>
            <h1 className="presa-hero-title" id="presa-hero-title">
              {presa.heroTitle}
            </h1>
            <p className="presa-hero-lead">{presa.heroLead}</p>
            <p className="presa-hero-note">{presa.heroNote}</p>

            <div className="presa-actions">
              <a
                className="presa-cta presa-cta-primary"
                href={presa.apkUrl}
                target="_blank"
                rel="noreferrer noopener"
                title={presa.apkHint}
                aria-label={presa.apkHint}
              >
                <DownloadIcon />
                <span>{presa.apkCta}</span>
              </a>
              <a
                className="presa-cta presa-cta-ghost"
                href={presa.repoUrl}
                target="_blank"
                rel="noreferrer noopener"
                title={presa.sourceHint}
                aria-label={presa.sourceHint}
              >
                <CodeIcon />
                <span>{presa.sourceCta}</span>
              </a>
            </div>

            <p className="presa-version">{presa.version}</p>
            <ul className="presa-meta" aria-label={presa.metaLabel}>
              {presa.meta.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="presa-hero-art">
            <div className="presa-phone">
              <div className="presa-phone-speaker" aria-hidden="true" />
              <div className="presa-phone-screen">
                <img
                  src={presaLight}
                  alt={presa.heroImageAlt}
                  width={400}
                  height={836}
                />
              </div>
            </div>
            <span className="presa-phone-badge">Android 9+</span>
          </div>
        </section>

        <ul className="presa-stats">
          {presa.stats.map((stat) => (
            <li className="presa-stat" key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </li>
          ))}
        </ul>

        <section className="presa-section" aria-labelledby={featuresTitleId}>
          <header className="presa-section-head">
            <h2 id={featuresTitleId}>{presa.featuresTitle}</h2>
            <p>{presa.featuresLead}</p>
          </header>
          <div className="presa-features">
            {presa.features.map((feature, index) => (
              <article className="presa-feature" key={feature.title}>
                <span className="presa-feature-icon">
                  <FeatureIcon index={index} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="presa-section" aria-labelledby={screenshotsTitleId}>
          <header className="presa-section-head">
            <h2 id={screenshotsTitleId}>{presa.screenshotsTitle}</h2>
            <p>{presa.screenshotsLead}</p>
          </header>
          <div className="presa-shots">
            {presa.screenshots.map((shot, index) => (
              <figure className="presa-shot" key={shot.caption}>
                <img
                  src={SCREENSHOTS[index]}
                  alt={shot.alt}
                  width={400}
                  height={836}
                  loading="lazy"
                />
                <figcaption>
                  <span className="presa-shot-number">{String(index + 1).padStart(2, '0')}</span>
                  {shot.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="presa-section" aria-labelledby={stepsTitleId}>
          <header className="presa-section-head">
            <h2 id={stepsTitleId}>{presa.stepsTitle}</h2>
            <p>{presa.stepsLead}</p>
          </header>
          <ol className="presa-steps">
            {presa.steps.map((step, index) => (
              <li className="presa-step" key={step.title}>
                <span className="presa-step-number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="presa-columns">
          <section className="presa-section presa-compat" aria-labelledby={compatibilityTitleId}>
            <header className="presa-section-head">
              <h2 id={compatibilityTitleId}>{presa.compatibilityTitle}</h2>
              <p>{presa.compatibilityLead}</p>
            </header>
            <ul className="presa-compat-list">
              {presa.compatibility.map((row) => (
                <li key={row.system}>
                  <strong>{row.system}</strong>
                  <span>{row.note}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="presa-privacy" aria-labelledby="presa-privacy-title">
            <span className="presa-privacy-icon">
              <ShieldIcon />
            </span>
            <h2 id="presa-privacy-title">{presa.privacyTitle}</h2>
            <p>{presa.privacyText}</p>
            <a
              className="presa-text-link"
              href={presa.repoUrl}
              target="_blank"
              rel="noreferrer noopener"
            >
              {presa.repoLink}
              <ArrowIcon />
            </a>
          </section>
        </div>

        <section className="presa-credits" aria-labelledby="presa-credits-title">
          <div className="presa-credits-copy">
            <p className="presa-hero-eyebrow">{presa.creditsSchool}</p>
            <h2 id="presa-credits-title">{presa.creditsTitle}</h2>
            <p>{presa.creditsIntro}</p>
            <p className="presa-credits-supervisor">{presa.creditsSupervisor}</p>
          </div>
          <ul className="presa-credits-names">
            {fr.credits.names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </section>

        <section className="presa-final" aria-labelledby="presa-final-title">
          <div>
            <h2 id="presa-final-title">{presa.finalTitle}</h2>
            <p>{presa.finalLead}</p>
          </div>
          <div className="presa-final-actions">
            <a
              className="presa-cta presa-cta-primary"
              href={presa.apkUrl}
              target="_blank"
              rel="noreferrer noopener"
              title={presa.apkHint}
              aria-label={presa.apkHint}
            >
              <DownloadIcon />
              <span>{presa.apkCta}</span>
            </a>
            <span className="presa-final-note">{presa.finalNote}</span>
          </div>
        </section>
      </div>
    </ExercicesShell>
  )
}
