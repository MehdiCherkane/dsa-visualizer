export const DOCK_PANE_IDS = ['variables', 'console', 'journal'] as const
export type DockPaneId = (typeof DOCK_PANE_IDS)[number]

export interface LayoutState {
  /** Width of the left workspace pane, as a percentage. */
  workspaceSplit: number
  /** Height of the expanded bottom dock, in pixels. */
  dockHeight: number
  /** Relative widths of the three bottom panes. */
  dockSplit: [number, number, number]
  /** Bottom pane currently filling the dock, if any. */
  focusedDockPane: DockPaneId | null
}

export type LayoutPatch = Partial<LayoutState>

export const LAYOUT_STORAGE_KEY = 'ldc-layout-v1'
export const DOCK_MIN_WIDTHS: [number, number, number] = [200, 260, 220]
export const DOCK_MIN_HEIGHT = 110
export const DOCK_MAX_HEIGHT = 520
export const WORKSPACE_MIN_LEFT = 380
export const WORKSPACE_MIN_RIGHT = 430
export const WORKSPACE_MIN_RIGHT_PRESENTATION = 500

const LAYOUT_VERSION = 1
export const WORKSPACE_MIN_SPLIT = 30
export const WORKSPACE_MAX_SPLIT = 85

export const DEFAULT_LAYOUT: Readonly<LayoutState> = {
  workspaceSplit: 70,
  dockHeight: 160,
  dockSplit: [28, 37, 35],
  focusedDockPane: null,
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function defaultDockHeight(): number {
  return typeof window !== 'undefined' && window.innerHeight < 900 ? 130 : 160
}

export function createDefaultLayout(): LayoutState {
  return {
    ...DEFAULT_LAYOUT,
    dockHeight: defaultDockHeight(),
    dockSplit: [...DEFAULT_LAYOUT.dockSplit],
  }
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function isDockPaneId(value: unknown): value is DockPaneId {
  return typeof value === 'string' && DOCK_PANE_IDS.includes(value as DockPaneId)
}

function normalizeDockSplit(value: unknown): [number, number, number] {
  if (!Array.isArray(value) || value.length !== 3) {
    return [...DEFAULT_LAYOUT.dockSplit]
  }
  const values = value.map((entry) => asNumber(entry, 0))
  if (values.some((entry) => entry <= 0)) {
    return [...DEFAULT_LAYOUT.dockSplit]
  }
  const total = values.reduce((sum, entry) => sum + entry, 0)
  if (total <= 0) return [...DEFAULT_LAYOUT.dockSplit]
  return values.map((entry) => (entry / total) * 100) as [number, number, number]
}

export function normalizeLayout(value: unknown): LayoutState {
  const fallback = createDefaultLayout()
  if (typeof value !== 'object' || value === null) return fallback
  const record = value as Record<string, unknown>
  return {
    workspaceSplit: clamp(
      asNumber(record.workspaceSplit, fallback.workspaceSplit),
      WORKSPACE_MIN_SPLIT,
      WORKSPACE_MAX_SPLIT,
    ),
    dockHeight: clamp(
      asNumber(record.dockHeight, fallback.dockHeight),
      DOCK_MIN_HEIGHT,
      DOCK_MAX_HEIGHT,
    ),
    dockSplit: normalizeDockSplit(record.dockSplit),
    focusedDockPane: isDockPaneId(record.focusedDockPane) ? record.focusedDockPane : null,
  }
}

export function readLayout(): LayoutState {
  if (typeof window === 'undefined') return createDefaultLayout()
  try {
    const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return createDefaultLayout()
    const parsed = JSON.parse(raw) as { version?: unknown; layout?: unknown }
    if (parsed.version !== LAYOUT_VERSION) return createDefaultLayout()
    return normalizeLayout(parsed.layout)
  } catch {
    return createDefaultLayout()
  }
}

export function writeLayout(layout: LayoutState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ version: LAYOUT_VERSION, layout }),
    )
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function resizeAdjacent(
  sizes: readonly number[],
  index: number,
  delta: number,
  minimums: readonly number[],
): number[] {
  const next = [...sizes]
  if (index < 0 || index >= sizes.length - 1) return next
  const first = sizes[index] ?? 0
  const second = sizes[index + 1] ?? 0
  const total = first + second
  if (total <= 0) return next
  const minFirst = minimums[index] ?? 0
  const minSecond = minimums[index + 1] ?? 0
  if (minFirst + minSecond >= total) return next
  const nextFirst = clamp(first + delta, minFirst, total - minSecond)
  next[index] = nextFirst
  next[index + 1] = total - nextFirst
  return next
}

export function toPercentages(sizes: readonly number[]): number[] {
  const total = sizes.reduce((sum, size) => sum + Math.max(0, size), 0)
  if (total <= 0) return sizes.map(() => 0)
  return sizes.map((size) => (Math.max(0, size) / total) * 100)
}

export function toDockSplit(sizes: readonly number[]): [number, number, number] {
  if (sizes.length !== 3) return [...DEFAULT_LAYOUT.dockSplit]
  return toPercentages(sizes) as [number, number, number]
}
