import type { DifficultyRule } from '@/types/game'
import { flagQuestionBank } from '@/features/flag-quiz/data/countries'
import type {
  CountryQuestionSource,
  FlagQuizQuestion,
} from '@/features/flag-quiz/types'

export function sampleWeightedUnique<T extends { weightModifier: number }>(
  values: T[],
  count: number,
  random: () => number,
) {
  const pool = [...values]
  const result: T[] = []

  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, value) => sum + value.weightModifier, 0)
    let roll = random() * totalWeight
    let selectedIndex = 0

    for (let index = 0; index < pool.length; index += 1) {
      roll -= pool[index].weightModifier
      if (roll <= 0) {
        selectedIndex = index
        break
      }
    }

    const [selected] = pool.splice(selectedIndex, 1)
    result.push(selected)
  }

  return result
}

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function buildOptions(
  country: CountryQuestionSource,
  optionCount: number,
  random: () => number,
) {
  const distractors = shuffle(
    flagQuestionBank.filter((candidate) => candidate.code !== country.code),
    random,
  ).slice(0, optionCount - 1)

  return shuffle([country, ...distractors], random)
}

export function buildFlagQuizQuestionDeck(
  random: () => number = Math.random,
): CountryQuestionSource[] {
  return sampleWeightedUnique(flagQuestionBank, flagQuestionBank.length, random)
}

export function buildFlagQuizRoundFromCountries(
  difficulty: DifficultyRule,
  countries: CountryQuestionSource[],
  random: () => number = Math.random,
): FlagQuizQuestion[] {
  return countries.map(
    (country, index) => ({
      id: `${difficulty.id}-${country.code}-${index + 1}`,
      difficultyId: difficulty.id,
      country,
      options:
        difficulty.optionCount === null
          ? []
          : buildOptions(country, difficulty.optionCount, random),
    }),
  )
}

export function generateFlagQuizRound(
  difficulty: DifficultyRule,
  totalQuestions = 10,
  random: () => number = Math.random,
): FlagQuizQuestion[] {
  return buildFlagQuizRoundFromCountries(
    difficulty,
    sampleWeightedUnique(flagQuestionBank, totalQuestions, random),
    random,
  )
}
