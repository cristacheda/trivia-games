import { useEffect, useState } from 'react'
import { FLAG_QUIZ_GAME_ID } from '@/features/flag-quiz/constants'
import { GUESS_THE_CAPITAL_GAME_ID } from '@/features/guess-the-capital/constants'
import { GUESS_THE_ARTIST_GAME_ID } from '@/features/guess-the-artist/constants'
import { GUESS_THE_CURRENCY_GAME_ID } from '@/features/guess-the-currency/constants'
import { OUTLINE_QUIZ_GAME_ID } from '@/features/outline-quiz/constants'
import { GUESS_THE_COCKTAIL_GAME_ID } from '@/features/guess-the-cocktail/constants'
import type {
  AppPreferences,
  CapitalDeckProgress,
  CocktailDeckProgress,
  CountryDeckProgress,
  CurrencyDeckProgress,
  DifficultyId,
  GameId,
  GameLocalStats,
  ArtistDeckProgress,
  OutlineDeckProgress,
  PersistedAppState,
  RoundResult,
  TrackingConsent,
} from '@/types/game'

const STORAGE_KEY = 'atlas-of-answers:app-state'
const STORAGE_EVENT = 'atlas-of-answers:storage-updated'
export const STORAGE_VERSION = 10

type RoundResultInput = Omit<RoundResult, 'previousBestScore' | 'beatHighScore'>

function normalizeStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? Array.from(
        new Set(value.filter((entry): entry is string => typeof entry === 'string')),
      )
    : []
}

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

function createDefaultArtistDeck(): ArtistDeckProgress {
  return {
    orderedSongIds: [],
    nextIndex: 0,
  }
}

function createDefaultCurrencyDeck(): CurrencyDeckProgress {
  return {
    orderedCountryCodes: [],
    nextIndex: 0,
  }
}

function createDefaultCocktailDeck(): CocktailDeckProgress {
  return {
    orderedRegularIds: [],
    nextRegularIndex: 0,
    orderedObscureIds: [],
    nextObscureIndex: 0,
  }
}

function createDefaultPreferences(): AppPreferences {
  return {
    soundEnabled: true,
    trackingConsent: 'unknown',
  }
}

function normalizeTrackingConsent(value: unknown): TrackingConsent {
  return value === 'granted' || value === 'denied' ? value : 'unknown'
}

function createDefaultStats(): GameLocalStats {
  return {
    highScore: null,
    recentResult: null,
    lastDifficulty: null,
    countryDeck: null,
    capitalDeck: null,
    outlineDeck: null,
    artistDeck: null,
    currencyDeck: null,
    cocktailDeck: null,
  }
}

export function normalizeCountryDeck(value: unknown): CountryDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCountryDeck()
  }

  const deck = value as Partial<CountryDeckProgress>
  const orderedCountryCodes = normalizeStringList(deck.orderedCountryCodes)
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
    artistDeck:
      gameId === GUESS_THE_ARTIST_GAME_ID
        ? normalizeArtistDeck(stats.artistDeck)
        : null,
    currencyDeck:
      gameId === GUESS_THE_CURRENCY_GAME_ID
        ? normalizeCurrencyDeck(stats.currencyDeck)
        : null,
    cocktailDeck:
      gameId === GUESS_THE_COCKTAIL_GAME_ID
        ? normalizeCocktailDeck(stats.cocktailDeck)
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
    ...(games?.[GUESS_THE_ARTIST_GAME_ID]
      ? {
          [GUESS_THE_ARTIST_GAME_ID]: normalizeGameStats(
            GUESS_THE_ARTIST_GAME_ID,
            games[GUESS_THE_ARTIST_GAME_ID],
          ),
        }
      : {}),
    ...(games?.['guess-the-currency']
      ? {
          'guess-the-currency': normalizeGameStats(
            'guess-the-currency',
            games['guess-the-currency'],
          ),
        }
      : {}),
    ...(games?.['guess-the-cocktail']
      ? {
          'guess-the-cocktail': normalizeGameStats(
            'guess-the-cocktail',
            games['guess-the-cocktail'],
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
    state.version === 4 ||
    state.version === 5 ||
    state.version === 6 ||
    state.version === 7 ||
    state.version === 8 ||
    state.version === 9
  ) {
    return {
      version: STORAGE_VERSION,
      playerId: state.playerId,
      games: normalizeGames(state.games),
      preferences: {
        ...createDefaultPreferences(),
        ...(state.preferences ?? {}),
        trackingConsent: normalizeTrackingConsent(state.preferences?.trackingConsent),
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
      trackingConsent: normalizeTrackingConsent(state.preferences?.trackingConsent),
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

export function getTrackingConsent(): TrackingConsent {
  return getAppPreferences().trackingConsent
}

export function setTrackingConsent(trackingConsent: TrackingConsent) {
  const state = readAppState()

  writeAppState({
    ...state,
    preferences: {
      ...state.preferences,
      trackingConsent,
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

export function normalizeCapitalDeck(value: unknown): CapitalDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCapitalDeck()
  }

  const deck = value as Partial<CapitalDeckProgress>
  const orderedCountryCodes = normalizeStringList(deck.orderedCountryCodes)
  const orderedStateCodes = normalizeStringList(deck.orderedStateCodes)
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

export function normalizeOutlineDeck(value: unknown): OutlineDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultOutlineDeck()
  }

  const deck = value as Partial<OutlineDeckProgress>
  const orderedCountryCodes = normalizeStringList(deck.orderedCountryCodes)
  const orderedStateCodes = normalizeStringList(deck.orderedStateCodes)
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

export function normalizeArtistDeck(value: unknown): ArtistDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultArtistDeck()
  }

  const deck = value as Partial<ArtistDeckProgress>
  const orderedSongIds = normalizeStringList(deck.orderedSongIds)
  const nextIndex =
    typeof deck.nextIndex === 'number' && Number.isInteger(deck.nextIndex)
      ? Math.max(0, Math.min(deck.nextIndex, orderedSongIds.length))
      : 0

  return {
    orderedSongIds,
    nextIndex,
  }
}

export function normalizeCocktailDeck(value: unknown): CocktailDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCocktailDeck()
  }

  const deck = value as Partial<CocktailDeckProgress>
  const orderedRegularIds = normalizeStringList(deck.orderedRegularIds)
  const nextRegularIndex =
    typeof deck.nextRegularIndex === 'number' && Number.isInteger(deck.nextRegularIndex)
      ? Math.max(0, Math.min(deck.nextRegularIndex, orderedRegularIds.length))
      : 0

  const orderedObscureIds = normalizeStringList(deck.orderedObscureIds)
  const nextObscureIndex =
    typeof deck.nextObscureIndex === 'number' && Number.isInteger(deck.nextObscureIndex)
      ? Math.max(0, Math.min(deck.nextObscureIndex, orderedObscureIds.length))
      : 0

  return { orderedRegularIds, nextRegularIndex, orderedObscureIds, nextObscureIndex }
}

export function normalizeCurrencyDeck(value: unknown): CurrencyDeckProgress {
  if (!value || typeof value !== 'object') {
    return createDefaultCurrencyDeck()
  }

  const deck = value as Partial<CurrencyDeckProgress>
  const orderedCountryCodes = normalizeStringList(deck.orderedCountryCodes)
  const nextIndex =
    typeof deck.nextIndex === 'number' && Number.isInteger(deck.nextIndex)
      ? Math.max(0, Math.min(deck.nextIndex, orderedCountryCodes.length))
      : 0

  return { orderedCountryCodes, nextIndex }
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

export function useTrackingConsent() {
  const [trackingConsent, setTrackingConsentState] = useState(
    () => getAppPreferences().trackingConsent,
  )

  useEffect(() => {
    const update = () => setTrackingConsentState(getAppPreferences().trackingConsent)

    update()
    window.addEventListener('storage', update)
    window.addEventListener(STORAGE_EVENT, update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(STORAGE_EVENT, update)
    }
  }, [])

  return trackingConsent
}
