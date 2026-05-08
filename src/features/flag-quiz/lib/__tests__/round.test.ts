import { describe, expect, it } from 'vitest'
import {
  FLAG_QUIZ_QUESTIONS_PER_ROUND,
  getDifficultyRule,
} from '@/features/flag-quiz/constants'
import { computeSelectionWeight } from '@/features/flag-quiz/data/countries'
import {
  buildFlagQuizRoundFromCountries,
  generateFlagQuizRound,
} from '@/features/flag-quiz/lib/round'
import type { CountryQuestionSource } from '@/features/flag-quiz/types'

const buildCountry = (
  name: string,
  region: string,
  population: number,
  area: number,
): CountryQuestionSource => ({
  code: name.slice(0, 2).toUpperCase(),
  name,
  officialName: name,
  aliases: [name],
  region,
  subregion: region,
  population,
  area,
  flagEmoji: '🏳️',
  weightModifier: 1,
})

describe('computeSelectionWeight', () => {
  it('de-prioritizes Europe and boosts small countries', () => {
    const romania = buildCountry('Romania', 'Europe', 19_000_000, 238_391)
    const samoa = buildCountry('Samoa', 'Oceania', 222_000, 2_842)

    expect(computeSelectionWeight(samoa)).toBeGreaterThan(
      computeSelectionWeight(romania),
    )
  })
})

describe('generateFlagQuizRound', () => {
  it('creates twenty unique questions for level 1', () => {
    const round = generateFlagQuizRound(getDifficultyRule('level-1'))

    expect(round).toHaveLength(FLAG_QUIZ_QUESTIONS_PER_ROUND)
    expect(new Set(round.map((question) => question.country.code)).size).toBe(
      FLAG_QUIZ_QUESTIONS_PER_ROUND,
    )
    expect(round.every((question) => question.options.length === 3)).toBe(true)
  })

  it('builds a round from a provided country sequence', () => {
    const countries = [
      buildCountry('Brazil', 'Americas', 203_000_000, 8_515_767),
      buildCountry('Japan', 'Asia', 123_000_000, 377_975),
      buildCountry('Kenya', 'Africa', 55_000_000, 580_367),
    ]

    const round = buildFlagQuizRoundFromCountries(
      getDifficultyRule('level-3'),
      countries,
      () => 0,
    )

    expect(round).toHaveLength(3)
    expect(round.map((question) => question.country.code)).toEqual(
      countries.map((country) => country.code),
    )
    expect(round.every((question) => question.options.length === 0)).toBe(true)
  })
})
