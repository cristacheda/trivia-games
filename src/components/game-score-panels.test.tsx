import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  GameScoreSummary,
  HomepageGameScoreFooter,
} from '@/components/game-score-panels'

describe('game score panels', () => {
  it('renders a homepage footer with local best and a coming-soon site record', () => {
    render(
      <HomepageGameScoreFooter
        localHighScore={24}
        siteHighScore={{ status: 'coming-soon', record: null }}
      />,
    )

    expect(screen.getByText('Your best')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
    expect(screen.getByText('Site record')).toBeInTheDocument()
    expect(screen.getByText('Coming soon')).toBeInTheDocument()
  })

  it('renders a game summary without a local best score yet', () => {
    render(
      <GameScoreSummary
        localHighScore={null}
        playerId="player-12345678"
        recentResultScore={null}
        siteHighScore={{ status: 'coming-soon', record: null }}
      />,
    )

    expect(screen.getByText('Your best')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(screen.getByText('No rounds yet')).toBeInTheDocument()
    expect(screen.getByText('Stored locally as player-1...')).toBeInTheDocument()
  })

  it('renders a ready synced site record when available', () => {
    render(
      <GameScoreSummary
        localHighScore={18}
        playerId="player-12345678"
        recentResultScore={15}
        siteHighScore={{
          status: 'ready',
          record: {
            achievedAt: '2026-05-11T10:00:00.000Z',
            gameId: 'guess-the-currency',
            playerLabel: 'Player M',
            score: 39,
          },
        }}
      />,
    )

    expect(screen.getByText('39')).toBeInTheDocument()
    expect(screen.getByText('Player M')).toBeInTheDocument()
    expect(screen.getByText('15 points')).toBeInTheDocument()
  })
})
