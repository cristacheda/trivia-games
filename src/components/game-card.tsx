import { Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getGamePath } from '@/config/site'
import type { GameCatalogEntry } from '@/types/game'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface GameCardProps {
  game: GameCatalogEntry
  eyebrow?: string
  footer?: React.ReactNode
  onOpen?: () => void
  onOpenLeaderboard?: () => void
}

export function GameCard({
  game,
  eyebrow,
  footer,
  onOpen,
  onOpenLeaderboard,
}: GameCardProps) {
  return (
    <Card
      className={cn(
        'group flex h-full flex-col border-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-52px_rgba(12,49,33,0.4)]',
        game.comingSoon && 'bg-secondary/30',
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {game.isNew && !game.comingSoon ? <Badge variant="default">New!</Badge> : null}
          {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
          {game.comingSoon ? <Badge variant="accent">Upcoming</Badge> : null}
        </div>
        <CardTitle className="flex items-start gap-3">
          <span>{game.title}</span>
          {game.comingSoon ? (
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent" />
          ) : null}
        </CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-5">
        {footer}
        {!game.comingSoon ? (
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="w-full" variant="secondary">
              <Link onClick={onOpen} to={getGamePath(game.id)}>
                Play now
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link onClick={onOpenLeaderboard} to={`${getGamePath(game.id)}#leaderboard`}>
                Leaderboard
              </Link>
            </Button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-accent">{game.teaser}</p>
        )}
      </CardContent>
    </Card>
  )
}
