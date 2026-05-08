import { useEffect, type ReactNode } from 'react'
import { GitBranch, Globe2, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { buildInfo } from '@/config/build'
import { gameCatalog, siteConfig } from '@/config/site'
import { useAppServices } from '@/app/app-providers'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePwaStatus } from '@/hooks/use-pwa-status'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const { offlineReady, needRefresh, refreshApp } = usePwaStatus()
  const { analytics, consent } = useAppServices()

  useEffect(() => {
    analytics.trackPageView(location.pathname)
  }, [analytics, location.pathname])

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 sm:py-6">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[36px] border border-white/70 bg-white/40 shadow-[0_30px_120px_-60px_rgba(24,37,48,0.75)] backdrop-blur-xl">
        <header className="border-b border-white/70 px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Link className="inline-flex items-center gap-3" to="/">
                <div className="h-11 w-11 overflow-hidden rounded-2xl shadow-lg shadow-primary/20 ring-1 ring-black/5">
                  <img
                    alt={`${siteConfig.title} logo`}
                    className="h-full w-full object-cover"
                    loading="eager"
                    src="/atlas.png"
                  />
                </div>
                <div>
                  <p className="font-serif text-2xl font-semibold tracking-tight">
                    {siteConfig.title}
                  </p>
                  <p className="text-sm text-muted-foreground">{siteConfig.tagline}</p>
                </div>
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isOnline ? 'success' : 'accent'}>
                  {isOnline ? (
                    <>
                      <Wifi className="h-3.5 w-3.5" />
                      Online
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3.5 w-3.5" />
                      Offline
                    </>
                  )}
                </Badge>
                {offlineReady ? (
                  <Badge variant="default">Flag quiz cached for offline replay</Badge>
                ) : (
                  <Badge variant="outline">Offline cache activates after the first load</Badge>
                )}
                <Badge variant="outline">Google and GitHub sync planned next</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <nav className="flex flex-wrap items-center gap-2">
                {gameCatalog.map((game) => {
                  const href =
                    game.id === 'flag-quiz' ? '/games/flag-quiz' : '/'

                  return (
                    <Link
                      key={game.id}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                        location.pathname === href
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/55 text-foreground hover:bg-white',
                      )}
                      to={href}
                    >
                      {game.title}
                    </Link>
                  )
                })}
              </nav>

              <div className="flex items-center gap-2">
                {needRefresh ? (
                  <Button onClick={refreshApp} size="sm" variant="secondary">
                    <RefreshCw className="h-4 w-4" />
                    Update ready
                  </Button>
                ) : null}
                <Button
                  onClick={consent.openConsentManager}
                  size="sm"
                  variant="outline"
                >
                  <Globe2 className="h-4 w-4" />
                  Privacy
                </Button>
                <Button asChild size="sm" variant="outline">
                  <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
                    <GitBranch className="h-4 w-4" />
                    GitHub
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">{children}</main>

        <footer className="border-t border-white/70 px-5 py-4 text-sm text-muted-foreground sm:px-8">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Built as a static-first app for cheap hosting, Cloudflare delivery,
              and later Supabase sync.
            </span>
            <span className="font-medium">
              v{buildInfo.version} · {buildInfo.shortCommitSha}
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
