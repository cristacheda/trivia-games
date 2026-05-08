import { describe, expect, it } from 'vitest'
import { getDifficultyRule } from '@/features/flag-quiz/constants'
import { scoreAnswer } from '@/features/flag-quiz/lib/scoring'

describe('scoreAnswer', () => {
  it('scores according to difficulty', () => {
    expect(scoreAnswer(true, getDifficultyRule('level-1'))).toBe(1)
    expect(scoreAnswer(true, getDifficultyRule('level-2'))).toBe(2)
    expect(scoreAnswer(true, getDifficultyRule('level-3'))).toBe(3)
    expect(scoreAnswer(false, getDifficultyRule('level-3'))).toBe(0)
  })
})
