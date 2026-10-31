import { useMemo, useSyncExternalStore } from 'react'

/**
 * Hand-rolled hash navigation: the app builds to a single file opened with
 * `file://`, so no history-API router (which needs a server) can be used.
 */
export type Route =
  | { view: 'menu' }
  | { view: 'chapter'; chapter: number }
  | { view: 'exercices' }
  | { view: 'exercice'; exerciseId: string }
  | { view: 'presa' }

export const MENU_HASH = '#/'
export const EXERCICES_HASH = '#/exercices'
export const PRESA_HASH = '#/presa'

export function chapterHash(chapter: number): string {
  return `#/chapitre-${chapter}`
}

export function exerciseHash(exerciseId: string): string {
  return `${EXERCICES_HASH}/${exerciseId}`
}

const CHAPTER_PATTERN = /^#\/chapitre-(\d+)\/?$/
const EXERCICES_PATTERN = /^#\/exercices\/?$/
const EXERCICE_PATTERN = /^#\/exercices\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/
const PRESA_PATTERN = /^#\/presa\/?$/
const MENU_ROUTE: Route = { view: 'menu' }
const EXERCICES_ROUTE: Route = { view: 'exercices' }
const PRESA_ROUTE: Route = { view: 'presa' }

/** `#/` and anything unrecognised fall back to the menu. */
export function parseRoute(hash: string): Route {
  const trimmed = hash.trim()
  if (PRESA_PATTERN.test(trimmed)) return PRESA_ROUTE
  if (EXERCICES_PATTERN.test(trimmed)) return EXERCICES_ROUTE
  const exerciseMatch = EXERCICE_PATTERN.exec(trimmed)
  if (exerciseMatch) return { view: 'exercice', exerciseId: exerciseMatch[1] }
  const match = CHAPTER_PATTERN.exec(trimmed)
  if (!match) return MENU_ROUTE
  const chapter = Number(match[1])
  if (!Number.isSafeInteger(chapter) || chapter <= 0) return MENU_ROUTE
  return { view: 'chapter', chapter }
}

export function navigate(hash: string): void {
  if (typeof window === 'undefined') return
  if (window.location.hash === hash) return
  window.location.hash = hash
}

function readHash(): string {
  return typeof window === 'undefined' ? '' : window.location.hash
}

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useHashRoute(): Route {
  // The server snapshot reads the same value so the demo can be rendered
  // outside the browser (tests) without an extra hydration path.
  const hash = useSyncExternalStore(subscribe, readHash, readHash)
  return useMemo(() => parseRoute(hash), [hash])
}
