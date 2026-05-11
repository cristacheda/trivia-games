import { FLAG_QUIZ_GAME_ID, FLAG_QUIZ_QUESTIONS_PER_ROUND } from '@/features/flag-quiz/constants'
import {
  flagQuestionBank,
} from '@/features/flag-quiz/data/countries'
import { buildFlagQuizQuestionDeck } from '@/features/flag-quiz/lib/round'
import {
  GUESS_THE_ARTIST_GAME_ID,
  GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
} from '@/features/guess-the-artist/constants'
import {
  songQuestionBank,
  songQuestionBankById,
} from '@/features/guess-the-artist/data/songs'
import { buildGuessTheArtistDeck } from '@/features/guess-the-artist/lib/round'
import {
  GUESS_THE_CAPITAL_GAME_ID,
} from '@/features/guess-the-capital/constants'
import {
  capitalCountryQuestionBank,
  capitalCountryQuestionBankByCode,
} from '@/features/guess-the-capital/data/countries'
import {
  capitalStateQuestionBank,
  capitalStateQuestionBankByCode,
} from '@/features/guess-the-capital/data/states'
import { buildGuessTheCapitalDeck } from '@/features/guess-the-capital/lib/round'
import {
  GUESS_THE_COCKTAIL_GAME_ID,
  GUESS_THE_COCKTAIL_OBSCURE_PER_ROUND,
  GUESS_THE_COCKTAIL_REGULAR_PER_ROUND,
} from '@/features/guess-the-cocktail/constants'
import {
  cocktailQuestionBank,
  cocktailQuestionBankById,
} from '@/features/guess-the-cocktail/data/cocktails'
import {
  buildGuessTheCocktailObscureDeck,
  buildGuessTheCocktailRegularDeck,
} from '@/features/guess-the-cocktail/lib/round'
import { GUESS_THE_CURRENCY_GAME_ID } from '@/features/guess-the-currency/constants'
import {
  currencyQuestionBank,
  currencyQuestionBankByCode,
} from '@/features/guess-the-currency/data/countries'
import { buildGuessTheCurrencyDeck } from '@/features/guess-the-currency/lib/round'
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
import {
  getGameStats,
  normalizeArtistDeck,
  normalizeCapitalDeck,
  normalizeCocktailDeck,
  normalizeCountryDeck,
  normalizeCurrencyDeck,
  normalizeOutlineDeck,
  readAppState,
  writeAppState,
} from '@/lib/storage'
import type {
  ArtistDeckProgress,
  CapitalDeckProgress,
  CocktailDeckProgress,
  CountryDeckProgress,
  CurrencyDeckProgress,
  DifficultyId,
  GameId,
  GameLocalStats,
  OutlineDeckProgress,
} from '@/types/game'

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

function updateGameDeck(gameId: GameId, nextStats: Partial<GameLocalStats>) {
  const state = readAppState()

  writeAppState({
    ...state,
    games: {
      ...state.games,
      [gameId]: {
        ...createDefaultStats(),
        ...state.games[gameId],
        ...nextStats,
      },
    },
  })
}

function filterCodes<T extends string>(codes: string[], validCodes: Set<T>) {
  return codes.filter((code): code is T => validCodes.has(code as T))
}

export function getFlagQuizCountryDeck(): CountryDeckProgress {
  return getGameStats(FLAG_QUIZ_GAME_ID).countryDeck ?? normalizeCountryDeck(null)
}

export function setFlagQuizCountryDeck(countryDeck: CountryDeckProgress) {
  const normalized = normalizeCountryDeck(countryDeck)
  const validCodes = new Set(flagQuestionBank.map((country) => country.code))

  updateGameDeck(FLAG_QUIZ_GAME_ID, {
    countryDeck: {
      orderedCountryCodes: filterCodes(normalized.orderedCountryCodes, validCodes),
      nextIndex: normalized.nextIndex,
    },
  })
}

export function reserveFlagQuizCountries(
  totalQuestions: number = FLAG_QUIZ_QUESTIONS_PER_ROUND,
  random: () => number = Math.random,
): string[] {
  const currentDeck = getFlagQuizCountryDeck()
  let orderedCountryCodes = [...currentDeck.orderedCountryCodes]
  let nextIndex = currentDeck.nextIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedCountryCodes.length === 0 || nextIndex >= orderedCountryCodes.length) {
      orderedCountryCodes = buildFlagQuizQuestionDeck(random).map((country) => country.code)
      nextIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const remainingCodes = orderedCountryCodes.slice(nextIndex)
    const nextCodes = remainingCodes.slice(0, remainingSlots)

    selectedCodes.push(...nextCodes)
    nextIndex += nextCodes.length
  }

  setFlagQuizCountryDeck({ orderedCountryCodes, nextIndex })

  return selectedCodes
}

export function getGuessTheCapitalDeck(): CapitalDeckProgress {
  return getGameStats(GUESS_THE_CAPITAL_GAME_ID).capitalDeck ?? normalizeCapitalDeck(null)
}

export function setGuessTheCapitalDeck(capitalDeck: CapitalDeckProgress) {
  const normalized = normalizeCapitalDeck(capitalDeck)
  const validCountryCodes = new Set(capitalCountryQuestionBank.map((country) => country.code))
  const validStateCodes = new Set(capitalStateQuestionBank.map((state) => state.code))

  updateGameDeck(GUESS_THE_CAPITAL_GAME_ID, {
    capitalDeck: {
      orderedCountryCodes: filterCodes(normalized.orderedCountryCodes, validCountryCodes),
      nextCountryIndex: normalized.nextCountryIndex,
      orderedStateCodes: filterCodes(normalized.orderedStateCodes, validStateCodes),
      nextStateIndex: normalized.nextStateIndex,
    },
  })
}

function reserveCapitalCountryCodes(
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
      orderedCountryCodes = buildGuessTheCapitalDeck('country', random, difficultyId).map(
        (country) => country.code,
      )
      nextCountryIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const nextCodes = orderedCountryCodes.slice(nextCountryIndex, nextCountryIndex + remainingSlots)

    selectedCodes.push(...nextCodes)
    nextCountryIndex += nextCodes.length
  }

  return { orderedCountryCodes, nextCountryIndex, selectedCodes }
}

function reserveCapitalStateCodes(
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
      orderedStateCodes = buildGuessTheCapitalDeck('state', random, difficultyId).map(
        (state) => state.code,
      )
      nextStateIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const nextCodes = orderedStateCodes.slice(nextStateIndex, nextStateIndex + remainingSlots)

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
  } = reserveCapitalCountryCodes(totalCountries, currentDeck, difficultyId, random)
  const {
    orderedStateCodes,
    nextStateIndex,
    selectedCodes: stateCodes,
  } = reserveCapitalStateCodes(totalStates, currentDeck, difficultyId, random)

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
  return getGameStats(OUTLINE_QUIZ_GAME_ID).outlineDeck ?? normalizeOutlineDeck(null)
}

export function setOutlineQuizDeck(outlineDeck: OutlineDeckProgress) {
  const normalized = normalizeOutlineDeck(outlineDeck)
  const validCountryCodes = new Set(outlineCountryQuestionBank.map((country) => country.code))
  const validStateCodes = new Set(outlineStateQuestionBank.map((state) => state.code))

  updateGameDeck(OUTLINE_QUIZ_GAME_ID, {
    outlineDeck: {
      orderedCountryCodes: filterCodes(normalized.orderedCountryCodes, validCountryCodes),
      nextCountryIndex: normalized.nextCountryIndex,
      orderedStateCodes: filterCodes(normalized.orderedStateCodes, validStateCodes),
      nextStateIndex: normalized.nextStateIndex,
    },
  })
}

export function getGuessTheArtistDeck(): ArtistDeckProgress {
  return getGameStats(GUESS_THE_ARTIST_GAME_ID).artistDeck ?? normalizeArtistDeck(null)
}

export function setGuessTheArtistDeck(artistDeck: ArtistDeckProgress) {
  const normalized = normalizeArtistDeck(artistDeck)
  const validSongIds = new Set(songQuestionBank.map((song) => song.id))

  updateGameDeck(GUESS_THE_ARTIST_GAME_ID, {
    artistDeck: {
      orderedSongIds: filterCodes(normalized.orderedSongIds, validSongIds),
      nextIndex: normalized.nextIndex,
    },
  })
}

export function reserveGuessTheArtistSongs(
  totalQuestions: number = GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  const currentDeck = getGuessTheArtistDeck()
  let orderedSongIds = [...currentDeck.orderedSongIds]
  let nextIndex = currentDeck.nextIndex
  const selectedSongIds: string[] = []

  while (selectedSongIds.length < totalQuestions) {
    if (orderedSongIds.length === 0 || nextIndex >= orderedSongIds.length) {
      orderedSongIds = buildGuessTheArtistDeck(random, difficultyId).map((song) => song.id)
      nextIndex = 0
    }

    const remainingSlots = totalQuestions - selectedSongIds.length
    const nextSongIds = orderedSongIds.slice(nextIndex, nextIndex + remainingSlots)

    selectedSongIds.push(...nextSongIds)
    nextIndex += nextSongIds.length
  }

  setGuessTheArtistDeck({ orderedSongIds, nextIndex })

  return selectedSongIds.map((songId) => {
    const song = songQuestionBankById.get(songId)
    if (!song) {
      throw new Error(`Unknown artist quiz song id: ${songId}`)
    }
    return song
  })
}

export function getGuessTheCurrencyDeck(): CurrencyDeckProgress {
  return getGameStats(GUESS_THE_CURRENCY_GAME_ID).currencyDeck ?? normalizeCurrencyDeck(null)
}

export function setGuessTheCurrencyDeck(currencyDeck: CurrencyDeckProgress) {
  const normalized = normalizeCurrencyDeck(currencyDeck)
  const validCodes = new Set(currencyQuestionBank.map((country) => country.code))

  updateGameDeck(GUESS_THE_CURRENCY_GAME_ID, {
    currencyDeck: {
      orderedCountryCodes: filterCodes(normalized.orderedCountryCodes, validCodes),
      nextIndex: normalized.nextIndex,
    },
  })
}

export function reserveGuessTheCurrencyCountries(
  totalQuestions: number,
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  const currentDeck = getGuessTheCurrencyDeck()
  let orderedCountryCodes = [...currentDeck.orderedCountryCodes]
  let nextIndex = currentDeck.nextIndex
  const selectedCodes: string[] = []

  while (selectedCodes.length < totalQuestions) {
    if (orderedCountryCodes.length === 0 || nextIndex >= orderedCountryCodes.length) {
      orderedCountryCodes = buildGuessTheCurrencyDeck(random, difficultyId).map(
        (country) => country.code,
      )
      nextIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const nextCodes = orderedCountryCodes.slice(nextIndex, nextIndex + remainingSlots)

    selectedCodes.push(...nextCodes)
    nextIndex += nextCodes.length
  }

  setGuessTheCurrencyDeck({ orderedCountryCodes, nextIndex })

  return selectedCodes.map((code) => {
    const country = currencyQuestionBankByCode.get(code)
    if (!country) {
      throw new Error(`Unknown currency quiz country code: ${code}`)
    }
    return country
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
      orderedCountryCodes = buildOutlineQuizDeck('country', difficultyId, random).map(
        (country) => country.code,
      )
      nextCountryIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const nextCodes = orderedCountryCodes.slice(nextCountryIndex, nextCountryIndex + remainingSlots)

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
      orderedStateCodes = buildOutlineQuizDeck('state', difficultyId, random).map(
        (state) => state.code,
      )
      nextStateIndex = 0
    }

    const remainingSlots = totalQuestions - selectedCodes.length
    const nextCodes = orderedStateCodes.slice(nextStateIndex, nextStateIndex + remainingSlots)

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

export function getGuessTheCocktailDeck(): CocktailDeckProgress {
  return getGameStats(GUESS_THE_COCKTAIL_GAME_ID).cocktailDeck ?? normalizeCocktailDeck(null)
}

export function setGuessTheCocktailDeck(cocktailDeck: CocktailDeckProgress) {
  const normalized = normalizeCocktailDeck(cocktailDeck)
  const validIds = new Set(cocktailQuestionBank.map((cocktail) => cocktail.id))

  updateGameDeck(GUESS_THE_COCKTAIL_GAME_ID, {
    cocktailDeck: {
      orderedRegularIds: filterCodes(normalized.orderedRegularIds, validIds),
      nextRegularIndex: normalized.nextRegularIndex,
      orderedObscureIds: filterCodes(normalized.orderedObscureIds, validIds),
      nextObscureIndex: normalized.nextObscureIndex,
    },
  })
}

export function reserveGuessTheCocktailCocktails(
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  const currentDeck = getGuessTheCocktailDeck()
  let orderedRegularIds = [...currentDeck.orderedRegularIds]
  let nextRegularIndex = currentDeck.nextRegularIndex
  const selectedRegularIds: string[] = []

  while (selectedRegularIds.length < GUESS_THE_COCKTAIL_REGULAR_PER_ROUND) {
    if (orderedRegularIds.length === 0 || nextRegularIndex >= orderedRegularIds.length) {
      orderedRegularIds = buildGuessTheCocktailRegularDeck(random, difficultyId).map(
        (cocktail) => cocktail.id,
      )
      nextRegularIndex = 0
    }

    const remainingSlots = GUESS_THE_COCKTAIL_REGULAR_PER_ROUND - selectedRegularIds.length
    const nextIds = orderedRegularIds.slice(
      nextRegularIndex,
      nextRegularIndex + remainingSlots,
    )
    selectedRegularIds.push(...nextIds)
    nextRegularIndex += nextIds.length
  }

  let orderedObscureIds = [...currentDeck.orderedObscureIds]
  let nextObscureIndex = currentDeck.nextObscureIndex
  const selectedObscureIds: string[] = []

  while (selectedObscureIds.length < GUESS_THE_COCKTAIL_OBSCURE_PER_ROUND) {
    if (orderedObscureIds.length === 0 || nextObscureIndex >= orderedObscureIds.length) {
      orderedObscureIds = buildGuessTheCocktailObscureDeck(random).map(
        (cocktail) => cocktail.id,
      )
      nextObscureIndex = 0
    }

    const remainingSlots = GUESS_THE_COCKTAIL_OBSCURE_PER_ROUND - selectedObscureIds.length
    const nextIds = orderedObscureIds.slice(
      nextObscureIndex,
      nextObscureIndex + remainingSlots,
    )
    selectedObscureIds.push(...nextIds)
    nextObscureIndex += nextIds.length
  }

  setGuessTheCocktailDeck({
    orderedRegularIds,
    nextRegularIndex,
    orderedObscureIds,
    nextObscureIndex,
  })

  return [...selectedRegularIds, ...selectedObscureIds].map((id) => {
    const cocktail = cocktailQuestionBankById.get(id)
    if (!cocktail) {
      throw new Error(`Unknown cocktail quiz id: ${id}`)
    }
    return cocktail
  })
}
