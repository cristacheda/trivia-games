import { describe, expect, it } from 'vitest'
import { isAcceptableCountryAnswer } from '@/features/flag-quiz/lib/match'
import type { CountryQuestionSource } from '@/features/flag-quiz/types'

const romania: CountryQuestionSource = {
  code: 'RO',
  name: 'Romania',
  officialName: 'Romania',
  aliases: ['Romania', 'Rumania', 'Roumania', 'România'],
  region: 'Europe',
  subregion: 'Southeast Europe',
  population: 19_000_000,
  area: 238_391,
  flagEmoji: '🇷🇴',
  weightModifier: 1,
}

describe('isAcceptableCountryAnswer', () => {
  it('accepts close misspellings', () => {
    expect(isAcceptableCountryAnswer('Roumanai', romania)).toBe(true)
  })

  it('accepts diacritic variants', () => {
    expect(isAcceptableCountryAnswer('România', romania)).toBe(true)
  })

  it('rejects a different country', () => {
    expect(isAcceptableCountryAnswer('Bulgaria', romania)).toBe(false)
  })
})
