import type { DifficultyRule } from '@/types/game'

export const FLAG_QUIZ_GAME_ID = 'flag-quiz'

export const difficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Five answers, 20 seconds, one point for each correct match.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 20,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Three answers, 10 seconds, two points for each correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: 10,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the country name in 15 seconds. Light misspellings are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: 15,
    pointsPerCorrect: 3,
  },
]

export function getDifficultyRule(id: DifficultyRule['id']) {
  return difficultyRules.find((rule) => rule.id === id) ?? difficultyRules[0]
}
