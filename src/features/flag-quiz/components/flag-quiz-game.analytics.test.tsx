import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FlagQuizGame } from '@/features/flag-quiz/components/flag-quiz-game'
import { AppServicesContextForTests } from '@/test/test-app-services'

describe('FlagQuizGame analytics', () => {
  it('tracks round lifecycle without leaking free-text answers', async () => {
    const user = userEvent.setup()
    const trackEvent = vi.fn()

    render(
      <AppServicesContextForTests
        analytics={{ trackEvent, trackPageView: vi.fn() }}
      >
        <FlagQuizGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-3'))
    await user.click(screen.getByTestId('start-round'))

    expect(trackEvent).toHaveBeenCalledWith(
      'round_started',
      expect.objectContaining({
        answer_mode: 'free-text',
        difficulty_id: 'level-3',
        game_id: 'flag-quiz',
        question_count: 20,
      }),
    )

    await user.type(screen.getByRole('textbox'), 'definitely-not-correct')
    await user.keyboard('{Enter}')

    expect(trackEvent).toHaveBeenCalledWith(
      'question_answered',
      expect.objectContaining({
        answer_mode: 'free-text',
        difficulty_id: 'level-3',
        game_id: 'flag-quiz',
        question_index: 1,
        resolution: 'wrong',
      }),
    )

    const questionAnsweredCall = trackEvent.mock.calls.find(
      (call) => call[0] === 'question_answered',
    ) as [string, Record<string, unknown>] | undefined

    expect(questionAnsweredCall?.[1]).not.toHaveProperty('answerLabel')
    expect(questionAnsweredCall?.[1]).not.toHaveProperty('answer_label')
  })
})
