import { Clock3, Trophy } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { gameCatalog, siteConfig } from '@/config/site'
import { GameCard } from '@/components/game-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useGameStats } from '@/lib/storage'
import type { GameId } from '@/types/game'

const playableGameIds = ['flag-quiz', 'guess-the-capital', 'outline-quiz'] as const

function hasPlayableStats(
  gameId: GameId,
): gameId is (typeof playableGameIds)[number] {
  return playableGameIds.includes(gameId as (typeof playableGameIds)[number])
}

export function HomePage() {
  const flagStats = useGameStats('flag-quiz')
  const capitalStats = useGameStats('guess-the-capital')
  const outlineStats = useGameStats('outline-quiz')
  const { analytics } = useAppServices()
  const statsByGame = {
    'flag-quiz': flagStats,
    'guess-the-capital': capitalStats,
    'outline-quiz': outlineStats,
  } as const
  const recentGames = [
    { game: gameCatalog[0], stats: flagStats },
    { game: gameCatalog[1], stats: capitalStats },
    { game: gameCatalog[2], stats: outlineStats },
  ]
    .sort((left, right) => {
      const leftTime = left.stats.recentResult
        ? new Date(left.stats.recentResult.completedAt).getTime()
        : 0
      const rightTime = right.stats.recentResult
        ? new Date(right.stats.recentResult.completedAt).getTime()
        : 0
      return rightTime - leftTime
    })
    .slice(0, 3)

  return (
    <div className="space-y-5 sm:space-y-7">
      <section>
        <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(160deg,rgba(246,252,247,0.98)_0%,rgba(229,245,235,0.9)_56%,rgba(212,236,220,0.84)_100%)]">
          <CardContent className="p-4 sm:p-8">
            <div className="max-w-2xl space-y-4">
              <Badge className="w-fit" variant="success">
                Modern trivia practice
              </Badge>
              <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                Train like you are about to walk into the next quiz final.
              </h1>
              <p className="max-w-xl text-base text-muted-foreground sm:text-xl">
                {siteConfig.description} Start with fast flag reps now. Country
                capitals and outline rounds are live, with currency and
                official language rounds next.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Game shelf
            </p>
            <h2 className="font-serif text-3xl font-semibold tracking-tight">
              Play now and what's next
            </h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {gameCatalog.map((game) => {
            const stats = hasPlayableStats(game.id) ? statsByGame[game.id] : null

            return (
              <GameCard
                footer={
                  !game.comingSoon && stats ? (
                    <div className="rounded-[24px] bg-[#edf7ef] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        {game.id === 'flag-quiz'
                          ? 'Flag quiz high score'
                          : game.id === 'guess-the-capital'
                            ? 'Capital quiz high score'
                            : 'Outline quiz high score'}
                      </div>
                      <p className="mt-2 font-serif text-3xl font-semibold">
                        {stats.highScore?.score ?? '—'}
                      </p>
                    </div>
                  ) : undefined
                }
                game={game}
                key={game.id}
                onOpen={() =>
                  analytics.trackEvent('homepage_card_clicked', { gameId: game.id })
                }
              />
            )
          })}
        </div>
      </section>

      <section className="rounded-[30px] border border-white/65 bg-white/55 p-4 shadow-[0_24px_70px_-54px_rgba(12,49,33,0.55)] backdrop-blur sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Recent activity
            </p>
            <h2 className="font-serif text-2xl font-semibold tracking-tight">
              Pick up where you left off
            </h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {recentGames.map(({ game, stats }, index) => (
            <div
              className="rounded-[24px] border border-white/70 bg-white/70 p-4"
              key={`${game.id}-${index}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{game.title}</p>
                {stats.recentResult ? (
                  <Clock3 className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {stats.recentResult
                  ? `${stats.recentResult.totalScore} points on ${stats.recentResult.correctAnswers}/${stats.recentResult.totalQuestions}`
                  : game.comingSoon
                    ? 'Coming soon'
                    : 'No rounds played yet'}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
