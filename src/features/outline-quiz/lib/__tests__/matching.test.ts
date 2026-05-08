import { describe, expect, it } from 'vitest'
import { isAcceptableOutlineAnswer } from '@/features/outline-quiz/lib/match'
import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

const romania: OutlineQuestionSource = {
  code: 'RO',
  kind: 'country',
  name: 'Romania',
  officialName: 'Romania',
  aliases: ['Romania', 'Rumania', 'Roumania', 'România'],
  region: 'Europe',
  subregion: 'Southeast Europe',
  population: 19_000_000,
  area: 238_391,
  familiarityBand: 'common',
  flagEmoji: '🇷🇴',
  outlinePath: 'M0 0',
  outlineViewBox: '0 0 10 10',
  baseWeight: 1,
  hardWeight: 1,
}

const westVirginia: OutlineQuestionSource = {
  code: 'US-WV',
  kind: 'state',
  name: 'West Virginia',
  officialName: 'West Virginia State',
  aliases: ['West Virginia', 'State of West Virginia'],
  region: 'Americas',
  subregion: 'South Atlantic',
  population: null,
  area: null,
  familiarityBand: 'niche',
  flagEmoji: '',
  outlinePath: 'M0 0',
  outlineViewBox: '0 0 10 10',
  baseWeight: 1,
  hardWeight: 1,
}

describe('isAcceptableOutlineAnswer', () => {
  it('accepts close misspellings for countries', () => {
    expect(isAcceptableOutlineAnswer('Roumanai', romania)).toBe(true)
  })

  it('accepts diacritic variants', () => {
    expect(isAcceptableOutlineAnswer('România', romania)).toBe(true)
  })

  it('accepts close misspellings for states', () => {
    expect(isAcceptableOutlineAnswer('West Virgina', westVirginia)).toBe(true)
  })

  it('rejects different places', () => {
    expect(isAcceptableOutlineAnswer('Bulgaria', romania)).toBe(false)
  })
})
