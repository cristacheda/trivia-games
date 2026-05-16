import { describe, expect, it } from 'vitest'
import {
  DEFAULT_QUESTION_COUNT,
  getCocktailRoundMix,
  getGeographyRoundSplit,
  normalizeQuestionCount,
} from '@/lib/question-count'

describe('question count helpers', () => {
  it('normalizes unsupported values to the default question count', () => {
    expect(normalizeQuestionCount(undefined)).toBe(DEFAULT_QUESTION_COUNT)
    expect(normalizeQuestionCount(25)).toBe(DEFAULT_QUESTION_COUNT)
  })

  it('keeps the 90/10 country-state split for geography games', () => {
    expect(getGeographyRoundSplit(10)).toEqual({ countryCount: 9, stateCount: 1 })
    expect(getGeographyRoundSplit(20)).toEqual({ countryCount: 18, stateCount: 2 })
    expect(getGeographyRoundSplit(30)).toEqual({ countryCount: 27, stateCount: 3 })
    expect(getGeographyRoundSplit(40)).toEqual({ countryCount: 36, stateCount: 4 })
  })

  it('scales cocktail obscure picks with the round size', () => {
    expect(getCocktailRoundMix(10)).toEqual({ obscureCount: 1, regularCount: 9 })
    expect(getCocktailRoundMix(20)).toEqual({ obscureCount: 1, regularCount: 19 })
    expect(getCocktailRoundMix(30)).toEqual({ obscureCount: 2, regularCount: 28 })
    expect(getCocktailRoundMix(40)).toEqual({ obscureCount: 2, regularCount: 38 })
  })
})
