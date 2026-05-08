import type { DifficultyRule } from '@/types/game'

export function scoreAnswer(isCorrect: boolean, difficulty: DifficultyRule) {
  return isCorrect ? difficulty.pointsPerCorrect : 0
}
