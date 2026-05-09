import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { correctAdvanceDelayMs, incorrectAdvanceDelayMs } from '@/lib/gameplay'
import { GuessTheCapitalGame } from '@/features/guess-the-capital/components/guess-the-capital-game'
import { AppServicesContextForTests } from '@/test/test-app-services'

vi.mock('@/features/guess-the-capital/lib/round', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/guess-the-capital/lib/round')>()

  return {
    ...actual,
    buildGuessTheCapitalRound: vi.fn(() => [
    {
      id: 'q-1',
      difficultyId: 'level-1',
      subject: {
        code: 'RO',
        kind: 'country',
        name: 'Romania',
        region: 'Europe',
        subregion: 'Eastern Europe',
        population: 19_000_000,
        area: 238_397,
        capital: 'Bucharest',
        capitalAliases: ['Bucuresti'],
        weightModifier: 1,
      },
      options: ['Bucharest', 'Paris'],
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

describe('GuessTheCapitalGame answer delay', () => {
  it('uses 900ms for correct multiple-choice answers', async () => {
    const user = userEvent.setup()
    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <GuessTheCapitalGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-Bucharest'))

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
        <GuessTheCapitalGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-Paris'))

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
        <GuessTheCapitalGame />
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
