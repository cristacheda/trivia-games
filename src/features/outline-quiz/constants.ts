import type { DifficultyRule } from '@/types/game'

export const OUTLINE_QUIZ_GAME_ID = 'outline-quiz'
export const OUTLINE_QUIZ_QUESTIONS_PER_ROUND = 20
export const OUTLINE_QUIZ_COUNTRIES_PER_ROUND = 18
export const OUTLINE_QUIZ_STATES_PER_ROUND = 2

export const outlineQuizDifficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Three answers, no timer, one point for each correct outline.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: null,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Five answers, 15 seconds, two points for each correct outline.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 15,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the matching place with no timer. Light misspellings are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: null,
    pointsPerCorrect: 3,
  },
]

export function getOutlineQuizDifficultyRule(id: DifficultyRule['id']) {
  return (
    outlineQuizDifficultyRules.find((rule) => rule.id === id) ??
    outlineQuizDifficultyRules[0]
  )
}
