import type { DifficultyRule } from '@/types/game'
import {
  computeCurrencySelectionWeight,
  currencyQuestionBank,
} from '@/features/guess-the-currency/data/countries'
import type {
  CurrencyQuestionSource,
  GuessTheCurrencyQuestion,
} from '@/features/guess-the-currency/types'

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

function applyDifficultyWeight(
  subjects: CurrencyQuestionSource[],
  difficultyId: DifficultyRule['id'],
): CurrencyQuestionSource[] {
  return subjects.map((subject) => ({
    ...subject,
    weightModifier: computeCurrencySelectionWeight(subject, difficultyId),
  }))
}

function buildOptions(
  subject: CurrencyQuestionSource,
  optionCount: number,
  random: () => number,
): CurrencyQuestionSource[] {
  // Exclude the subject itself AND any country that shares the same primary currency
  // code, to prevent multiple valid answers in one question (EUR, XOF, USD, AUD, etc.)
  const distractors = shuffle(
    currencyQuestionBank.filter(
      (candidate) =>
        candidate.code !== subject.code &&
        candidate.currencyCode !== subject.currencyCode,
    ),
    random,
  ).slice(0, optionCount - 1)

  return shuffle([subject, ...distractors], random)
}

export function buildGuessTheCurrencyDeck(
  random: () => number = Math.random,
  difficultyId: DifficultyRule['id'] = 'level-1',
): CurrencyQuestionSource[] {
  const weightedBank = applyDifficultyWeight(currencyQuestionBank, difficultyId)
  return sampleWeightedUnique(weightedBank, weightedBank.length, random)
}

export function buildGuessTheCurrencyRound(
  difficulty: DifficultyRule,
  subjects: CurrencyQuestionSource[],
  random: () => number = Math.random,
): GuessTheCurrencyQuestion[] {
  return subjects.map((subject, index) => ({
    id: `${difficulty.id}-${subject.code}-${index + 1}`,
    difficultyId: difficulty.id,
    subject,
    options:
      difficulty.optionCount === null
        ? []
        : buildOptions(subject, difficulty.optionCount, random),
  }))
}
