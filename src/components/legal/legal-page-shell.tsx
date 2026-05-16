import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LegalPageShellProps {
  title: string
  description: string
  eyebrow: string
  updatedLabel: string
  children: ReactNode
}

export function LegalPageShell({
  title,
  description,
  eyebrow,
  updatedLabel,
  children,
}: LegalPageShellProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-white"
          to="/"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to games
        </Link>
        <Badge variant="outline">{updatedLabel}</Badge>
      </div>

      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>

      <Card className="border-primary/10 bg-[linear-gradient(180deg,rgba(249,253,249,0.96)_0%,rgba(239,247,240,0.9)_100%)]">
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-2xl tracking-tight sm:text-3xl">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-7 text-foreground/92 sm:text-[1.01rem]">
          {children}
        </CardContent>
      </Card>
    </div>
  )
}

interface LegalSectionProps {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export function LegalSection({ heading, paragraphs, bullets }: LegalSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
        {heading}
      </h2>
      {paragraphs?.map((paragraph) => (
        <p key={paragraph} className="text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {bullets ? (
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          {bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
