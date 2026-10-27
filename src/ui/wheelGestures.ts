/**
 * Classifies a wheel event as either a camera pan or a zoom.
 *
 * Browsers do not tell us whether an event comes from a mouse wheel or a
 * laptop trackpad. A trackpad produces pixel-mode events with horizontal
 * motion, fractional deltas, or small vertical deltas; a mouse wheel produces
 * line/page events or large, discrete pixel steps. Pinch-to-zoom is always
 * delivered as Ctrl+wheel, so it is treated as a zoom regardless of size.
 */
export type WheelIntent =
  | { readonly kind: 'zoom'; readonly factor: number }
  | { readonly kind: 'pan'; readonly dx: number; readonly dy: number }

const LINE_HEIGHT = 16
const MOUSE_WHEEL_STEP = 50
const PINCH_ZOOM_SPEED = 0.0035
const WHEEL_ZOOM_SPEED = 0.0015

export function wheelIntent(event: WheelEvent, viewportHeight: number): WheelIntent {
  const unit = event.deltaMode === 1 ? LINE_HEIGHT : event.deltaMode === 2 ? viewportHeight : 1
  const dx = event.deltaX * unit
  const dy = event.deltaY * unit

  if (event.ctrlKey) {
    return { kind: 'zoom', factor: Math.exp(-dy * PINCH_ZOOM_SPEED) }
  }

  if (looksLikeTrackpad(event, dx, dy)) {
    return { kind: 'pan', dx, dy }
  }

  return { kind: 'zoom', factor: Math.exp(-dy * WHEEL_ZOOM_SPEED) }
}

function looksLikeTrackpad(event: WheelEvent, dx: number, dy: number): boolean {
  if (event.deltaMode !== 0) return false
  if (dx !== 0) return true
  if (!Number.isInteger(dy)) return true
  return Math.abs(dy) < MOUSE_WHEEL_STEP
}
