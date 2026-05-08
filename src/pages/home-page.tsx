import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Trophy } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { gameCatalog, siteConfig } from '@/config/site'
import { GameCard } from '@/components/game-card'
import { CountryFlag } from '@/components/country-flag'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useGameStats } from '@/lib/storage'

export function HomePage() {
  const flagStats = useGameStats('flag-quiz')
  const { analytics } = useAppServices()

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Open-source</Badge>
              <Badge variant="outline">Static-first</Badge>
              <Badge variant="outline">Built for repeated practice</Badge>
            </div>

            <div className="mt-6 max-w-2xl space-y-5">
              <h1 className="font-serif text-5xl font-semibold leading-none tracking-tight text-balance text-foreground sm:text-6xl">
                Train for trivia rounds with games that respect your attention.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
                {siteConfig.description} Start with flags today. Country outlines are next.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild onClick={() => analytics.trackEvent('homepage_card_clicked', { gameId: 'flag-quiz' })} size="lg">
                <Link to="/games/flag-quiz">
                  Play the flag quiz
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
                  See the project on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/[0.08]">
          <CardContent className="flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4">
              <CountryFlag countryCode="NA" label="Namibia flag" />
              <CountryFlag countryCode="WS" label="Samoa flag" />
              <CountryFlag countryCode="SR" label="Suriname flag" />
              <CountryFlag countryCode="TD" label="Chad flag" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Current best
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold">
                  {flagStats.highScore?.score ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                  Last round
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {flagStats.recentResult
                    ? `${flagStats.recentResult.totalScore} points`
                    : 'Waiting for your first attempt'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
                Game shelf
              </p>
              <h2 className="font-serif text-3xl font-semibold tracking-tight">
                Ready to play
              </h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm font-semibold text-muted-foreground sm:flex">
              <Compass className="h-4 w-4" />
              One live game, one tease, more to come
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {gameCatalog.map((game) => (
              <GameCard
                footer={
                  game.id === 'flag-quiz' ? (
                    <div className="rounded-[24px] bg-white/70 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                        <Trophy className="h-4 w-4" />
                        Flag quiz high score
                      </div>
                      <p className="mt-2 font-serif text-3xl font-semibold">
                        {flagStats.highScore?.score ?? '—'}
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
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">
              MVP notes
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Scores live in local storage now and are ready for later Supabase sync.</li>
              <li>Google and GitHub login are intentionally stubbed, not wired yet.</li>
              <li>The first game is cacheable for replay if the connection drops after the initial load.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
