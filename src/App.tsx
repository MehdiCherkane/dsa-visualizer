import { useCallback, useEffect, useState } from 'react'
import { exerciseById } from './exercices/registry'
import { fr } from './i18n/fr'
import { pluginForChapter, plugins } from './registry'
import { DemoApp } from './ui/App'
import { ExercicesPage } from './ui/ExercicesPage'
import { MainMenu } from './ui/MainMenu'
import { ZelligeBackdrop } from './ui/SiteBackdrop'
import { EXERCICES_HASH, MENU_HASH, navigate, useHashRoute } from './ui/useHashRoute'

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
  const exerciseId = route.view === 'exercices' ? route.exerciseId : undefined
  const exercise = exerciseId ? exerciseById(exerciseId) : undefined

  useEffect(() => {
    if (route.view === 'exercices') {
      document.title = exerciseId
        ? exercise
          ? fr.exercices.exercisePageTitle(exercise.title)
          : fr.exercices.notFoundPageTitle
        : fr.exercices.pageTitle
      return
    }
    document.title = plugin ? fr.menu.chapterPageTitle(plugin.title) : fr.menu.pageTitle
  }, [exercise, exerciseId, plugin, route.view])

  if (route.view === 'exercices') {
    return (
      <>
        <ZelligeBackdrop />
        <ExercicesPage
          exerciseId={exerciseId}
          theme={theme}
          onTheme={toggleTheme}
          onMenu={() => navigate(MENU_HASH)}
        />
      </>
    )
  }

  if (!plugin) {
    return (
      <>
        <ZelligeBackdrop />
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
        onExercices={() => navigate(EXERCICES_HASH)}
      />
    </>
  )
}
