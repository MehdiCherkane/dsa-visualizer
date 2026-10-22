import type { Recorder } from '../../ldc/ops/runtime'

/**
 * Visually rotate a row so that the new head occupies the first slot. The C
 * operation only moves `debut`; rotating the slots keeps the new head under
 * the fixed `debut` marker instead of leaving the marker above an old node.
 */
export function rotateRowToHead(r: Recorder, headId: number): void {
  const row = r.state.nodes
    .filter((node) => !node.freed && node.lane === 'row')
    .slice()
    .sort((a, b) => a.slot - b.slot)
  if (row.length === 0) return

  const head = row.find((node) => node.id === headId)
  if (!head) return

  const offset = head.slot
  for (const node of row) {
    const slot = (node.slot - offset + row.length) % row.length
    r.moveNode(node.id, slot, 'row')
  }
}
