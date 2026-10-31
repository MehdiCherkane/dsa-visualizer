import { useMemo, useSyncExternalStore } from 'react'

/**
 * Hand-rolled hash navigation: the app builds to a single file opened with
 * `file://`, so no history-API router (which needs a server) can be used.
 */
export type Route =
  | { view: 'menu' }
  | { view: 'chapter'; chapter: number }
  | { view: 'exercices'; exerciseId?: string }

export const MENU_HASH = '#/'
export const EXERCICES_HASH = '#/exercices'

export function chapterHash(chapter: number): string {
  return `#/chapitre-${chapter}`
}

export function exerciseHash(id?: string): string {
  return id ? `${EXERCICES_HASH}/${encodeURIComponent(id)}` : EXERCICES_HASH
}

const CHAPTER_PATTERN = /^#\/chapitre-(\d+)\/?$/
const EXERCICES_PATTERN = /^#\/exercices(?:\/([^/]+))?\/?$/
const MENU_ROUTE: Route = { view: 'menu' }

function decodeId(value: string): string | undefined {
  try {
    return decodeURIComponent(value)
  } catch {
    return undefined
  }
}

/** `#/` and anything unrecognised fall back to the menu. */
export function parseRoute(hash: string): Route {
  const normalized = hash.trim()
  const chapterMatch = CHAPTER_PATTERN.exec(normalized)
  if (chapterMatch) {
    const chapter = Number(chapterMatch[1])
    if (!Number.isSafeInteger(chapter) || chapter <= 0) return MENU_ROUTE
    return { view: 'chapter', chapter }
  }

  const exercicesMatch = EXERCICES_PATTERN.exec(normalized)
  if (!exercicesMatch) return MENU_ROUTE
  const rawId = exercicesMatch[1]
  if (rawId === undefined) return { view: 'exercices' }
  const exerciseId = decodeId(rawId)
  if (!exerciseId) return MENU_ROUTE
  return { view: 'exercices', exerciseId }
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
