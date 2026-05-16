import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, Globe2, Settings, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppServices } from '@/app/app-providers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useOnlineStatus } from '@/hooks/use-online-status'
import {
  getPlayerProfile,
  getPlayerId,
  setDisplayName,
  setSoundEnabled,
  useDisplayName,
  useSoundEnabled,
  useTrackingConsent,
} from '@/lib/storage'

export function SettingsPage() {
  const { auth, consent } = useAppServices()
  const isOnline = useOnlineStatus()
  const soundEnabled = useSoundEnabled()
  const trackingConsent = useTrackingConsent()
  const displayName = useDisplayName()
  const displayNameInputRef = useRef<HTMLInputElement>(null)
  const [cloudSessionSummary, setCloudSessionSummary] = useState({
    userId: null as string | null,
    isAnonymous: false,
  })
  const sessionSummary = isOnline
    ? cloudSessionSummary
    : {
        userId: null,
        isAnonymous: false,
      }

  useEffect(() => {
    let mounted = true

    if (!isOnline) {
      return () => {
        mounted = false
      }
    }

    void auth.getSession().then((session) => {
      if (mounted) {
        setCloudSessionSummary(session)
      }
    })

    return () => {
      mounted = false
    }
  }, [auth, isOnline])

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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Settings
        </p>
      </div>

      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-5xl">
          Settings and sync
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-lg">
          Manage the preferences stored on this device and see how your Supabase profile is connected.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              These settings still work locally first and sync when cloud access is available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] bg-white/65 p-4">
              <div>
                <p className="font-semibold">Leaderboard nickname</p>
                <p className="text-sm text-muted-foreground">
                  Used for local leaderboards for both anonymous and signed-in play.
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <Input
                  defaultValue={getPlayerProfile().displayName ?? ''}
                  key={displayName ?? 'empty-display-name'}
                  maxLength={32}
                  placeholder="Choose a nickname"
                  ref={displayNameInputRef}
                />
                <Button
                  onClick={() => setDisplayName(displayNameInputRef.current?.value ?? null)}
                  variant="secondary"
                >
                  Save nickname
                </Button>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">
                Current name: {displayName ?? 'Not set yet'}
              </p>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[24px] bg-white/65 p-4">
              <div>
                <p className="font-semibold">Game sounds</p>
                <p className="text-sm text-muted-foreground">
                  Correct, wrong, timer, and finish cues.
                </p>
              </div>
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant={soundEnabled ? 'secondary' : 'outline'}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {soundEnabled ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="rounded-[24px] bg-white/65 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Optional analytics</p>
                  <p className="text-sm text-muted-foreground">
                    Privacy preference for anonymous product analytics.
                  </p>
                </div>
                <Badge
                  variant={
                    trackingConsent === 'granted'
                      ? 'success'
                      : trackingConsent === 'denied'
                        ? 'outline'
                        : 'accent'
                  }
                >
                  {trackingConsent}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => consent.setTrackingConsent('granted')}
                  size="sm"
                  variant={trackingConsent === 'granted' ? 'secondary' : 'outline'}
                >
                  Allow
                </Button>
                <Button
                  onClick={() => consent.setTrackingConsent('denied')}
                  size="sm"
                  variant={trackingConsent === 'denied' ? 'secondary' : 'outline'}
                >
                  Deny
                </Button>
                <Button
                  onClick={() => consent.setTrackingConsent('unknown')}
                  size="sm"
                  variant={trackingConsent === 'unknown' ? 'secondary' : 'outline'}
                >
                  Ask me again
                </Button>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                Full legal details:
                {' '}
                <Link className="font-semibold text-foreground underline underline-offset-4" to="/privacy">
                  Privacy Policy
                </Link>
                {' '}
                and
                {' '}
                <Link className="font-semibold text-foreground underline underline-offset-4" to="/terms">
                  Terms of Service
                </Link>
                .
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-[linear-gradient(160deg,rgba(246,252,247,0.98)_0%,rgba(229,245,235,0.88)_100%)]">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Profile and sync status for this browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={sessionSummary.userId ? 'success' : 'accent'}>
                <Globe2 className="h-3.5 w-3.5" />
                {sessionSummary.userId
                  ? sessionSummary.isAnonymous
                    ? 'Anonymous sync'
                    : 'Google linked'
                  : 'Local only'}
              </Badge>
            </div>

            <div className="rounded-[24px] bg-white/65 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Nickname</p>
              <p className="mt-2 break-all">{displayName ?? 'Not set yet.'}</p>
            </div>

            <div className="rounded-[24px] bg-white/65 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Local profile id</p>
              <p className="mt-2 break-all">{getPlayerId()}</p>
            </div>

            <div className="rounded-[24px] bg-white/65 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Cloud session</p>
              <p className="mt-2 break-all">
                {sessionSummary.userId ?? 'No Supabase session detected yet.'}
              </p>
            </div>

            <div className="rounded-[24px] bg-white/65 p-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Settings className="h-4 w-4" />
                What syncs
              </div>
              <p className="mt-2">
                Profile settings, personal bests, recent round results, and round answer summaries.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
