import { beforeEach, describe, expect, it } from 'vitest'
import {
  STORAGE_VERSION,
  getGameStats,
  readAppState,
  recordRoundResult,
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
      JSON.stringify({ version: 999, playerId: 'old', games: {} }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.playerId).not.toBe('old')
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
})
