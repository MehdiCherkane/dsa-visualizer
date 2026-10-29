// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { EXERCICES_STORAGE_KEY, readExerciseProgress, writeExerciseProgress } from './progress'

describe('progrès des exercices', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('retombe sur zéro par défaut sans donnée enregistrée', () => {
    const progress = readExerciseProgress('tp3-somme-grands-nombres', [
      { id: 'ex1-q1' },
      { id: 'ex1-q2' },
    ])

    expect(progress).toEqual({ question: 0, revealed: [] })
  })

  it('enregistre et relit la question courante et les solutions révélées', () => {
    const questions = [
      { id: 'ex1-q1' },
      { id: 'ex1-q2' },
      { id: 'ex1-q3' },
    ]

    writeExerciseProgress('tp3-somme-grands-nombres', 2, ['ex1-q3'], questions)
    expect(readExerciseProgress('tp3-somme-grands-nombres', questions)).toEqual({
      question: 2,
      revealed: ['ex1-q3'],
    })
  })

  it('rejette les documents malformés, les versions périmées et les hors bornes', () => {
    window.localStorage.setItem(
      EXERCICES_STORAGE_KEY,
      JSON.stringify({ version: 2, exercises: { 'tp3-somme-grands-nombres': { question: 99, revealed: ['inconnu'] } } }),
    )

    expect(readExerciseProgress('tp3-somme-grands-nombres', [{ id: 'ex1-q1' }])).toEqual({
      question: 0,
      revealed: [],
    })

    window.localStorage.setItem(EXERCICES_STORAGE_KEY, '{not-json')
    expect(readExerciseProgress('tp3-somme-grands-nombres', [{ id: 'ex1-q1' }])).toEqual({
      question: 0,
      revealed: [],
    })
  })

  it('ignore les solutions hors périmètre et remplit la question dans les bornes', () => {
    const questions = [
      { id: 'ex1-q1' },
      { id: 'ex1-q2' },
      { id: 'ex1-q3' },
    ]

    writeExerciseProgress('tp3-somme-grands-nombres', 5, ['ex1-q3', 'ex1-q1', 'inconnu'], questions)
    expect(readExerciseProgress('tp3-somme-grands-nombres', questions)).toEqual({
      question: 2,
      revealed: ['ex1-q3', 'ex1-q1'],
    })
  })
})
