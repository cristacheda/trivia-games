import type { DifficultyRule } from '@/types/game'
import {
  capitalCountryQuestionBank,
  computeCapitalSelectionWeight,
} from '@/features/guess-the-capital/data/countries'
import { capitalStateQuestionBank } from '@/features/guess-the-capital/data/states'
import type {
  CapitalQuestionSource,
  CapitalSubjectKind,
  GuessTheCapitalQuestion,
} from '@/features/guess-the-capital/types'

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

export function shuffle<T>(values: T[], random: () => number) {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function applyDifficultyWeight(
  subjects: CapitalQuestionSource[],
  difficultyId: DifficultyRule['id'],
) {
  return subjects.map((subject) => ({
    ...subject,
    weightModifier: computeCapitalSelectionWeight(subject, difficultyId),
  }))
}

function buildOptionPool(subject: CapitalQuestionSource) {
  const bank =
    subject.kind === 'state'
      ? capitalStateQuestionBank
      : [...capitalCountryQuestionBank, ...capitalStateQuestionBank]

  return bank.filter(
    (candidate) =>
      candidate.code !== subject.code && candidate.capital !== subject.capital,
  )
}

function buildOptions(
  subject: CapitalQuestionSource,
  optionCount: number,
  random: () => number,
) {
  const distractors = shuffle(buildOptionPool(subject), random)
    .filter(
      (candidate, index, candidates) =>
        candidates.findIndex((item) => item.capital === candidate.capital) === index,
    )
    .slice(0, optionCount - 1)
    .map((candidate) => candidate.capital)

  return shuffle([subject.capital, ...distractors], random)
}

export function buildGuessTheCapitalDeck(
  kind: CapitalSubjectKind,
  random: () => number = Math.random,
  difficultyId: DifficultyRule['id'] = 'level-1',
) {
  const bank = kind === 'country' ? capitalCountryQuestionBank : capitalStateQuestionBank
  const weightedBank = applyDifficultyWeight(bank, difficultyId)

  return sampleWeightedUnique(weightedBank, weightedBank.length, random)
}

export function buildGuessTheCapitalRound(
  difficulty: DifficultyRule,
  subjects: CapitalQuestionSource[],
  random: () => number = Math.random,
): GuessTheCapitalQuestion[] {
  return shuffle(subjects, random).map((subject, index) => ({
    id: `${difficulty.id}-${subject.code}-${index + 1}`,
    difficultyId: difficulty.id,
    subject,
    options:
      difficulty.optionCount === null
        ? []
        : buildOptions(subject, difficulty.optionCount, random),
  }))
}
