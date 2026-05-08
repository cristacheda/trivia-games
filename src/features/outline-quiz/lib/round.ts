import type { DifficultyId, DifficultyRule } from '@/types/game'
import {
  OUTLINE_QUIZ_QUESTIONS_PER_ROUND,
} from '@/features/outline-quiz/constants'
import { outlineQuestionBankByKind } from '@/features/outline-quiz/data/question-bank'
import type {
  OutlineQuestionSource,
  OutlineQuizQuestion,
  OutlineSubjectKind,
} from '@/features/outline-quiz/types'

export function sampleWeightedUnique<T>(
  values: T[],
  count: number,
  getWeight: (value: T) => number,
  random: () => number,
) {
  const pool = [...values]
  const result: T[] = []

  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, value) => sum + getWeight(value), 0)
    let roll = random() * totalWeight
    let selectedIndex = 0

    for (let index = 0; index < pool.length; index += 1) {
      roll -= getWeight(pool[index])
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

function getSubjectWeight(
  subject: OutlineQuestionSource,
  difficultyId: DifficultyId,
) {
  return difficultyId === 'level-1' ? subject.baseWeight : subject.hardWeight
}

function buildOptions(
  subject: OutlineQuestionSource,
  optionCount: number,
  random: () => number,
) {
  const distractors = shuffle(
    outlineQuestionBankByKind[subject.kind].filter(
      (candidate) => candidate.code !== subject.code,
    ),
    random,
  ).slice(0, optionCount - 1)

  return shuffle([subject, ...distractors], random)
}

export function buildOutlineQuizDeck(
  kind: OutlineSubjectKind,
  difficultyId: DifficultyId,
  random: () => number = Math.random,
) {
  return sampleWeightedUnique(
    outlineQuestionBankByKind[kind],
    outlineQuestionBankByKind[kind].length,
    (subject) => getSubjectWeight(subject, difficultyId),
    random,
  )
}

export function buildOutlineQuizRoundFromSubjects(
  difficulty: DifficultyRule,
  subjects: OutlineQuestionSource[],
  random: () => number = Math.random,
): OutlineQuizQuestion[] {
  return subjects.map((subject, index) => ({
    id: `${difficulty.id}-${subject.kind}-${subject.code}-${index + 1}`,
    difficultyId: difficulty.id,
    subject,
    options:
      difficulty.optionCount === null
        ? []
        : buildOptions(subject, difficulty.optionCount, random),
  }))
}

export function generateOutlineQuizRound(
  difficulty: DifficultyRule,
  random: () => number = Math.random,
) {
  const countries = sampleWeightedUnique(
    outlineQuestionBankByKind.country,
    18,
    (subject) => getSubjectWeight(subject, difficulty.id),
    random,
  )
  const states = sampleWeightedUnique(
    outlineQuestionBankByKind.state,
    2,
    (subject) => getSubjectWeight(subject, difficulty.id),
    random,
  )

  return buildOutlineQuizRoundFromSubjects(
    difficulty,
    shuffle([...countries, ...states], random).slice(
      0,
      OUTLINE_QUIZ_QUESTIONS_PER_ROUND,
    ),
    random,
  )
}
