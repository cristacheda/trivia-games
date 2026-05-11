import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { correctAdvanceDelayMs, incorrectAdvanceDelayMs } from '@/lib/gameplay'
import { GuessTheArtistGame } from '@/features/guess-the-artist/components/guess-the-artist-game'
import { AppServicesContextForTests } from '@/test/test-app-services'

vi.mock('@/features/guess-the-artist/lib/round', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/guess-the-artist/lib/round')>()

  return {
    ...actual,
    buildGuessTheArtistRound: vi.fn(() => [
      {
        id: 'q-1',
        difficultyId: 'level-1',
        subject: {
          id: 'bohemian-rhapsody',
          songTitle: 'Bohemian Rhapsody',
          artistName: 'Queen',
          aliases: ['Queen'],
          era: '1970s',
          region: 'Europe',
          popularityTier: 'popular',
          weightModifier: 1,
        },
        options: ['Queen', 'Adele', 'Stromae'],
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

describe('GuessTheArtistGame answer delay', () => {
  it('renders the floating untimed footer and exits back to setup', async () => {
    const user = userEvent.setup()

    render(
      <AppServicesContextForTests>
        <GuessTheArtistGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))

    expect(screen.getByTestId('question-progress-footer')).toHaveTextContent(
      'Question 1 / 1',
    )
    expect(screen.getByTestId('learning-mode-footer')).toBeInTheDocument()
    expect(screen.getByTestId('round-progress-footer')).toBeInTheDocument()
    expect(screen.queryByTestId('question-progress')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('in-round-back-button'))

    expect(screen.getByTestId('start-round')).toBeInTheDocument()
    expect(screen.queryByTestId('question-progress-footer')).not.toBeInTheDocument()
  })

  it('uses 1000ms for correct answers', async () => {
    const user = userEvent.setup()
    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <GuessTheArtistGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-Queen'))

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), correctAdvanceDelayMs)
  })

  it('uses 3000ms for wrong answers', async () => {
    const user = userEvent.setup()
    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <GuessTheArtistGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))
    await user.click(screen.getByTestId('answer-Adele'))

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), incorrectAdvanceDelayMs)
  })

  it('uses 3000ms for timeout outcomes on level 2', async () => {
    vi.useFakeTimers()
    window.localStorage.setItem('atlas-of-answers:debug', JSON.stringify({ timerScale: 0.001 }))

    const timeoutSpy = vi.spyOn(window, 'setTimeout')

    render(
      <AppServicesContextForTests>
        <GuessTheArtistGame />
      </AppServicesContextForTests>,
    )

    fireEvent.click(screen.getByTestId('difficulty-level-2'))
    fireEvent.click(screen.getByTestId('start-round'))
    vi.advanceTimersByTime(150)

    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), incorrectAdvanceDelayMs)
  })
})
