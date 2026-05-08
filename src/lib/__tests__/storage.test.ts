import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_VERSION,
  getAppPreferences,
  getGameStats,
  readAppState,
  recordRoundResult,
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
    expect(state.preferences.soundEnabled).toBe(true)
  })

  it('stores last difficulty and high score', () => {
    setLastDifficulty('flag-quiz', 'level-3')
    const saved = recordRoundResult({
      gameId: 'flag-quiz',
      difficultyId: 'level-3',
      totalScore: 17,
      correctAnswers: 7,
      totalQuestions: 10,
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
})
