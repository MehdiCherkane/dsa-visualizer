import { useMemo, useSyncExternalStore } from 'react'

/**
 * Hand-rolled hash navigation: the app builds to a single file opened with
 * `file://`, so no history-API router (which needs a server) can be used.
 */
export type Route = { view: 'menu' } | { view: 'chapter'; chapter: number }

export const MENU_HASH = '#/'

export function chapterHash(chapter: number): string {
  return `#/chapitre-${chapter}`
}

const CHAPTER_PATTERN = /^#\/chapitre-(\d+)\/?$/
const MENU_ROUTE: Route = { view: 'menu' }

/** `#/` and anything unrecognised fall back to the menu. */
export function parseRoute(hash: string): Route {
  const match = CHAPTER_PATTERN.exec(hash.trim())
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
