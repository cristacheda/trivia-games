import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppServices } from '@/app/app-providers'
import { useAppChrome } from '@/components/layout/app-chrome'
import { OutlineQuizGame } from '@/features/outline-quiz/components/outline-quiz-game'
import { OUTLINE_QUIZ_GAME_ID } from '@/features/outline-quiz/constants'

export function OutlineQuizPage() {
  const [isPlayingRound, setIsPlayingRound] = useState(false)
  const { setChromeHidden } = useAppChrome()
  const { analytics } = useAppServices()

  useEffect(() => {
    return () => setChromeHidden(false)
  }, [setChromeHidden])

  useEffect(() => {
    analytics.trackEvent('game_viewed', {
      game_id: OUTLINE_QUIZ_GAME_ID,
      game_title: 'Guess the Country by Its Outline',
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
              Outline quiz
            </p>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
              Guess the Country by Its Outline
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-lg">
              Read the shape, not the colors. Mixed rounds pull from all UN
              countries plus US states, with harder levels steering toward the
              geography most European players see less often.
            </p>
          </div>
        </>
      ) : null}

      <OutlineQuizGame
        onPhaseChange={(phase) => {
          const nextIsPlayingRound = phase === 'question'
          setIsPlayingRound(nextIsPlayingRound)
          setChromeHidden(nextIsPlayingRound)
        }}
      />
    </div>
  )
}
