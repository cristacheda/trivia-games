import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: () => false,
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GuessTheArtistGame offline status', () => {
  it('shows Offline and skips preview loading when connectivity is down', async () => {
    const user = userEvent.setup()

    render(
      <AppServicesContextForTests>
        <GuessTheArtistGame />
      </AppServicesContextForTests>,
    )

    await user.click(screen.getByTestId('difficulty-level-1'))
    await user.click(screen.getByTestId('start-round'))

    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.queryByText('Loading preview…')).not.toBeInTheDocument()
    expect(screen.queryByText('Playing snippet')).not.toBeInTheDocument()
  })
})
