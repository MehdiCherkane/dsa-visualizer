import type { CSSProperties, JSX } from 'react'
import type { BaseSnapshot, ScenarioDef, StructurePlugin } from '../core/types'
import { config } from '../config'
import { fr } from '../i18n/fr'
import { BrandMark } from './BrandMark'
import { ScenariosMenu } from './ScenariosMenu'
import { Shortcuts } from './Shortcuts'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps<S extends BaseSnapshot> {
  plugin: StructurePlugin<S>
  profileId: string
  onProfile: (profileId: string) => void
  theme: 'light' | 'dark'
  onTheme: () => void
  onMenu: () => void
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
  onMenu,
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
            <span className="chapter-chip">{fr.menu.chapterLabel(plugin.chapter)}</span>
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
            <h1>{plugin.title}</h1>
            <span className="brand-rule" aria-hidden="true" />
            <span className="brand-credit">
              <span className="credit-prefix">{config.creditPrefix} </span>
              <span className="credit-name">{config.professor}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="secondary-button menu-button"
          onClick={onMenu}
          title={fr.menu.backAria}
          aria-label={fr.menu.backAria}
        >
          <span className="menu-button-arrow" aria-hidden="true">
            {fr.menu.backArrow}
          </span>
          <span className="menu-button-label">{fr.menu.backLabel}</span>
        </button>
        <div className="header-context">
          <div
            className="profile-switch"
            aria-label={plugin.profileSwitchLabel ?? fr.profiles.label}
          >
            <span className="profile-label">{plugin.profileSwitchLabel ?? fr.profiles.label}</span>
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
        <ThemeToggle theme={theme} onTheme={onTheme} />
        <Shortcuts />
      </div>
    </header>
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
