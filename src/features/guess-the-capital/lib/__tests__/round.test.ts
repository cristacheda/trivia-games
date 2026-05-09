import { describe, expect, it } from 'vitest'
import { getGuessTheCapitalDifficultyRule } from '@/features/guess-the-capital/constants'
import { computeCapitalSelectionWeight } from '@/features/guess-the-capital/data/countries'
import {
  capitalStateQuestionBank,
} from '@/features/guess-the-capital/data/states'
import {
  buildGuessTheCapitalDeck,
  buildGuessTheCapitalRound,
} from '@/features/guess-the-capital/lib/round'
import type { CapitalQuestionSource } from '@/features/guess-the-capital/types'

const buildSubject = (
  code: string,
  name: string,
  kind: 'country' | 'state',
  region: string,
  population: number,
  area: number,
  capital: string,
): CapitalQuestionSource => ({
  code,
  kind,
  name,
  region,
  subregion: region,
  population,
  area,
  capital,
  capitalAliases: [capital],
  weightModifier: 1,
})

describe('computeCapitalSelectionWeight', () => {
  it('pushes later difficulties away from Europe', () => {
    const romania = buildSubject(
      'RO',
      'Romania',
      'country',
      'Europe',
      19_000_000,
      238_391,
      'Bucharest',
    )
    const samoa = buildSubject(
      'WS',
      'Samoa',
      'country',
      'Oceania',
      222_000,
      2_842,
      'Apia',
    )

    expect(computeCapitalSelectionWeight(samoa, 'level-2')).toBeGreaterThan(
      computeCapitalSelectionWeight(romania, 'level-2'),
    )
    expect(computeCapitalSelectionWeight(romania, 'level-2')).toBeLessThan(
      computeCapitalSelectionWeight(romania, 'level-1'),
    )
  })
})

describe('buildGuessTheCapitalRound', () => {
  it('creates multiple-choice capital rounds with the configured option count', () => {
    const subjects = [
      buildSubject('RO', 'Romania', 'country', 'Europe', 19_000_000, 238_391, 'Bucharest'),
      buildSubject('BR', 'Brazil', 'country', 'Americas', 203_000_000, 8_515_767, 'Brasilia'),
      buildSubject('KE', 'Kenya', 'country', 'Africa', 55_000_000, 580_367, 'Nairobi'),
      buildSubject('US-AK', 'Alaska', 'state', 'Americas', 0, 0, 'Juneau'),
      buildSubject('US-HI', 'Hawaii', 'state', 'Americas', 0, 0, 'Honolulu'),
    ]

    const round = buildGuessTheCapitalRound(
      getGuessTheCapitalDifficultyRule('level-2'),
      subjects,
      () => 0,
    )

    expect(round).toHaveLength(subjects.length)
    expect(round.every((question) => question.options.length === 5)).toBe(true)
    expect(round.every((question) => question.options.includes(question.subject.capital))).toBe(
      true,
    )
  })

  it('uses only state capitals as options for state questions', () => {
    const stateCapitalSet = new Set(
      capitalStateQuestionBank.map((state) => state.capital),
    )
    const subjects = [
      buildSubject('US-AK', 'Alaska', 'state', 'Americas', 0, 0, 'Juneau'),
      buildSubject('US-HI', 'Hawaii', 'state', 'Americas', 0, 0, 'Honolulu'),
      buildSubject('US-CA', 'California', 'state', 'Americas', 0, 0, 'Sacramento'),
      buildSubject('US-CO', 'Colorado', 'state', 'Americas', 0, 0, 'Denver'),
      buildSubject('US-OR', 'Oregon', 'state', 'Americas', 0, 0, 'Salem'),
    ]

    const round = buildGuessTheCapitalRound(
      getGuessTheCapitalDifficultyRule('level-2'),
      subjects,
      () => 0,
    )

    expect(round).toHaveLength(subjects.length)
    expect(round.every((question) => question.options.length === 5)).toBe(true)
    expect(round.every((question) => question.options.includes(question.subject.capital))).toBe(
      true,
    )
    expect(
      round.every((question) =>
        question.options.every((option) => stateCapitalSet.has(option)),
      ),
    ).toBe(true)
  })

  it('creates free-text rounds without options', () => {
    const subjects = capitalStateQuestionBank.slice(0, 3)

    const round = buildGuessTheCapitalRound(
      getGuessTheCapitalDifficultyRule('level-3'),
      subjects,
      () => 0,
    )

    expect(round).toHaveLength(3)
    expect(round.every((question) => question.options.length === 0)).toBe(true)
  })
})

describe('buildGuessTheCapitalDeck', () => {
  it('returns all states without duplicates', () => {
    const deck = buildGuessTheCapitalDeck('state', () => 0)

    expect(deck).toHaveLength(capitalStateQuestionBank.length)
    expect(new Set(deck.map((state) => state.code)).size).toBe(
      capitalStateQuestionBank.length,
    )
  })
})
