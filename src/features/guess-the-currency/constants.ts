import type { DifficultyRule } from '@/types/game'

export const GUESS_THE_CURRENCY_GAME_ID = 'guess-the-currency'
export const GUESS_THE_CURRENCY_QUESTIONS_PER_ROUND = 20

export const guessTheCurrencyDifficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Three answers, no timer, one point for each correct match.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: null,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Five answers, 15 seconds, two points for each correct match.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 15,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the country name with no timer. Light misspellings are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: null,
    pointsPerCorrect: 3,
  },
]

export function getGuessTheCurrencyDifficultyRule(id: DifficultyRule['id']) {
  return (
    guessTheCurrencyDifficultyRules.find((rule) => rule.id === id) ??
    guessTheCurrencyDifficultyRules[0]
  )
}
