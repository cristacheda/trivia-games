import { describe, expect, it } from 'vitest'
import { getGuessTheArtistDifficultyRule } from '@/features/guess-the-artist/constants'
import { songQuestionBank } from '@/features/guess-the-artist/data/songs'
import { buildGuessTheArtistDeck, buildGuessTheArtistRound } from '@/features/guess-the-artist/lib/round'

describe('buildGuessTheArtistDeck', () => {
  it('builds a full weighted deck without duplicates', () => {
    const deck = buildGuessTheArtistDeck(() => 0, 'level-3')

    expect(deck).toHaveLength(songQuestionBank.length)
    expect(new Set(deck.map((song) => song.id)).size).toBe(songQuestionBank.length)
  })

  it('keeps song title + artist pairs unique in the catalog', () => {
    const uniquePairs = new Set(
      songQuestionBank.map((song) => `${song.songTitle}::${song.artistName}`),
    )

    expect(uniquePairs.size).toBe(songQuestionBank.length)
  })
})

describe('buildGuessTheArtistRound', () => {
  it('creates 20 questions with 3 options on level 1', () => {
    const round = buildGuessTheArtistRound(
      getGuessTheArtistDifficultyRule('level-1'),
      buildGuessTheArtistDeck(() => 0, 'level-1').slice(0, 20),
      () => 0,
    )

    expect(round).toHaveLength(20)
    expect(round.every((question) => question.options.length === 3)).toBe(true)
    expect(new Set(round.map((question) => question.subject.id)).size).toBe(20)
  })

  it('creates 5 options on level 2', () => {
    const round = buildGuessTheArtistRound(
      getGuessTheArtistDifficultyRule('level-2'),
      buildGuessTheArtistDeck(() => 0, 'level-2').slice(0, 1),
      () => 0,
    )

    expect(round[0].options).toHaveLength(5)
  })

  it('includes newly added songs in weighted deck generation', () => {
    const deckIds = new Set(buildGuessTheArtistDeck(() => 0, 'level-2').map((song) => song.id))

    expect(deckIds.has('galvanize')).toBe(true)
    expect(deckIds.has('gives-you-hell')).toBe(true)
    expect(deckIds.has('day-o')).toBe(true)
  })
})
