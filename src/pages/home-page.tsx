import type { ElementType } from 'react'
import { Coins, Flag, GlassWater, Globe2, Music2, Trophy } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { gameCatalog, siteConfig } from '@/config/site'
import { GameCard } from '@/components/game-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useGameStats } from '@/lib/storage'
import type { GameId } from '@/types/game'

const playableGameIds = [
  'flag-quiz',
  'guess-the-capital',
  'outline-quiz',
  'guess-the-artist',
] as const

function hasPlayableStats(
  gameId: GameId,
): gameId is (typeof playableGameIds)[number] {
  return playableGameIds.includes(gameId as (typeof playableGameIds)[number])
}

function IconTile({
  icon: Icon,
  delay,
  label,
}: {
  icon: ElementType
  delay: number
  label: string
}) {
  return (
    <div
      aria-hidden="true"
      className="animate-float flex flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-primary/10 bg-white/60 p-4 shadow-sm backdrop-blur-sm"
      style={{ animationDelay: `${delay}s` }}
    >
      <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

export function HomePage() {
  const flagStats = useGameStats('flag-quiz')
  const capitalStats = useGameStats('guess-the-capital')
  const outlineStats = useGameStats('outline-quiz')
  const artistStats = useGameStats('guess-the-artist')
  const { analytics } = useAppServices()
  const statsByGame = {
    'flag-quiz': flagStats,
    'guess-the-capital': capitalStats,
    'outline-quiz': outlineStats,
    'guess-the-artist': artistStats,
  } as const

  const sortedCatalog = [...gameCatalog].sort((a, b) =>
    a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1,
  )

  return (
    <div className="space-y-5 sm:space-y-7">
      <section>
        <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(160deg,rgba(246,252,247,0.98)_0%,rgba(229,245,235,0.9)_56%,rgba(212,236,220,0.84)_100%)]">
          <CardContent className="p-4 sm:p-8">
            <div className="flex items-center gap-8 lg:gap-12">
              <div className="flex-1 space-y-4">
                <Badge className="w-fit" variant="success">
                  Modern trivia practice
                </Badge>
                <h1 className="text-balance font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Train like you are about to walk into the next quiz final.
                </h1>
                <p className="max-w-xl text-base text-muted-foreground sm:text-xl">
                  {siteConfig.description} Start with fast flag reps now. Country
                  capitals and outline rounds are live, with currency and
                  official language rounds next.
                </p>
              </div>

              <div className="hidden shrink-0 lg:block">
                <div className="flex gap-3">
                  <div className="flex flex-col gap-3">
                    <IconTile icon={Globe2} delay={0} label="Geography" />
                    <IconTile icon={Flag} delay={1.0} label="Flags" />
                    <IconTile icon={GlassWater} delay={2.0} label="Cocktails" />
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <IconTile icon={Music2} delay={0.5} label="Music" />
                    <IconTile icon={Coins} delay={1.5} label="Currency" />
                    <IconTile icon={Globe2} delay={2.5} label="Languages" />
                  </div>
                </div>
              </div>
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
          {sortedCatalog.map((game) => {
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
                            : game.id === 'guess-the-artist'
                              ? 'Artist quiz high score'
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
    </div>
  )
}
