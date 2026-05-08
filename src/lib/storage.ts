import { useEffect, useState } from 'react'
import { FLAG_QUIZ_GAME_ID } from '@/features/flag-quiz/constants'
import { flagQuestionBank } from '@/features/flag-quiz/data/countries'
import { buildFlagQuizQuestionDeck } from '@/features/flag-quiz/lib/round'
import { GUESS_THE_CAPITAL_GAME_ID } from '@/features/guess-the-capital/constants'
import {
  capitalCountryQuestionBank,
  capitalCountryQuestionBankByCode,
} from '@/features/guess-the-capital/data/countries'
import {
  capitalStateQuestionBank,
  capitalStateQuestionBankByCode,
} from '@/features/guess-the-capital/data/states'
import { buildGuessTheCapitalDeck } from '@/features/guess-the-capital/lib/round'
import { OUTLINE_QUIZ_GAME_ID } from '@/features/outline-quiz/constants'
import {
  outlineCountryQuestionBank,
  outlineCountryQuestionBankByCode,
} from '@/features/outline-quiz/data/countries'
import {
  outlineStateQuestionBank,
  outlineStateQuestionBankByCode,
} from '@/features/outline-quiz/data/states'
import { buildOutlineQuizDeck } from '@/features/outline-quiz/lib/round'
import type {
  AppPreferences,
  CapitalDeckProgress,
  CountryDeckProgress,
  DifficultyId,
  GameId,
  GameLocalStats,
  OutlineDeckProgress,
  PersistedAppState,
  RoundResult,
} from '@/types/game'

const STORAGE_KEY = 'atlas-of-answers:app-state'
const STORAGE_EVENT = 'atlas-of-answers:storage-updated'
export const STORAGE_VERSION = 5

type RoundResultInput = Omit<RoundResult, 'previousBestScore' | 'beatHighScore'>

function createDefaultCountryDeck(): CountryDeckProgress {
  return {
    orderedCountryCodes: [],
    nextIndex: 0,
  }
}

function createDefaultCapitalDeck(): CapitalDeckProgress {
  return {
    orderedCountryCodes: [],
    nextCountryIndex: 0,
    orderedStateCodes: [],
    nextStateIndex: 0,
  }
}

function createDefaultOutlineDeck(): OutlineDeckProgress {
  return {
    orderedCountryCodes: [],
    nextCountryIndex: 0,
    orderedStateCodes: [],
    nextStateIndex: 0,
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
    capitalDeck: null,
    outlineDeck: null,
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
    capitalDeck:
      gameId === GUESS_THE_CAPITAL_GAME_ID
        ? normalizeCapitalDeck(stats.capitalDeck)
        : null,
    outlineDeck:
      gameId === OUTLINE_QUIZ_GAME_ID
        ? normalizeOutlineDeck(stats.outlineDeck)
        : null,
  }
}

function normalizeGames(
  games: Partial<Record<GameId, GameLocalStats>> | undefined,
): Partial<Record<GameId, GameLocalStats>> {
  return {
    ...(games?.[GUESS_THE_CAPITAL_GAME_ID]
      ? {
          [GUESS_THE_CAPITAL_GAME_ID]: normalizeGameStats(
            GUESS_THE_CAPITAL_GAME_ID,
            games[GUESS_THE_CAPITAL_GAME_ID],
          ),
        }
      : {}),
    ...(games?.[OUTLINE_QUIZ_GAME_ID]
      ? { [OUTLINE_QUIZ_GAME_ID]: normalizeGameStats(OUTLINE_QUIZ_GAME_ID, games[OUTLINE_QUIZ_GAME_ID]) }
      : {}),
    ...(games?.['guess-the-currency']
      ? {
          'guess-the-currency': normalizeGameStats(
            'guess-the-currency',
            games['guess-the-currency'],
          ),
        }
      : {}),
    ...(games?.['guess-the-official-language']
      ? {
          'guess-the-official-language': normalizeGameStats(
            'guess-the-official-language',
            games['guess-the-official-language'],
          ),
        }
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

  if (
    state.version === 1 ||
    state.version === 2 ||
    state.version === 3 ||
    state.version === 4
  ) {
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

function normalizeCapitalDeck(value: unknown): CapitalDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCapitalDeck()
  }

  const deck = value as Partial<CapitalDeckProgress>
  const validCountryCodes = new Set(
    capitalCountryQuestionBank.map((country) => country.code),
  )
  const validStateCodes = new Set(capitalStateQuestionBank.map((state) => state.code))
  const orderedCountryCodes = Array.isArray(deck.orderedCountryCodes)
    ? Array.from(
        new Set(
          deck.orderedCountryCodes.filter(
            (code): code is string =>
              typeof code === 'string' && validCountryCodes.has(code),
          ),
        ),
      )
    : []
  const orderedStateCodes = Array.isArray(deck.orderedStateCodes)
    ? Array.from(
        new Set(
          deck.orderedStateCodes.filter(
            (code): code is string =>
              typeof code === 'string' && validStateCodes.has(code),
          ),
        ),
      )
    : []
  const nextCountryIndex =
    typeof deck.nextCountryIndex === 'number' &&
    Number.isInteger(deck.nextCountryIndex)
      ? Math.max(0, Math.min(deck.nextCountryIndex, orderedCountryCodes.length))
      : 0
  const nextStateIndex =
    typeof deck.nextStateIndex === 'number' && Number.isInteger(deck.nextStateIndex)
      ? Math.max(0, Math.min(deck.nextStateIndex, orderedStateCodes.length))
      : 0

  return {
    orderedCountryCodes,
    nextCountryIndex,
    orderedStateCodes,
    nextStateIndex,
  }
}

function normalizeOutlineDeck(value: unknown): OutlineDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultOutlineDeck()
  }

  const deck = value as Partial<OutlineDeckProgress>
  const validCountryCodes = new Set(
    outlineCountryQuestionBank.map((country) => country.code),
  )
  const validStateCodes = new Set(outlineStateQuestionBank.map((state) => state.code))
  const orderedCountryCodes = Array.isArray(deck.orderedCountryCodes)
    ? Array.from(
        new Set(
          deck.orderedCountryCodes.filter(
            (code): code is string =>
              typeof code === 'string' && validCountryCodes.has(code),
          ),
        ),
      )
    : []
  const orderedStateCodes = Array.isArray(deck.orderedStateCodes)
    ? Array.from(
        new Set(
          deck.orderedStateCodes.filter(
            (code): code is string =>
              typeof code === 'string' && validStateCodes.has(code),
          ),
        ),
      )
    : []
  const nextCountryIndex =
    typeof deck.nextCountryIndex === 'number' &&
    Number.isInteger(deck.nextCountryIndex)
      ? Math.max(0, Math.min(deck.nextCountryIndex, orderedCountryCodes.length))
      : 0
  const nextStateIndex =
    typeof deck.nextStateIndex === 'number' && Number.isInteger(deck.nextStateIndex)
      ? Math.max(0, Math.min(deck.nextStateIndex, orderedStateCodes.length))
      : 0

  return {
    orderedCountryCodes,
    nextCountryIndex,
    orderedStateCodes,
    nextStateIndex,
  }
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

export function getGuessTheCapitalDeck(): CapitalDeckProgress {
  return getGameStats(GUESS_THE_CAPITAL_GAME_ID).capitalDeck ?? createDefaultCapitalDeck()
}

export function setGuessTheCapitalDeck(capitalDeck: CapitalDeckProgress) {
  const state = readAppState()

  writeAppState({
    ...state,
    games: {
      ...state.games,
      [GUESS_THE_CAPITAL_GAME_ID]: {
        ...createDefaultStats(),
        ...state.games[GUESS_THE_CAPITAL_GAME_ID],
        capitalDeck: normalizeCapitalDeck(capitalDeck),
      },
    },
  })
}

function reserveCountryCodes(
  totalQuestions: number,
  currentDeck: CapitalDeckProgress,
  difficultyId: DifficultyId,
  random: () => number,
) {
  let orderedCountryCodes = [...currentDeck.orderedCountryCodes]
  let nextCountryIndex = currentDeck.nextCountryIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedCountryCodes.length === 0 || nextCountryIndex >= orderedCountryCodes.length) {
      orderedCountryCodes = buildGuessTheCapitalDeck(
        'country',
        random,
        difficultyId,
      ).map(
        (country) => country.code,
      )
      nextCountryIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedCountryCodes.slice(nextCountryIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextCountryIndex += nextCodes.length
  }

  return { orderedCountryCodes, nextCountryIndex, selectedCodes }
}

function reserveStateCodes(
  totalQuestions: number,
  currentDeck: CapitalDeckProgress,
  difficultyId: DifficultyId,
  random: () => number,
) {
  let orderedStateCodes = [...currentDeck.orderedStateCodes]
  let nextStateIndex = currentDeck.nextStateIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedStateCodes.length === 0 || nextStateIndex >= orderedStateCodes.length) {
      orderedStateCodes = buildGuessTheCapitalDeck(
        'state',
        random,
        difficultyId,
      ).map(
        (state) => state.code,
      )
      nextStateIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedStateCodes.slice(nextStateIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextStateIndex += nextCodes.length
  }

  return { orderedStateCodes, nextStateIndex, selectedCodes }
}

export function reserveGuessTheCapitalSubjects(
  totalCountries: number,
  totalStates: number,
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  const currentDeck = getGuessTheCapitalDeck()
  const {
    orderedCountryCodes,
    nextCountryIndex,
    selectedCodes: countryCodes,
  } = reserveCountryCodes(totalCountries, currentDeck, difficultyId, random)
  const {
    orderedStateCodes,
    nextStateIndex,
    selectedCodes: stateCodes,
  } = reserveStateCodes(totalStates, currentDeck, difficultyId, random)

  setGuessTheCapitalDeck({
    orderedCountryCodes,
    nextCountryIndex,
    orderedStateCodes,
    nextStateIndex,
  })

  return {
    countries: countryCodes.map((code) => {
      const country = capitalCountryQuestionBankByCode.get(code)

      if (!country) {
        throw new Error(`Unknown capital quiz country code: ${code}`)
      }

      return country
    }),
    states: stateCodes.map((code) => {
      const state = capitalStateQuestionBankByCode.get(code)

      if (!state) {
        throw new Error(`Unknown capital quiz state code: ${code}`)
      }

      return state
    }),
  }
}

export function getOutlineQuizDeck(): OutlineDeckProgress {
  return getGameStats(OUTLINE_QUIZ_GAME_ID).outlineDeck ?? createDefaultOutlineDeck()
}

export function setOutlineQuizDeck(outlineDeck: OutlineDeckProgress) {
  const state = readAppState()

  writeAppState({
    ...state,
    games: {
      ...state.games,
      [OUTLINE_QUIZ_GAME_ID]: {
        ...createDefaultStats(),
        ...state.games[OUTLINE_QUIZ_GAME_ID],
        outlineDeck: normalizeOutlineDeck(outlineDeck),
      },
    },
  })
}

function reserveOutlineCountryCodes(
  totalQuestions: number,
  currentDeck: OutlineDeckProgress,
  difficultyId: DifficultyId,
  random: () => number,
) {
  let orderedCountryCodes = [...currentDeck.orderedCountryCodes]
  let nextCountryIndex = currentDeck.nextCountryIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedCountryCodes.length === 0 || nextCountryIndex >= orderedCountryCodes.length) {
      orderedCountryCodes = buildOutlineQuizDeck(
        'country',
        difficultyId,
        random,
      ).map((country) => country.code)
      nextCountryIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedCountryCodes.slice(nextCountryIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextCountryIndex += nextCodes.length
  }

  return { orderedCountryCodes, nextCountryIndex, selectedCodes }
}

function reserveOutlineStateCodes(
  totalQuestions: number,
  currentDeck: OutlineDeckProgress,
  difficultyId: DifficultyId,
  random: () => number,
) {
  let orderedStateCodes = [...currentDeck.orderedStateCodes]
  let nextStateIndex = currentDeck.nextStateIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedStateCodes.length === 0 || nextStateIndex >= orderedStateCodes.length) {
      orderedStateCodes = buildOutlineQuizDeck(
        'state',
        difficultyId,
        random,
      ).map((state) => state.code)
      nextStateIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedStateCodes.slice(nextStateIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextStateIndex += nextCodes.length
  }

  return { orderedStateCodes, nextStateIndex, selectedCodes }
}

export function reserveOutlineQuizSubjects(
  totalCountries: number,
  totalStates: number,
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  const currentDeck = getOutlineQuizDeck()
  const {
    orderedCountryCodes,
    nextCountryIndex,
    selectedCodes: countryCodes,
  } = reserveOutlineCountryCodes(totalCountries, currentDeck, difficultyId, random)
  const {
    orderedStateCodes,
    nextStateIndex,
    selectedCodes: stateCodes,
  } = reserveOutlineStateCodes(totalStates, currentDeck, difficultyId, random)

  setOutlineQuizDeck({
    orderedCountryCodes,
    nextCountryIndex,
    orderedStateCodes,
    nextStateIndex,
  })

  return {
    countries: countryCodes.map((code) => {
      const country = outlineCountryQuestionBankByCode.get(code)

      if (!country) {
        throw new Error(`Unknown outline quiz country code: ${code}`)
      }

      return country
    }),
    states: stateCodes.map((code) => {
      const state = outlineStateQuestionBankByCode.get(code)

      if (!state) {
        throw new Error(`Unknown outline quiz state code: ${code}`)
      }

      return state
    }),
  }
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
