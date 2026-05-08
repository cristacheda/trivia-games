import { describe, expect, it } from 'vitest'
import { getDifficultyRule } from '@/features/flag-quiz/constants'
import { computeSelectionWeight } from '@/features/flag-quiz/data/countries'
import { generateFlagQuizRound } from '@/features/flag-quiz/lib/round'
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
  it('creates ten unique questions for level 1', () => {
    const round = generateFlagQuizRound(getDifficultyRule('level-1'))

    expect(round).toHaveLength(10)
    expect(new Set(round.map((question) => question.country.code)).size).toBe(10)
    expect(round.every((question) => question.options.length === 5)).toBe(true)
  })
})
