import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { TrackingConsent } from '@/types/game'

interface PrivacyPanelProps {
  trackingConsent: TrackingConsent
  onAllowTracking: () => void
  onDenyTracking: () => void
}

const trackingStatusCopy: Record<
  TrackingConsent,
  { label: string; summary: string; variant: 'accent' | 'outline' | 'success' }
> = {
  unknown: {
    label: 'Not decided',
    summary: 'Optional analytics stay off until you choose.',
    variant: 'accent',
  },
  granted: {
    label: 'Optional analytics on',
    summary: 'Usage events can be sent to help improve the games.',
    variant: 'success',
  },
  denied: {
    label: 'Optional analytics off',
    summary: 'The app keeps gameplay local and skips optional analytics.',
    variant: 'outline',
  },
}

export function PrivacyPanel({
  onAllowTracking,
  onDenyTracking,
  trackingConsent,
}: PrivacyPanelProps) {
  const status = trackingStatusCopy[trackingConsent]

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          <span className="text-sm text-muted-foreground">{status.summary}</span>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Privacy
          </p>
          <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight sm:text-2xl">
            Play anonymously and choose whether optional tracking is allowed.
          </h2>
        </div>
      </div>

      <div className="space-y-3 rounded-[22px] border border-white/70 bg-white/75 p-4">
        <h3 className="font-semibold">What stays on your device</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>High scores, recent results, deck progress, sound preference, and an anonymous local player id.</li>
          <li>No account is required to play. Optional sign-in and sync may appear when enabled, but anonymous play remains the default.</li>
          <li>Free-text answers are not sent to analytics.</li>
        </ul>
      </div>

      <div className="space-y-3 rounded-[22px] border border-white/70 bg-white/75 p-4">
        <h3 className="font-semibold">What optional analytics include</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Page views, game opens, difficulty choices, round starts, answer outcomes, round completion, and high-score events.</li>
          <li>These events help improve game balance and navigation, but they are off until you explicitly allow them.</li>
        </ul>
      </div>

      <div className="space-y-3 rounded-[22px] border border-white/70 bg-white/75 p-4">
        <h3 className="font-semibold">Hosting and essential operations</h3>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>The site host may still process basic request, delivery, and security telemetry needed to serve and protect the app.</li>
          <li>You can return here any time to change the optional analytics setting.</li>
        </ul>
      </div>

      <p className="text-sm text-muted-foreground">
        Read the full{' '}
        <Link className="font-semibold text-foreground underline underline-offset-4" to="/privacy">
          Privacy Policy
        </Link>{' '}
        for details about local storage, optional analytics, and data rights.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={onAllowTracking} size="sm">
          Allow optional analytics
        </Button>
        <Button onClick={onDenyTracking} size="sm" variant="outline">
          Use only essential storage
        </Button>
      </div>
    </div>
  )
}
