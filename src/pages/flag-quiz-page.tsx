import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppChrome } from '@/components/layout/app-chrome'
import { FlagQuizGame } from '@/features/flag-quiz/components/flag-quiz-game'

export function FlagQuizPage() {
  const [isPlayingRound, setIsPlayingRound] = useState(false)
  const { setChromeHidden } = useAppChrome()

  useEffect(() => {
    return () => setChromeHidden(false)
  }, [setChromeHidden])

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
              Flag quiz
            </p>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
              Name the Country Flag
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-lg">
              Fast recognition rounds built to keep the flag, the answer area, and the
              timer in view without extra page clutter.
            </p>
          </div>
        </>
      ) : null}

      <FlagQuizGame
        onPhaseChange={(phase) => {
          const nextIsPlayingRound = phase === 'question'
          setIsPlayingRound(nextIsPlayingRound)
          setChromeHidden(nextIsPlayingRound)
        }}
      />
    </div>
  )
}
