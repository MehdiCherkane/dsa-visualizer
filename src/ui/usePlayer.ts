import { useEffect, useReducer } from 'react'
import type { Player, PlayerState } from '../core/player'
import type { BaseSnapshot } from '../core/types'

export function usePlayerState<S extends BaseSnapshot>(player: Player<S>): PlayerState {
  const [, force] = useReducer((value: number) => value + 1, 0)
  useEffect(() => player.subscribe(force), [player])
  return player.state
}
