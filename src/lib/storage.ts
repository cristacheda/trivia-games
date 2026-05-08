import { useEffect, useState } from 'react'
import { FLAG_QUIZ_GAME_ID } from '@/features/flag-quiz/constants'
import { flagQuestionBank } from '@/features/flag-quiz/data/countries'
import { buildFlagQuizQuestionDeck } from '@/features/flag-quiz/lib/round'
import type {
  AppPreferences,
  CountryDeckProgress,
  DifficultyId,
  GameId,
  GameLocalStats,
  PersistedAppState,
  RoundResult,
} from '@/types/game'

const STORAGE_KEY = 'atlas-of-answers:app-state'
const STORAGE_EVENT = 'atlas-of-answers:storage-updated'
export const STORAGE_VERSION = 3

type RoundResultInput = Omit<RoundResult, 'previousBestScore' | 'beatHighScore'>

function createDefaultCountryDeck(): CountryDeckProgress {
  return {
    orderedCountryCodes: [],
    nextIndex: 0,
  }
}

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
    countryDeck: null,
  }
}

function normalizeCountryDeck(value: unknown): CountryDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCountryDeck()
  }

  const deck = value as Partial<CountryDeckProgress>
  const validCodes = new Set(flagQuestionBank.map((country) => country.code))
  const orderedCountryCodes = Array.isArray(deck.orderedCountryCodes)
    ? Array.from(
        new Set(
          deck.orderedCountryCodes.filter(
            (code): code is string =>
              typeof code === 'string' && validCodes.has(code),
          ),
        ),
      )
    : []
  const nextIndex =
    typeof deck.nextIndex === 'number' && Number.isInteger(deck.nextIndex)
      ? Math.max(0, Math.min(deck.nextIndex, orderedCountryCodes.length))
      : 0

  return {
    orderedCountryCodes,
    nextIndex,
  }
}

function normalizeGameStats(
  gameId: GameId,
  value: unknown,
): GameLocalStats {
  if (!value || typeof value !== 'object') {
    return createDefaultStats()
  }

  const stats = value as Partial<GameLocalStats>

  return {
    highScore: stats.highScore ?? null,
    recentResult: stats.recentResult ?? null,
    lastDifficulty: stats.lastDifficulty ?? null,
    countryDeck:
      gameId === FLAG_QUIZ_GAME_ID
        ? normalizeCountryDeck(stats.countryDeck)
        : null,
  }
}

function normalizeGames(
  games: Partial<Record<GameId, GameLocalStats>> | undefined,
): Partial<Record<GameId, GameLocalStats>> {
  return {
    ...(games?.['outline-quiz']
      ? { 'outline-quiz': normalizeGameStats('outline-quiz', games['outline-quiz']) }
      : {}),
    ...(games?.[FLAG_QUIZ_GAME_ID]
      ? { [FLAG_QUIZ_GAME_ID]: normalizeGameStats(FLAG_QUIZ_GAME_ID, games[FLAG_QUIZ_GAME_ID]) }
      : {}),
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
      games: normalizeGames(state.games),
      preferences: createDefaultPreferences(),
    }
  }

  if (state.version === 2) {
    return {
      version: STORAGE_VERSION,
      playerId: state.playerId,
      games: normalizeGames(state.games),
      preferences: {
        ...createDefaultPreferences(),
        ...(state.preferences ?? {}),
      },
    }
  }

  if (state.version !== STORAGE_VERSION) {
    return createDefaultState()
  }

  return {
    version: STORAGE_VERSION,
    playerId: state.playerId,
    games: normalizeGames(state.games),
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
  return normalizeGameStats(gameId, state.games[gameId])
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
  const currentStats = getGameStats(result.gameId)
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

export function getFlagQuizCountryDeck(): CountryDeckProgress {
  return getGameStats(FLAG_QUIZ_GAME_ID).countryDeck ?? createDefaultCountryDeck()
}

export function setFlagQuizCountryDeck(countryDeck: CountryDeckProgress) {
  const state = readAppState()

  writeAppState({
    ...state,
    games: {
      ...state.games,
      [FLAG_QUIZ_GAME_ID]: {
        ...createDefaultStats(),
        ...state.games[FLAG_QUIZ_GAME_ID],
        countryDeck: normalizeCountryDeck(countryDeck),
      },
    },
  })
}

export function reserveFlagQuizCountries(
  totalQuestions: number,
  random: () => number = Math.random,
): string[] {
  const currentDeck = getFlagQuizCountryDeck()
  let orderedCountryCodes = [...currentDeck.orderedCountryCodes]
  let nextIndex = currentDeck.nextIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedCountryCodes.length === 0 || nextIndex >= orderedCountryCodes.length) {
      orderedCountryCodes = buildFlagQuizQuestionDeck(random).map(
        (country) => country.code,
      )
      nextIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedCountryCodes.slice(nextIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextIndex += nextCodes.length
  }

  setFlagQuizCountryDeck({
    orderedCountryCodes,
    nextIndex,
  })

  return selectedCodes
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
