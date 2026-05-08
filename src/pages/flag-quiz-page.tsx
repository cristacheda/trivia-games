import { Badge } from '@/components/ui/badge'
import { FlagQuizGame } from '@/features/flag-quiz/components/flag-quiz-game'

export function FlagQuizPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">Offline-capable after first load</Badge>
          <Badge variant="outline">Data stored locally</Badge>
          <Badge variant="outline">193 UN member countries</Badge>
        </div>
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
            Name the Country Flag
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-muted-foreground">
            A fast recognition drill with stronger weighting for countries outside Europe, plus gentle spelling tolerance on the typed mode.
          </p>
        </div>
      </div>

      <FlagQuizGame />
    </div>
  )
}
