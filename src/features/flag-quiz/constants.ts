import type { DifficultyRule } from '@/types/game'

export const FLAG_QUIZ_GAME_ID = 'flag-quiz'
export const FLAG_QUIZ_QUESTIONS_PER_ROUND = 20

export const difficultyRules: DifficultyRule[] = [
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
    prompt: 'Five answers, 10 seconds, two points for each correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 10,
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

export function getDifficultyRule(id: DifficultyRule['id']) {
  return difficultyRules.find((rule) => rule.id === id) ?? difficultyRules[0]
}
