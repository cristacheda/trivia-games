import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  GameStatsSection,
  HomepageGameScoreFooter,
} from '@/components/game-score-panels'

describe('game score panels', () => {
  it('renders a homepage footer with local best and a motivational empty top score', () => {
    render(
      <HomepageGameScoreFooter
        localHighScore={24}
        siteLeaderboard={{ status: 'coming-soon', entries: [], playerRank: null }}
      />,
    )

    expect(screen.getByText('Your best')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('Top score')).toBeInTheDocument()
    expect(screen.getByText('Time to set that record 🏁')).toBeInTheDocument()
  })

  it('renders a game stats section without a local best score yet', () => {
    render(
      <GameStatsSection
        localHighScore={null}
        playerId="player-12345678"
        recentResultScore={null}
        siteLeaderboard={{ status: 'coming-soon', entries: [], playerRank: null }}
      />,
    )

    expect(screen.getByText('Your best')).toBeInTheDocument()
    expect(screen.getAllByText('—')).toHaveLength(2)
    expect(screen.getByText('No rounds yet')).toBeInTheDocument()
    expect(screen.getByText('Stored locally as player-1...')).toBeInTheDocument()
    expect(
      screen.getByText('Leaderboard sync is coming soon for this game.'),
    ).toBeInTheDocument()
  })

  it('renders an empty ready leaderboard state inside the shared stats section', () => {
    render(
      <GameStatsSection
        localHighScore={18}
        playerId="player-12345678"
        recentResultScore={15}
        siteLeaderboard={{ status: 'ready', entries: [], playerRank: null }}
      />,
    )

    expect(screen.getByText('Top score')).toBeInTheDocument()
    expect(
      screen.getByText('No synced scores yet. Finish a round to seed this leaderboard.'),
    ).toBeInTheDocument()
  })

  it('renders a ready synced top score and leaderboard rank callout when available', () => {
    render(
      <GameStatsSection
        localHighScore={18}
        playerId="player-12345678"
        recentResultScore={15}
        siteLeaderboard={{
          status: 'ready',
          entries: [
            {
              achievedAt: '2026-05-11T10:00:00.000Z',
              gameId: 'guess-the-currency',
              isCurrentPlayer: false,
              playerLabel: 'Player M',
              rank: 1,
              score: 39,
            },
            {
              achievedAt: '2026-05-11T11:00:00.000Z',
              gameId: 'guess-the-currency',
              isCurrentPlayer: false,
              playerLabel: 'Player N',
              rank: 2,
              score: 38,
            },
          ],
          playerRank: {
            achievedAt: '2026-05-11T15:00:00.000Z',
            gameId: 'guess-the-currency',
            isCurrentPlayer: true,
            playerLabel: 'You',
            rank: 12,
            score: 18,
          },
        }}
      />,
    )

    expect(screen.getAllByText('39')).toHaveLength(2)
    expect(screen.getAllByText('Player M')).toHaveLength(2)
    expect(screen.getByText('15 points')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-entry-1')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-player-rank')).toHaveTextContent(
      'Your rank: #12 with 18 points.',
    )
  })
})
