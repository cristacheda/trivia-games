import { useEffect, useState } from 'react'
import type {
  AppPreferences,
  DifficultyId,
  GameId,
  GameLocalStats,
  PersistedAppState,
  RoundResult,
} from '@/types/game'

const STORAGE_KEY = 'atlas-of-answers:app-state'
const STORAGE_EVENT = 'atlas-of-answers:storage-updated'
export const STORAGE_VERSION = 2

type RoundResultInput = Omit<RoundResult, 'previousBestScore' | 'beatHighScore'>

function createDefaultPreferences(): AppPreferences {
  return {
    soundEnabled: true,
  }
}

function createDefaultStats(): GameLocalStats {
  return {
    highScore: null,
    recentResult: null,
    lastDifficulty: null,
  }
}

function createDefaultState(): PersistedAppState {
  return {
    version: STORAGE_VERSION,
    playerId: crypto.randomUUID(),
    games: {},
    preferences: createDefaultPreferences(),
  }
}

function broadcastStorageChange() {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT))
}

function normalizeState(value: unknown): PersistedAppState {
  if (!value || typeof value !== 'object') {
    return createDefaultState()
  }

  const state = value as Partial<PersistedAppState>

  if (typeof state.playerId !== 'string') {
    return createDefaultState()
  }

  if (state.version === 1) {
    return {
      version: STORAGE_VERSION,
      playerId: state.playerId,
      games: state.games ?? {},
      preferences: createDefaultPreferences(),
    }
  }

  if (state.version !== STORAGE_VERSION) {
    return createDefaultState()
  }

  return {
    version: STORAGE_VERSION,
    playerId: state.playerId,
    games: state.games ?? {},
    preferences: {
      ...createDefaultPreferences(),
      ...(state.preferences ?? {}),
    },
  }
}

export function readAppState(): PersistedAppState {
  if (typeof window === 'undefined') {
    return createDefaultState()
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const initial = createDefaultState()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial))
      return initial
    }

    return normalizeState(JSON.parse(raw))
  } catch {
    return createDefaultState()
  }
}

export function writeAppState(nextState: PersistedAppState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState))
  broadcastStorageChange()
}

export function getPlayerId() {
  const state = readAppState()
  return state.playerId
}

export function getAppPreferences() {
  const state = readAppState()
  return state.preferences
}

export function getGameStats(gameId: GameId): GameLocalStats {
  const state = readAppState()
  return state.games[gameId] ?? createDefaultStats()
}

export function setSoundEnabled(soundEnabled: boolean) {
  const state = readAppState()

  writeAppState({
    ...state,
    preferences: {
      ...state.preferences,
      soundEnabled,
    },
  })
}

export function setLastDifficulty(gameId: GameId, difficultyId: DifficultyId) {
  const state = readAppState()
  const nextState: PersistedAppState = {
    ...state,
    games: {
      ...state.games,
      [gameId]: {
        ...createDefaultStats(),
        ...state.games[gameId],
        lastDifficulty: difficultyId,
      },
    },
  }

  writeAppState(nextState)
}

export function recordRoundResult(result: RoundResultInput): RoundResult {
  const state = readAppState()
  const currentStats = state.games[result.gameId] ?? createDefaultStats()
  const previousBestScore = currentStats.highScore?.score ?? null
  const beatHighScore =
    previousBestScore === null || result.totalScore > previousBestScore

  const nextResult: RoundResult = {
    ...result,
    previousBestScore,
    beatHighScore,
  }

  const nextStats: GameLocalStats = {
    ...currentStats,
    lastDifficulty: result.difficultyId,
    recentResult: nextResult,
    highScore: beatHighScore
      ? {
          score: result.totalScore,
          achievedAt: result.completedAt,
          difficultyId: result.difficultyId,
        }
      : currentStats.highScore,
  }

  writeAppState({
    ...state,
    games: {
      ...state.games,
      [result.gameId]: nextStats,
    },
  })

  return nextResult
}

export function useGameStats(gameId: GameId) {
  const [stats, setStats] = useState(() => getGameStats(gameId))

  useEffect(() => {
    const update = () => setStats(getGameStats(gameId))

    update()
    window.addEventListener('storage', update)
    window.addEventListener(STORAGE_EVENT, update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(STORAGE_EVENT, update)
    }
  }, [gameId])

  return stats
}

export function useSoundEnabled() {
  const [soundEnabled, setSoundEnabledState] = useState(
    () => getAppPreferences().soundEnabled,
  )

  useEffect(() => {
    const update = () => setSoundEnabledState(getAppPreferences().soundEnabled)

    update()
    window.addEventListener('storage', update)
    window.addEventListener(STORAGE_EVENT, update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(STORAGE_EVENT, update)
    }
  }, [])

  return soundEnabled
}
