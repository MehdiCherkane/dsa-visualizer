import { useCallback, useEffect, useState } from 'react'
import { fr } from './i18n/fr'
import { exerciceById, getExercices, pluginForChapter, plugins } from './registry'
import { DemoApp } from './ui/App'
import { ExercicesPage } from './exercices/ExercicesPage'
import { ExerciseSheetPage } from './exercices/ExerciseSheetPage'
import { MainMenu } from './ui/MainMenu'
import { ZelligeBackdrop } from './ui/SiteBackdrop'
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

  const plugin = route.view === 'chapter' ? pluginForChapter(route.chapter) : undefined
  const exercise = route.view === 'exercice' ? exerciceById(route.exerciseId) : undefined

  useEffect(() => {
    const nextTitle =
      route.view === 'chapter' && plugin
        ? fr.menu.chapterPageTitle(plugin.title)
        : route.view === 'exercices'
          ? fr.exercices.pageTitle
          : route.view === 'exercice' && exercise
            ? fr.exercices.sheetPageTitle(exercise.title)
            : fr.menu.pageTitle
    document.title = nextTitle
  }, [route, plugin, exercise])

  const exercices = getExercices()

  if (route.view === 'exercices') {
    return (
      <>
        <ZelligeBackdrop />
        <ExercicesPage exercises={exercices} theme={theme} onTheme={toggleTheme} />
      </>
    )
  }

  if (route.view === 'exercice') {
    if (!exercise) {
      return (
        <>
          <ZelligeBackdrop />
          <ExercicesPage exercises={exercices} theme={theme} onTheme={toggleTheme} />
        </>
      )
    }
    return (
      <>
        <ZelligeBackdrop />
        <ExerciseSheetPage key={exercise.id} exercise={exercise} theme={theme} onTheme={toggleTheme} />
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
      />
    </>
  )
}
