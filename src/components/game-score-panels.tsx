import type { ReactNode } from 'react'
import { Trophy } from 'lucide-react'
import type { SiteHighScoreLookup } from '@/types/game'

interface ScoreStatProps {
  label: string
  value: ReactNode
  hint?: string
  valueClassName?: string
}

interface SharedScorePanelProps {
  localHighScore: number | null
  siteHighScore: SiteHighScoreLookup
}

type HomepageGameScoreFooterProps = SharedScorePanelProps

interface GameScoreSummaryProps extends SharedScorePanelProps {
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

function getSiteRecordValue(siteHighScore: SiteHighScoreLookup) {
  if (siteHighScore.status === 'ready') {
    return {
      value: siteHighScore.record.score,
      hint: siteHighScore.record.playerLabel ?? 'Best synced score across players.',
      valueClassName: 'font-serif text-3xl font-semibold',
    }
  }

  return {
    value: 'Coming soon',
    hint: undefined,
    valueClassName: 'text-lg font-semibold',
  }
}

export function HomepageGameScoreFooter({
  localHighScore,
  siteHighScore,
}: HomepageGameScoreFooterProps) {
  const siteRecord = getSiteRecordValue(siteHighScore)

  return (
    <div className="rounded-[24px] bg-[#edf7ef] p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Trophy className="h-4 w-4" />
        Scoreboard
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <ScoreStat label="Your best" value={localHighScore ?? '—'} />
        <ScoreStat
          hint={siteRecord.hint}
          label="Site record"
          value={siteRecord.value}
          valueClassName={siteRecord.valueClassName}
        />
      </div>
    </div>
  )
}

export function GameScoreSummary({
  localHighScore,
  playerId,
  recentResultScore,
  siteHighScore,
}: GameScoreSummaryProps) {
  const siteRecord = getSiteRecordValue(siteHighScore)

  return (
    <div className="grid gap-4 rounded-[26px] bg-secondary/75 p-5 md:grid-cols-2 xl:grid-cols-4">
      <ScoreStat label="Your best" value={localHighScore ?? '—'} />
      <ScoreStat
        hint={siteRecord.hint}
        label="Site record"
        value={siteRecord.value}
        valueClassName={siteRecord.valueClassName}
      />
      <ScoreStat
        label="Last result"
        value={recentResultScore !== null ? `${recentResultScore} points` : 'No rounds yet'}
        valueClassName="text-lg font-semibold"
      />
      <ScoreStat
        hint="Local-first until cloud sync launches."
        label="Practice profile"
        value={`Stored locally as ${playerId.slice(0, 8)}...`}
        valueClassName="text-sm font-medium text-muted-foreground"
      />
    </div>
  )
}
