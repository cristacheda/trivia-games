import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { incorrectAdvanceDelayMs, correctAdvanceDelayMs } from '@/lib/gameplay'
import { FlagQuizGame } from '@/features/flag-quiz/components/flag-quiz-game'
import { AppServicesContextForTests } from '@/test/test-app-services'

vi.mock('@/features/flag-quiz/lib/round', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/flag-quiz/lib/round')>()

  return {
    ...actual,
    buildFlagQuizRoundFromCountries: vi.fn(() => [
      {
      id: 'q-1',
      difficultyId: 'level-1',
      country: {
        code: 'RO',
        name: 'Romania',
        officialName: 'Romania',
        aliases: ['Romania'],
        region: 'Europe',
        subregion: 'Eastern Europe',
        population: 19_000_000,
        area: 238_397,
        flagEmoji: '🇷🇴',
        weightModifier: 1,
      },
      options: [
        {
          code: 'RO',
          name: 'Romania',
          officialName: 'Romania',
          aliases: ['Romania'],
          region: 'Europe',
          subregion: 'Eastern Europe',
          population: 19_000_000,
          area: 238_397,
          flagEmoji: '🇷🇴',
          weightModifier: 1,
        },
        {
          code: 'FR',
          name: 'France',
          officialName: 'French Republic',
          aliases: ['France'],
          region: 'Europe',
          subregion: 'Western Europe',
          population: 68_000_000,
          area: 551_695,
          flagEmoji: '🇫🇷',
          weightModifier: 1,
        },
      ],
      },
    ]),
  }
})

vi.mock('@/components/confetti-layer', () => ({
  ConfettiLayer: () => null,
}))

afterEach(() => {
  vi.useRealTimers()
  window.localStorage.removeItem('atlas-of-answers:debug')
  vi.restoreAllMocks()
})

describe('FlagQuizGame answer delay', () => {
  it('uses 900ms for correct multiple-choice answers', async () => {
    const user = userEvent.setup()
    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <FlagQuizGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-RO'))

    expect(timeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      correctAdvanceDelayMs,
    )
  })

  it('uses 5000ms for wrong multiple-choice answers', async () => {
    const user = userEvent.setup()
    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <FlagQuizGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-FR'))

    expect(timeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      incorrectAdvanceDelayMs,
    )
  })

  it('uses 5000ms for timeout outcomes', async () => {
    vi.useFakeTimers()
    window.localStorage.setItem(
      'atlas-of-answers:debug',
      JSON.stringify({ timerScale: 0.001 }),
    )

    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <FlagQuizGame />
      </AppServicesContextForTests>,
    )

    fireEvent.click(screen.getByTestId('difficulty-level-2'))
    fireEvent.click(screen.getByTestId('start-round'))
    vi.advanceTimersByTime(150)

    expect(timeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      incorrectAdvanceDelayMs,
    )
  })
})
