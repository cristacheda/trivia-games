import type { DifficultyRule } from '@/types/game'

export const GUESS_THE_CAPITAL_GAME_ID = 'guess-the-capital'
export const GUESS_THE_CAPITAL_QUESTIONS_PER_ROUND = 20
export const GUESS_THE_CAPITAL_COUNTRIES_PER_ROUND = 18
export const GUESS_THE_CAPITAL_STATES_PER_ROUND = 2

export const guessTheCapitalDifficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Three answers, no timer, one point for each correct capital.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: null,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Five answers, 15 seconds, two points for each correct capital.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 15,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the capital with no timer. Light misspellings and common variants are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: null,
    pointsPerCorrect: 3,
  },
]

export function getGuessTheCapitalDifficultyRule(id: DifficultyRule['id']) {
  return (
    guessTheCapitalDifficultyRules.find((rule) => rule.id === id) ??
    guessTheCapitalDifficultyRules[0]
  )
}
