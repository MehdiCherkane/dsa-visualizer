import type { CSSProperties, JSX } from 'react'
import type { BaseSnapshot, ScenarioDef, StructurePlugin } from '../core/types'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { ScenariosMenu } from './ScenariosMenu'
import { Shortcuts } from './Shortcuts'

interface HeaderProps<S extends BaseSnapshot> {
  plugin: StructurePlugin<S>
  profileId: string
  onProfile: (profileId: string) => void
  theme: 'light' | 'dark'
  onTheme: () => void
  presentation: boolean
  onPresentation: () => void
  scenarios: ScenarioDef<S>[]
  currentScenarioId?: string
  onLoadScenario: (scenario: ScenarioDef<S>) => void
}

export function Header<S extends BaseSnapshot>({
  plugin,
  profileId,
  onProfile,
  theme,
  onTheme,
  presentation,
  onPresentation,
  scenarios,
  currentScenarioId,
  onLoadScenario,
}: HeaderProps<S>): JSX.Element {
  const activeProfileIndex = Math.max(
    0,
    plugin.profiles.findIndex((profile) => profile.id === profileId),
  )
  const profileCount = Math.max(1, plugin.profiles.length)
  const profileStyle = {
    '--profile-count': profileCount,
  } as CSSProperties

  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <BrandMark />
        </span>
        <div className="brand-copy">
          <div className="brand-meta">
            <span className="chapter-chip">{config.chapter}</span>
            <span className="brand-course">{config.course}</span>
            <span className="brand-sep brand-course-sep" aria-hidden="true">
              ·
            </span>
            <span className="brand-school">{config.school}</span>
            <span className="brand-sep brand-institution-sep" aria-hidden="true">
              ·
            </span>
            <span className="brand-institution-name">{config.institutionName}</span>
          </div>
          <div className="brand-title-row">
            <h1>{config.title}</h1>
            <span className="brand-rule" aria-hidden="true" />
            <span className="brand-credit">
              <span className="credit-prefix">{config.creditPrefix} </span>
              <span className="credit-name">{config.professor}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="header-context">
          <div className="profile-switch" aria-label={fr.profiles.label}>
            <span className="profile-label">{fr.profiles.label}</span>
            <div className="profile-options" style={profileStyle}>
              <span
                className="profile-thumb"
                style={{
                  width: `${100 / profileCount}%`,
                  transform: `translateX(${activeProfileIndex * 100}%)`,
                }}
                aria-hidden="true"
              />
              {plugin.profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={profile.id === profileId ? 'profile-button active' : 'profile-button'}
                  onClick={() => onProfile(profile.id)}
                  title={fr.profiles.switchHint}
                  aria-pressed={profile.id === profileId}
                >
                  {profile.label}
                </button>
              ))}
            </div>
          </div>
          <ScenariosMenu
            scenarios={scenarios}
            currentId={currentScenarioId}
            onLoad={onLoadScenario}
          />
        </div>
        <span className="header-divider" aria-hidden="true" />
        <button
          type="button"
          className={presentation ? 'secondary-button presentation-button active' : 'secondary-button presentation-button'}
          onClick={onPresentation}
          title={presentation ? fr.header.presentationOn : fr.header.presentationOff}
          aria-pressed={presentation}
        >
          <ProjectorIcon />
          <span className="presentation-label">
            {presentation ? fr.header.presentationOn : fr.header.presentationOff}
          </span>
          <span className="keycap">P</span>
        </button>
        <span className="header-divider" aria-hidden="true" />
        <button
          type="button"
          className="header-icon-button"
          onClick={onTheme}
          title={theme === 'light' ? fr.header.themeDark : fr.header.themeLight}
          aria-label={theme === 'light' ? fr.header.themeDark : fr.header.themeLight}
        >
          <ThemeIcon theme={theme} />
        </button>
        <Shortcuts />
      </div>
    </header>
  )
}

function BrandMark(): JSX.Element {
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

function ProjectorIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <rect x="2.5" y="5" width="12.5" height="8" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12.5" cy="9" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 17h8M6.5 13v4M13.5 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 7.5h1.5M17 11.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity=".65" />
    </svg>
  )
}

function ThemeIcon({ theme }: { theme: 'light' | 'dark' }): JSX.Element {
  if (theme === 'light') {
    return (
      <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
        <path
          d="M15.7 12.3A6.2 6.2 0 0 1 7.7 4.3a6.3 6.3 0 1 0 8 8Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 20 20" className="button-icon" aria-hidden="true">
      <circle cx="10" cy="10" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.5v1.6M10 15.9v1.6M2.5 10h1.6M15.9 10h1.6M4.7 4.7l1.1 1.1M14.2 14.2l1.1 1.1M15.3 4.7l-1.1 1.1M5.8 14.2l-1.1 1.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
