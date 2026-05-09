import { describe, expect, it } from 'vitest'
import { isAcceptableArtistAnswer } from '@/features/guess-the-artist/lib/match'
import type { SongQuestionSource } from '@/features/guess-the-artist/types'

const subject: SongQuestionSource = {
  id: 'zitti-e-buoni',
  songTitle: 'Zitti e buoni',
  artistName: 'Måneskin',
  aliases: ['Maneskin', 'Måneskin'],
  era: '2020s',
  region: 'Europe',
  popularityTier: 'global',
  weightModifier: 1,
}

describe('isAcceptableArtistAnswer', () => {
  it('accepts close misspellings', () => {
    expect(isAcceptableArtistAnswer('Manskin', subject)).toBe(true)
  })

  it('accepts diacritic variants', () => {
    expect(isAcceptableArtistAnswer('Maneskin', subject)).toBe(true)
  })

  it('rejects different artist names', () => {
    expect(isAcceptableArtistAnswer('Stromae', subject)).toBe(false)
  })
})
