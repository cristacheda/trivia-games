import { ChevronRight, Sparkles } from 'lucide-react'
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
}

export function GameCard({ game, eyebrow, footer, onOpen }: GameCardProps) {
  const content = (
    <Card
      className={cn(
        'group h-full border-white/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-52px_rgba(12,49,33,0.4)]',
        game.comingSoon && 'bg-secondary/30',
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          {game.isNew && !game.comingSoon ? <Badge variant="default">New!</Badge> : null}
          {eyebrow ? <Badge variant="outline">{eyebrow}</Badge> : null}
          {game.offlineCapable ? (
            <Badge data-testid={`offline-badge-${game.id}`} variant="success">
              Offline-ready
            </Badge>
          ) : null}
          {game.comingSoon ? <Badge variant="accent">Upcoming</Badge> : null}
        </div>
        <CardTitle className="flex items-start justify-between gap-3">
          <span>{game.title}</span>
          {!game.comingSoon ? (
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          ) : (
            <Sparkles className="mt-1 h-5 w-5 shrink-0 text-accent" />
          )}
        </CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex h-full flex-col justify-between gap-5">
        {footer}
        {!game.comingSoon ? (
          <Button className="w-fit" variant="secondary">
            Play now
          </Button>
        ) : (
          <p className="text-sm font-semibold text-accent">{game.teaser}</p>
        )}
      </CardContent>
    </Card>
  )

  if (game.comingSoon) {
    return content
  }

  return (
    <Link onClick={onOpen} to={getGamePath(game.id)}>
      {content}
    </Link>
  )
}
