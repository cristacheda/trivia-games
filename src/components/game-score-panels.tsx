import type { ReactNode } from 'react'
import { Trophy } from 'lucide-react'
import type { SiteLeaderboardEntry, SiteLeaderboardLookup } from '@/types/game'

interface ScoreStatProps {
  label: string
  value: ReactNode
  hint?: string
  valueClassName?: string
}

interface SharedScorePanelProps {
  localHighScore: number | null
  siteLeaderboard: SiteLeaderboardLookup
}

type HomepageGameScoreFooterProps = SharedScorePanelProps

interface GameStatsSectionProps extends SharedScorePanelProps {
  id?: string
  playerId: string
  recentResultScore: number | null
}

function ScoreStat({
  label,
  value,
  hint,
  valueClassName = 'font-serif text-3xl font-semibold',
}: ScoreStatProps) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 ${valueClassName}`}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

function getTopScoreValue(
  siteLeaderboard: SiteLeaderboardLookup,
  emptyValue = '—',
) {
  if (siteLeaderboard.status === 'ready' && siteLeaderboard.entries.length > 0) {
    const siteRecord = siteLeaderboard.entries[0]

    return {
      value: siteRecord.score,
      hint: siteRecord.playerLabel ?? 'Best synced score across players.',
      valueClassName: 'font-serif text-3xl font-semibold',
    }
  }

  return {
    value: emptyValue,
    hint:
      siteLeaderboard.status === 'ready' ? 'No synced record yet.' : undefined,
    valueClassName: 'text-lg font-semibold',
  }
}

function formatRecordDate(value: string | null) {
  if (!value) {
    return 'No record yet'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'No record yet'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function LeaderboardRow({ entry }: { entry: SiteLeaderboardEntry }) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[20px] border px-4 py-3 ${
        entry.isCurrentPlayer
          ? 'border-primary/30 bg-primary/10'
          : 'border-white/70 bg-white/75'
      }`}
      data-testid={`leaderboard-entry-${entry.rank}`}
    >
      <div className="font-serif text-2xl font-semibold text-muted-foreground">
        #{entry.rank}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {entry.playerLabel ?? 'Anonymous player'}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatRecordDate(entry.achievedAt)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-serif text-2xl font-semibold">{entry.score}</p>
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          points
        </p>
      </div>
    </div>
  )
}

function LeaderboardContent({
  siteLeaderboard,
}: {
  siteLeaderboard: SiteLeaderboardLookup
}) {
  if (siteLeaderboard.status === 'coming-soon') {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Leaderboard sync is coming soon for this game.
      </p>
    )
  }

  if (siteLeaderboard.entries.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        No synced scores yet. Finish a round to seed this leaderboard.
      </p>
    )
  }

  return (
    <>
      <div className="mt-4 space-y-3">
        {siteLeaderboard.entries.map((entry) => (
          <LeaderboardRow entry={entry} key={`${entry.rank}-${entry.playerLabel ?? 'player'}`} />
        ))}
      </div>
      {siteLeaderboard.playerRank &&
      !siteLeaderboard.entries.some((entry) => entry.isCurrentPlayer) ? (
        <p
          className="mt-4 text-sm text-muted-foreground"
          data-testid="leaderboard-player-rank"
        >
          Your rank: #{siteLeaderboard.playerRank.rank} with{' '}
          {siteLeaderboard.playerRank.score} points.
        </p>
      ) : null}
    </>
  )
}

export function HomepageGameScoreFooter({
  localHighScore,
  siteLeaderboard,
}: HomepageGameScoreFooterProps) {
  const topScore = getTopScoreValue(siteLeaderboard, 'Time to set that record 🏁')

  return (
    <div className="rounded-[24px] bg-[#edf7ef] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Trophy className="h-4 w-4" />
        Scoreboard
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <ScoreStat label="Your best" value={localHighScore ?? '—'} />
        <ScoreStat
          hint={topScore.hint}
          label="Top score"
          value={topScore.value}
          valueClassName={topScore.valueClassName}
        />
      </div>
    </div>
  )
}

export function GameStatsSection({
  id,
  localHighScore,
  playerId,
  recentResultScore,
  siteLeaderboard,
}: GameStatsSectionProps) {
  const topScore = getTopScoreValue(siteLeaderboard)

  return (
    <div
      className="rounded-[26px] border border-primary/10 bg-[linear-gradient(160deg,rgba(246,252,247,0.98)_0%,rgba(229,245,235,0.9)_100%)] p-5"
      id={id}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Trophy className="h-4 w-4" />
        Performance
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ScoreStat label="Your best" value={localHighScore ?? '—'} />
        <ScoreStat
          hint={topScore.hint}
          label="Top score"
          value={topScore.value}
          valueClassName={topScore.valueClassName}
        />
        <ScoreStat
          label="Last result"
          value={recentResultScore !== null ? `${recentResultScore} points` : 'No rounds yet'}
          valueClassName="text-lg font-semibold"
        />
        <ScoreStat
          hint="Local-first by default, with optional sync when available."
          label="Practice profile"
          value={`Stored locally as ${playerId.slice(0, 8)}...`}
          valueClassName="text-sm font-medium text-muted-foreground"
        />
      </div>
      <div className="mt-5 border-t border-primary/10 pt-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Trophy className="h-4 w-4" />
          Leaderboard
        </div>
        <LeaderboardContent siteLeaderboard={siteLeaderboard} />
      </div>
    </div>
  )
}
