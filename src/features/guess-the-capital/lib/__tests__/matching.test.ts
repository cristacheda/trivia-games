import { describe, expect, it } from 'vitest'
import { isAcceptableCapitalAnswer } from '@/features/guess-the-capital/lib/match'
import type { CapitalQuestionSource } from '@/features/guess-the-capital/types'

const romania: CapitalQuestionSource = {
  code: 'RO',
  kind: 'country',
  name: 'Romania',
  region: 'Europe',
  subregion: 'Eastern Europe',
  population: 19_000_000,
  area: 238_391,
  capital: 'Bucharest',
  capitalAliases: ['Bucharest', 'Bucuresti', 'București'],
  weightModifier: 1,
}

const minnesota: CapitalQuestionSource = {
  code: 'US-MN',
  kind: 'state',
  name: 'Minnesota',
  region: 'Americas',
  subregion: 'North America',
  population: 0,
  area: 0,
  capital: 'Saint Paul',
  capitalAliases: ['Saint Paul', 'St Paul', 'St. Paul'],
  weightModifier: 1,
}

describe('isAcceptableCapitalAnswer', () => {
  it('accepts close misspellings', () => {
    expect(isAcceptableCapitalAnswer('Bucherest', romania)).toBe(true)
  })

  it('accepts diacritic variants', () => {
    expect(isAcceptableCapitalAnswer('București', romania)).toBe(true)
  })

  it('accepts common variants', () => {
    expect(isAcceptableCapitalAnswer('St. Paul', minnesota)).toBe(true)
  })

  it('rejects a different capital', () => {
    expect(isAcceptableCapitalAnswer('Budapest', romania)).toBe(false)
  })
})
