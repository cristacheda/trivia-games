import { beforeEach, describe, expect, it } from 'vitest'
import { FLAG_QUIZ_QUESTIONS_PER_ROUND } from '@/features/flag-quiz/constants'
import { flagQuestionBank } from '@/features/flag-quiz/data/countries'
import {
  GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
  GUESS_THE_CAPITAL_STATES_PER_ROUND,
} from '@/features/guess-the-capital/constants'
import { capitalCountryQuestionBank } from '@/features/guess-the-capital/data/countries'
import { capitalStateQuestionBank } from '@/features/guess-the-capital/data/states'
import {
  OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
  OUTLINE_QUIZ_STATES_PER_ROUND,
} from '@/features/outline-quiz/constants'
import { outlineCountryQuestionBank } from '@/features/outline-quiz/data/countries'
import { outlineStateQuestionBank } from '@/features/outline-quiz/data/states'
import {
  GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
} from '@/features/guess-the-artist/constants'
import {
  songQuestionBank,
} from '@/features/guess-the-artist/data/songs'
import {
  STORAGE_VERSION,
  getAppPreferences,
  getPlayerProfile,
  getGameStats,
  getTrackingConsent,
  readAppState,
  recordRoundResult,
  setDisplayName,
  setQuestionCount,
  setTrackingConsent,
  setSoundEnabled,
  setLastDifficulty,
} from '@/lib/storage'
import { DEFAULT_QUESTION_COUNT } from '@/lib/question-count'
import {
  getFlagQuizCountryDeck,
  getGuessTheArtistDeck,
  getGuessTheCapitalDeck,
  getOutlineQuizDeck,
  reserveFlagQuizCountries,
  reserveGuessTheArtistSongs,
  reserveGuessTheCapitalSubjects,
  reserveOutlineQuizSubjects,
  setFlagQuizCountryDeck,
  setGuessTheArtistDeck,
  setGuessTheCapitalDeck,
  setOutlineQuizDeck,
} from '@/lib/storage-decks'

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
    expect(state.games['flag-quiz']?.roundsPlayed).toBe(0)
    expect(state.games['flag-quiz']?.questionCount).toBe(DEFAULT_QUESTION_COUNT)
    expect(state.games['flag-quiz']?.countryDeck).toEqual({
      orderedCountryCodes: [],
      nextIndex: 0,
    })
    expect(state.games['flag-quiz']?.capitalDeck).toBeNull()
    expect(state.games['flag-quiz']?.outlineDeck).toBeNull()
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
    expect(state.games['flag-quiz']?.roundsPlayed).toBe(0)
    expect(state.games['flag-quiz']?.questionCount).toBe(DEFAULT_QUESTION_COUNT)
    expect(state.games['flag-quiz']?.countryDeck).toEqual({
      orderedCountryCodes: [],
      nextIndex: 0,
    })
    expect(state.games['flag-quiz']?.capitalDeck).toBeNull()
    expect(state.games['flag-quiz']?.outlineDeck).toBeNull()
    expect(state.preferences.soundEnabled).toBe(false)
  })

  it('migrates version 3 state and initializes capital deck progress', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 3,
        playerId: 'player-3',
        games: {
          'guess-the-capital': {
            highScore: {
              score: 22,
              achievedAt: '2026-05-08T20:00:00.000Z',
              difficultyId: 'level-2',
            },
            recentResult: null,
            lastDifficulty: 'level-2',
          },
        },
        preferences: {
          soundEnabled: true,
        },
      }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.games['guess-the-capital']?.highScore?.score).toBe(22)
    expect(state.games['guess-the-capital']?.questionCount).toBe(DEFAULT_QUESTION_COUNT)
    expect(state.games['guess-the-capital']?.capitalDeck).toEqual({
      orderedCountryCodes: [],
      nextCountryIndex: 0,
      orderedStateCodes: [],
      nextStateIndex: 0,
    })
    expect(state.games['guess-the-capital']?.outlineDeck).toBeNull()
  })

  it('migrates version 4 state and initializes outline deck progress', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 4,
        playerId: 'player-4',
        games: {
          'outline-quiz': {
            highScore: {
              score: 19,
              achievedAt: '2026-05-08T20:00:00.000Z',
              difficultyId: 'level-2',
            },
            recentResult: null,
            lastDifficulty: 'level-2',
          },
        },
        preferences: {
          soundEnabled: true,
        },
      }),
    )

    const state = readAppState()

    expect(state.version).toBe(STORAGE_VERSION)
    expect(state.games['outline-quiz']?.highScore?.score).toBe(19)
    expect(state.games['outline-quiz']?.questionCount).toBe(DEFAULT_QUESTION_COUNT)
    expect(state.games['outline-quiz']?.outlineDeck).toEqual({
      orderedCountryCodes: [],
      nextCountryIndex: 0,
      orderedStateCodes: [],
      nextStateIndex: 0,
    })
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
    expect(stats.roundsPlayed).toBe(1)
    expect(stats.recentResult?.totalScore).toBe(17)
  })

  it('stores the sound preference', () => {
    setSoundEnabled(false)

    expect(getAppPreferences().soundEnabled).toBe(false)
  })

  it('stores the tracking consent preference', () => {
    setTrackingConsent('granted')

    expect(getTrackingConsent()).toBe('granted')
    expect(getAppPreferences().trackingConsent).toBe('granted')
  })

  it('stores the leaderboard nickname locally', () => {
    setDisplayName('  QuizMaster  ')

    expect(getPlayerProfile().displayName).toBe('QuizMaster')
  })

  it('defaults old saved state to a 20-question round size', () => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 12,
        playerId: 'player-12',
        games: {
          'guess-the-artist': {
            highScore: {
              score: 30,
              achievedAt: '2026-05-12T20:00:00.000Z',
              difficultyId: 'level-2',
            },
          },
        },
      }),
    )

    expect(getGameStats('guess-the-artist').questionCount).toBe(DEFAULT_QUESTION_COUNT)
  })

  it('stores the selected round size per game', () => {
    setQuestionCount('flag-quiz', 40)

    expect(getGameStats('flag-quiz').questionCount).toBe(40)
  })

  it('stores capital game results and high score', () => {
    setLastDifficulty('guess-the-capital', 'level-2')
    const saved = recordRoundResult({
      gameId: 'guess-the-capital',
      difficultyId: 'level-2',
      totalScore: 24,
      correctAnswers: 12,
      totalQuestions:
        GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND + GUESS_THE_CAPITAL_STATES_PER_ROUND,
      completedAt: '2026-05-08T20:00:00.000Z',
    })

    const stats = getGameStats('guess-the-capital')

    expect(saved.previousBestScore).toBeNull()
    expect(saved.beatHighScore).toBe(true)
    expect(stats.lastDifficulty).toBe('level-2')
    expect(stats.highScore?.score).toBe(24)
    expect(stats.roundsPlayed).toBe(1)
    expect(stats.recentResult?.totalScore).toBe(24)
  })

  it('stores outline game results and high score', () => {
    setLastDifficulty('outline-quiz', 'level-2')
    const saved = recordRoundResult({
      gameId: 'outline-quiz',
      difficultyId: 'level-2',
      totalScore: 27,
      correctAnswers: 13,
      totalQuestions:
        OUTLINE_QUIZ_COUNTRIES_PER_ROUND + OUTLINE_QUIZ_STATES_PER_ROUND,
      completedAt: '2026-05-08T20:00:00.000Z',
    })

    const stats = getGameStats('outline-quiz')

    expect(saved.previousBestScore).toBeNull()
    expect(saved.beatHighScore).toBe(true)
    expect(stats.lastDifficulty).toBe('level-2')
    expect(stats.highScore?.score).toBe(27)
    expect(stats.roundsPlayed).toBe(1)
    expect(stats.recentResult?.totalScore).toBe(27)
  })

  it('stores artist game results and high score', () => {
    setLastDifficulty('guess-the-artist', 'level-2')
    const saved = recordRoundResult({
      gameId: 'guess-the-artist',
      difficultyId: 'level-2',
      totalScore: 28,
      correctAnswers: 14,
      totalQuestions: GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      completedAt: '2026-05-08T20:00:00.000Z',
    })

    const stats = getGameStats('guess-the-artist')

    expect(saved.previousBestScore).toBeNull()
    expect(saved.beatHighScore).toBe(true)
    expect(stats.lastDifficulty).toBe('level-2')
    expect(stats.highScore?.score).toBe(28)
    expect(stats.roundsPlayed).toBe(1)
    expect(stats.recentResult?.totalScore).toBe(28)
  })

  it('increments games played without replacing the stored high score', () => {
    recordRoundResult({
      gameId: 'flag-quiz',
      difficultyId: 'level-2',
      totalScore: 18,
      correctAnswers: 9,
      totalQuestions: FLAG_QUIZ_QUESTIONS_PER_ROUND,
      completedAt: '2026-05-08T20:00:00.000Z',
    })

    recordRoundResult({
      gameId: 'flag-quiz',
      difficultyId: 'level-1',
      totalScore: 11,
      correctAnswers: 11,
      totalQuestions: FLAG_QUIZ_QUESTIONS_PER_ROUND,
      completedAt: '2026-05-09T20:00:00.000Z',
    })

    const stats = getGameStats('flag-quiz')

    expect(stats.roundsPlayed).toBe(2)
    expect(stats.highScore?.score).toBe(18)
    expect(stats.recentResult?.totalScore).toBe(11)
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

  it('reserves unique artist quiz songs across consecutive rounds', () => {
    const orderedSongIds = songQuestionBank
      .slice(0, GUESS_THE_ARTIST_QUESTIONS_PER_ROUND * 2)
      .map((song) => song.id)

    setGuessTheArtistDeck({
      orderedSongIds,
      nextIndex: 0,
    })

    const firstRound = reserveGuessTheArtistSongs(
      GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      'level-2',
    ).map((song) => song.id)
    const secondRound = reserveGuessTheArtistSongs(
      GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      'level-2',
    ).map((song) => song.id)

    expect(firstRound).toEqual(
      orderedSongIds.slice(0, GUESS_THE_ARTIST_QUESTIONS_PER_ROUND),
    )
    expect(secondRound).toEqual(
      orderedSongIds.slice(
        GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
        GUESS_THE_ARTIST_QUESTIONS_PER_ROUND * 2,
      ),
    )
    expect(new Set([...firstRound, ...secondRound]).size).toBe(
      GUESS_THE_ARTIST_QUESTIONS_PER_ROUND * 2,
    )
    expect(getGuessTheArtistDeck()).toEqual({
      orderedSongIds,
      nextIndex: GUESS_THE_ARTIST_QUESTIONS_PER_ROUND * 2,
    })
  })

  it('drops stale artist quiz song ids from saved deck progress', () => {
    const validSongIds = songQuestionBank
      .slice(0, GUESS_THE_ARTIST_QUESTIONS_PER_ROUND)
      .map((song) => song.id)

    setGuessTheArtistDeck({
      orderedSongIds: ['bailando', ...validSongIds],
      nextIndex: 0,
    })

    const roundSongIds = reserveGuessTheArtistSongs(
      GUESS_THE_ARTIST_QUESTIONS_PER_ROUND,
      'level-2',
    ).map((song) => song.id)

    expect(roundSongIds).toEqual(validSongIds)
    expect(getGuessTheArtistDeck()).toEqual({
      orderedSongIds: validSongIds,
      nextIndex: validSongIds.length,
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

  it('reserves unique capital quiz countries and states across consecutive rounds', () => {
    const orderedCountryCodes = capitalCountryQuestionBank
      .slice(0, GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND * 2)
      .map((country) => country.code)
    const orderedStateCodes = capitalStateQuestionBank
      .slice(0, GUESS_THE_CAPITAL_STATES_PER_ROUND * 2)
      .map((state) => state.code)

    setGuessTheCapitalDeck({
      orderedCountryCodes,
      nextCountryIndex: 0,
      orderedStateCodes,
      nextStateIndex: 0,
    })

    const firstRound = reserveGuessTheCapitalSubjects(
      GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
      GUESS_THE_CAPITAL_STATES_PER_ROUND,
      'level-2',
    )
    const secondRound = reserveGuessTheCapitalSubjects(
      GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
      GUESS_THE_CAPITAL_STATES_PER_ROUND,
      'level-3',
    )

    expect(firstRound.countries.map((country) => country.code)).toEqual(
      orderedCountryCodes.slice(0, GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND),
    )
    expect(firstRound.states.map((state) => state.code)).toEqual(
      orderedStateCodes.slice(0, GUESS_THE_CAPITAL_STATES_PER_ROUND),
    )
    expect(secondRound.countries.map((country) => country.code)).toEqual(
      orderedCountryCodes.slice(
        GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND,
        GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND * 2,
      ),
    )
    expect(secondRound.states.map((state) => state.code)).toEqual(
      orderedStateCodes.slice(
        GUESS_THE_CAPITAL_STATES_PER_ROUND,
        GUESS_THE_CAPITAL_STATES_PER_ROUND * 2,
      ),
    )
    expect(getGuessTheCapitalDeck()).toEqual({
      orderedCountryCodes,
      nextCountryIndex: GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND * 2,
      orderedStateCodes,
      nextStateIndex: GUESS_THE_CAPITAL_STATES_PER_ROUND * 2,
    })
  })

  it('reserves unique outline quiz countries and states across consecutive rounds', () => {
    const orderedCountryCodes = outlineCountryQuestionBank
      .slice(0, OUTLINE_QUIZ_COUNTRIES_PER_ROUND * 2)
      .map((country) => country.code)
    const orderedStateCodes = outlineStateQuestionBank
      .slice(0, OUTLINE_QUIZ_STATES_PER_ROUND * 2)
      .map((state) => state.code)

    setOutlineQuizDeck({
      orderedCountryCodes,
      nextCountryIndex: 0,
      orderedStateCodes,
      nextStateIndex: 0,
    })

    const firstRound = reserveOutlineQuizSubjects(
      OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
      OUTLINE_QUIZ_STATES_PER_ROUND,
      'level-2',
    )
    const secondRound = reserveOutlineQuizSubjects(
      OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
      OUTLINE_QUIZ_STATES_PER_ROUND,
      'level-3',
    )

    expect(firstRound.countries.map((country) => country.code)).toEqual(
      orderedCountryCodes.slice(0, OUTLINE_QUIZ_COUNTRIES_PER_ROUND),
    )
    expect(firstRound.states.map((state) => state.code)).toEqual(
      orderedStateCodes.slice(0, OUTLINE_QUIZ_STATES_PER_ROUND),
    )
    expect(secondRound.countries.map((country) => country.code)).toEqual(
      orderedCountryCodes.slice(
        OUTLINE_QUIZ_COUNTRIES_PER_ROUND,
        OUTLINE_QUIZ_COUNTRIES_PER_ROUND * 2,
      ),
    )
    expect(secondRound.states.map((state) => state.code)).toEqual(
      orderedStateCodes.slice(
        OUTLINE_QUIZ_STATES_PER_ROUND,
        OUTLINE_QUIZ_STATES_PER_ROUND * 2,
      ),
    )
    expect(getOutlineQuizDeck()).toEqual({
      orderedCountryCodes,
      nextCountryIndex: OUTLINE_QUIZ_COUNTRIES_PER_ROUND * 2,
      orderedStateCodes,
      nextStateIndex: OUTLINE_QUIZ_STATES_PER_ROUND * 2,
    })
  })
})
