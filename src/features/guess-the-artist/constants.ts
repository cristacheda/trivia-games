import type { DifficultyRule } from '@/types/game'

export const GUESS_THE_ARTIST_GAME_ID = 'guess-the-artist'
export const GUESS_THE_ARTIST_QUESTIONS_PER_ROUND = 20

export const guessTheArtistDifficultyRules: DifficultyRule[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    prompt: 'Three artists, no timer, one point for each correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 3,
    timeLimitSeconds: null,
    pointsPerCorrect: 1,
  },
  {
    id: 'level-2',
    label: 'Level 2',
    prompt: 'Five artists, 15 seconds, two points for each correct answer.',
    answerMode: 'multiple-choice',
    optionCount: 5,
    timeLimitSeconds: 15,
    pointsPerCorrect: 2,
  },
  {
    id: 'level-3',
    label: 'Level 3',
    prompt: 'Type the artist with no timer. Light misspellings are accepted.',
    answerMode: 'free-text',
    optionCount: null,
    timeLimitSeconds: null,
    pointsPerCorrect: 3,
  },
]

export function getGuessTheArtistDifficultyRule(id: DifficultyRule['id']) {
  return (
    guessTheArtistDifficultyRules.find((rule) => rule.id === id) ??
    guessTheArtistDifficultyRules[0]
  )
}
