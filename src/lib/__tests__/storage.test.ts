import { beforeEach, describe, expect, it } from 'vitest'
import { FLAG_QUIZ_QUESTIONS_PER_ROUND } from '@/features/flag-quiz/constants'
import { flagQuestionBank } from '@/features/flag-quiz/data/countries'
import {
  STORAGE_VERSION,
  getFlagQuizCountryDeck,
  getAppPreferences,
  getGameStats,
  readAppState,
  recordRoundResult,
  reserveFlagQuizCountries,
  setFlagQuizCountryDeck,
  setSoundEnabled,
  setLastDifficulty,
} from '@/lib/storage'

describe('storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('initializes versioned storage', () => {
    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.playerId).toBeTruthy()
  })

  it('resets invalid schema versions', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({ version: 999, playerId: 'old', games: {}, preferences: {} }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.playerId).not.toBe('old')
  })

  it('migrates version 1 state without dropping scores', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 1,
        playerId: 'player-1',
        games: {
          'flag-quiz': {
            highScore: {
              score: 12,
              achievedAt: '2026-05-07T20:00:00.000Z',
              difficultyId: 'level-2',
            },
            recentResult: null,
            lastDifficulty: 'level-2',
          },
        },
      }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.playerId).toBe('player-1')
    expect(state.games['flag-quiz']?.highScore?.score).toBe(12)
    expect(state.games['flag-quiz']?.countryDeck).toEqual({
      orderedCountryCodes: [],
      nextIndex: 0,
    })
    expect(state.preferences.soundEnabled).toBe(true)
  })

  it('migrates version 2 state and initializes flag quiz deck progress', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 2,
        playerId: 'player-2',
        games: {
          'flag-quiz': {
            highScore: {
              score: 15,
              achievedAt: '2026-05-08T20:00:00.000Z',
              difficultyId: 'level-3',
            },
            recentResult: {
              gameId: 'flag-quiz',
              difficultyId: 'level-3',
              totalScore: 15,
              correctAnswers: 5,
              totalQuestions: 10,
              completedAt: '2026-05-08T20:00:00.000Z',
              previousBestScore: 10,
              beatHighScore: true,
            },
            lastDifficulty: 'level-3',
          },
        },
        preferences: {
          soundEnabled: false,
        },
      }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.playerId).toBe('player-2')
    expect(state.games['flag-quiz']?.highScore?.score).toBe(15)
    expect(state.games['flag-quiz']?.recentResult?.totalScore).toBe(15)
    expect(state.games['flag-quiz']?.lastDifficulty).toBe('level-3')
    expect(state.games['flag-quiz']?.countryDeck).toEqual({
      orderedCountryCodes: [],
      nextIndex: 0,
    })
    expect(state.preferences.soundEnabled).toBe(false)
  })

  it('stores last difficulty and high score', () => {
    setLastDifficulty('flag-quiz', 'level-3')
    const saved = recordRoundResult({
      gameId: 'flag-quiz',
      difficultyId: 'level-3',
      totalScore: 17,
      correctAnswers: 7,
      totalQuestions: FLAG_QUIZ_QUESTIONS_PER_ROUND,
      completedAt: '2026-05-08T20:00:00.000Z',
    })

    const stats = getGameStats('flag-quiz')

    expect(saved.previousBestScore).toBeNull()
    expect(saved.beatHighScore).toBe(true)
    expect(stats.lastDifficulty).toBe('level-3')
    expect(stats.highScore?.score).toBe(17)
    expect(stats.recentResult?.totalScore).toBe(17)
  })

  it('stores the sound preference', () => {
    setSoundEnabled(false)

    expect(getAppPreferences().soundEnabled).toBe(false)
  })

  it('reserves unique flag quiz countries across consecutive rounds', () => {
    const orderedCountryCodes = flagQuestionBank
      .slice(0, FLAG_QUIZ_QUESTIONS_PER_ROUND * 2)
      .map((country) => country.code)

    setFlagQuizCountryDeck({
      orderedCountryCodes,
      nextIndex: 0,
    })

    const firstRound = reserveFlagQuizCountries(FLAG_QUIZ_QUESTIONS_PER_ROUND)
    setLastDifficulty('flag-quiz', 'level-2')
    const secondRound = reserveFlagQuizCountries(FLAG_QUIZ_QUESTIONS_PER_ROUND)

    expect(firstRound).toEqual(
      orderedCountryCodes.slice(0, FLAG_QUIZ_QUESTIONS_PER_ROUND),
    )
    expect(secondRound).toEqual(
      orderedCountryCodes.slice(
        FLAG_QUIZ_QUESTIONS_PER_ROUND,
        FLAG_QUIZ_QUESTIONS_PER_ROUND * 2,
      ),
    )
    expect(new Set([...firstRound, ...secondRound]).size).toBe(
      FLAG_QUIZ_QUESTIONS_PER_ROUND * 2,
    )
    expect(getFlagQuizCountryDeck()).toEqual({
      orderedCountryCodes,
      nextIndex: FLAG_QUIZ_QUESTIONS_PER_ROUND * 2,
    })
  })

  it('carries the remaining countries forward before resetting the deck', () => {
    const orderedCountryCodes = flagQuestionBank.map((country) => country.code)

    setFlagQuizCountryDeck({
      orderedCountryCodes,
      nextIndex: orderedCountryCodes.length - 5,
    })

    const nextRound = reserveFlagQuizCountries(
      FLAG_QUIZ_QUESTIONS_PER_ROUND,
      () => 0,
    )

    expect(nextRound).toEqual([
      ...orderedCountryCodes.slice(-5),
      ...orderedCountryCodes.slice(0, FLAG_QUIZ_QUESTIONS_PER_ROUND - 5),
    ])
    expect(new Set(nextRound).size).toBe(FLAG_QUIZ_QUESTIONS_PER_ROUND)
    expect(getFlagQuizCountryDeck()).toEqual({
      orderedCountryCodes,
      nextIndex: FLAG_QUIZ_QUESTIONS_PER_ROUND - 5,
    })
  })
})
