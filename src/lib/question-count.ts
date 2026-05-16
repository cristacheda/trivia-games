export const QUESTION_COUNT_OPTIONS = [10, 20, 30, 40] as const

export type QuestionCount = (typeof QUESTION_COUNT_OPTIONS)[number]

export const DEFAULT_QUESTION_COUNT: QuestionCount = 20

export function isQuestionCount(value: unknown): value is QuestionCount {
  return QUESTION_COUNT_OPTIONS.includes(value as QuestionCount)
}

export function normalizeQuestionCount(value: unknown): QuestionCount {
  return isQuestionCount(value) ? value : DEFAULT_QUESTION_COUNT
}

export function getGeographyRoundSplit(questionCount: QuestionCount) {
  const stateCount = Math.max(1, questionCount / 10)

  return {
    countryCount: questionCount - stateCount,
    stateCount,
  }
}

export function getCocktailRoundMix(questionCount: QuestionCount) {
  const obscureCount = Math.ceil(questionCount / DEFAULT_QUESTION_COUNT)

  return {
    obscureCount,
    regularCount: questionCount - obscureCount,
  }
}
