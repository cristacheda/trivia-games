import { describe, expect, it } from 'vitest'
import { getOutlineQuizDifficultyRule } from '@/features/outline-quiz/constants'
import {
  computeOutlineCountryWeight,
} from '@/features/outline-quiz/data/countries'
import { computeOutlineStateWeight } from '@/features/outline-quiz/data/states'
import { outlineQuestionBankByKind } from '@/features/outline-quiz/data/question-bank'
import {
  buildOutlineQuizDeck,
  buildOutlineQuizRoundFromSubjects,
  generateOutlineQuizRound,
} from '@/features/outline-quiz/lib/round'
import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

const buildCountry = (
  code: string,
  name: string,
  region: string,
  subregion: string,
  population: number,
  area: number,
): OutlineQuestionSource => ({
  code,
  kind: 'country',
  name,
  officialName: name,
  aliases: [name],
  region,
  subregion,
  population,
  area,
  familiarityBand: 'standard',
  flagEmoji: '🏳️',
  outlinePath: 'M0 0',
  outlineViewBox: '0 0 10 10',
  baseWeight: 1,
  hardWeight: 1,
})

describe('outline weighting', () => {
  it('pushes harder levels toward smaller non-European countries', () => {
    const romania = buildCountry(
      'RO',
      'Romania',
      'Europe',
      'Southeast Europe',
      19_000_000,
      238_391,
    )
    const samoa = buildCountry(
      'WS',
      'Samoa',
      'Oceania',
      'Polynesia',
      222_000,
      2_842,
    )

    expect(computeOutlineCountryWeight(samoa, 'level-2')).toBeGreaterThan(
      computeOutlineCountryWeight(romania, 'level-2'),
    )
  })

  it('pushes harder levels toward less familiar states', () => {
    expect(
      computeOutlineStateWeight(
        { name: 'Wyoming', subregion: 'Mountain', familiarityBand: 'niche' },
        'level-2',
      ),
    ).toBeGreaterThan(
      computeOutlineStateWeight(
        { name: 'California', subregion: 'Pacific', familiarityBand: 'common' },
        'level-2',
      ),
    )
  })
})

describe('generateOutlineQuizRound', () => {
  it('creates twenty unique questions with a country-state mix', () => {
    const round = generateOutlineQuizRound(getOutlineQuizDifficultyRule('level-1'))

    expect(round).toHaveLength(20)
    expect(new Set(round.map((question) => question.subject.code)).size).toBe(20)
    expect(round.filter((question) => question.subject.kind === 'country')).toHaveLength(18)
    expect(round.filter((question) => question.subject.kind === 'state')).toHaveLength(2)
    expect(round.every((question) => question.options.length === 3)).toBe(true)
  })

  it('keeps multiple-choice distractors within the same subject type', () => {
    const subject = outlineQuestionBankByKind.state[0]
    const round = buildOutlineQuizRoundFromSubjects(
      getOutlineQuizDifficultyRule('level-2'),
      [subject],
      () => 0,
    )

    expect(round[0].options).toHaveLength(5)
    expect(round[0].options.every((option) => option.kind === 'state')).toBe(true)
  })

  it('builds full weighted decks without duplicates', () => {
    const countryDeck = buildOutlineQuizDeck('country', 'level-3', () => 0)
    const stateDeck = buildOutlineQuizDeck('state', 'level-3', () => 0)

    expect(countryDeck).toHaveLength(outlineQuestionBankByKind.country.length)
    expect(new Set(countryDeck.map((country) => country.code)).size).toBe(
      outlineQuestionBankByKind.country.length,
    )
    expect(stateDeck).toHaveLength(outlineQuestionBankByKind.state.length)
    expect(new Set(stateDeck.map((state) => state.code)).size).toBe(
      outlineQuestionBankByKind.state.length,
    )
  })
})
