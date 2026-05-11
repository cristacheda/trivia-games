import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { useAppChrome } from '@/components/layout/app-chrome'
import { GuessTheCapitalGame } from '@/features/guess-the-capital/components/guess-the-capital-game'
import { GUESS_THE_CAPITAL_GAME_ID } from '@/features/guess-the-capital/constants'

export function GuessTheCapitalPage() {
  const [isPlayingRound, setIsPlayingRound] = useState(false)
  const { setChromeHidden } = useAppChrome()
  const { analytics } = useAppServices()

  useEffect(() => {
    return () => setChromeHidden(false)
  }, [setChromeHidden])

  useEffect(() => {
    analytics.trackEvent('game_viewed', {
      game_id: GUESS_THE_CAPITAL_GAME_ID,
      game_title: 'Guess the Capital of the Country',
    })
  }, [analytics])

  return (
    <div className="space-y-4">
      {!isPlayingRound ? (
        <>
          <div className="flex items-center justify-between gap-4">
            <Link
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white"
              to="/"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to games
            </Link>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Guess the capital
            </p>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
              Guess the Capital of the Country
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-lg">
              Match countries and US states to their capitals, with harder rounds
              leaning toward less familiar geography.
            </p>
          </div>
        </>
      ) : null}

      <GuessTheCapitalGame
        onPhaseChange={(phase) => {
          const nextIsPlayingRound = phase === 'question'
          setIsPlayingRound(nextIsPlayingRound)
          setChromeHidden(nextIsPlayingRound)
        }}
      />
    </div>
  )
}
