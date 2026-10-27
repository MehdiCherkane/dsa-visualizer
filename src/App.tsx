import { useCallback, useEffect, useState } from 'react'
import { fr } from './i18n/fr'
import { pluginForChapter, plugins } from './registry'
import { DemoApp } from './ui/App'
import { MainMenu } from './ui/MainMenu'
import { SiteBackdrop, ZelligeBackdrop } from './ui/SiteBackdrop'
import { MENU_HASH, navigate, useHashRoute } from './ui/useHashRoute'

export default function App() {
  const route = useHashRoute()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const toggleTheme = useCallback(() => {
    setTheme((value) => (value === 'light' ? 'dark' : 'light'))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Unknown chapters behave like `#/`: the menu is the fallback entry point.
  const plugin = route.view === 'chapter' ? pluginForChapter(route.chapter) : undefined

  useEffect(() => {
    document.title = plugin ? fr.menu.chapterPageTitle(plugin.title) : fr.menu.pageTitle
  }, [plugin])

  if (!plugin) {
    return (
      <>
        <SiteBackdrop />
        <MainMenu plugins={plugins} theme={theme} onTheme={toggleTheme} />
      </>
    )
  }

  return (
    <>
      <ZelligeBackdrop />
      <DemoApp
        key={plugin.id}
        plugin={plugin}
        theme={theme}
        onTheme={toggleTheme}
        onMenu={() => navigate(MENU_HASH)}
      />
    </>
  )
}
