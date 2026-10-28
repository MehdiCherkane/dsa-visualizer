import { describe, expect, it } from 'vitest'
import type { BaseSnapshot, OperationDef } from '../core/types'
import { nextInsertParams } from './operations'

const insertOperation = {
  id: 'empiler',
  label: 'Empiler',
  inserts: true,
  params: [{ name: 'valeur', kind: 'number', label: 'Valeur', defaultValue: 13 }],
  complexity: 'O(1)',
  complexityNote: 'O(1)',
  run: () => [],
} as unknown as OperationDef<BaseSnapshot>

describe('paramètres d’insertion', () => {
  it('propose la valeur suivante après une insertion réussie', () => {
    expect(nextInsertParams(insertOperation, { valeur: '13' }, { valeur: '13' })).toEqual({
      valeur: '14',
    })
  })

  it('ne remplace pas une valeur saisie entre-temps', () => {
    expect(nextInsertParams(insertOperation, { valeur: '13' }, { valeur: '21' })).toBeNull()
  })

  it('ne touche pas aux opérations qui ne sont pas des insertions', () => {
    const readOnly = { ...insertOperation, inserts: false }
    expect(nextInsertParams(readOnly, { valeur: '13' }, { valeur: '13' })).toBeNull()
  })
})
