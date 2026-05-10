import type { DifficultyRule } from '@/types/game'

export const GUESS_THE_COCKTAIL_GAME_ID = 'guess-the-cocktail'
export const GUESS_THE_COCKTAIL_QUESTIONS_PER_ROUND = 20
export const GUESS_THE_COCKTAIL_REGULAR_PER_ROUND = 19
export const GUESS_THE_COCKTAIL_OBSCURE_PER_ROUND = 1

export const guessTheCocktailDifficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Three cocktails, no timer, ingredients shown. One point per correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: null,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Five cocktails, 15 seconds, no hints. Two points per correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 15,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the cocktail name with no timer. Light misspellings are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: null,
    pointsPerCorrect: 3,
  },
]

export function getGuessTheCocktailDifficultyRule(id: DifficultyRule['id']) {
  return (
    guessTheCocktailDifficultyRules.find((rule) => rule.id === id) ??
    guessTheCocktailDifficultyRules[0]
  )
}
