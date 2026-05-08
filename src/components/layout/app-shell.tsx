import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ChevronRight,
  GitBranch,
  Globe2,
  Menu,
  RefreshCw,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppServices } from '@/app/app-providers'
import { AppChromeContext } from '@/components/layout/app-chrome'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildInfo } from '@/config/build'
import { gameCatalog, getGamePath, siteConfig } from '@/config/site'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePwaStatus } from '@/hooks/use-pwa-status'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const isOnline = useOnlineStatus()
  const { offlineReady, needRefresh, refreshApp } = usePwaStatus()
  const { analytics, auth, consent } = useAppServices()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [panelRoute, setPanelRoute] = useState<string | null>(null)
  const [sessionUserId, setSessionUserId] = useState<string | null>(null)
  const [chromeHidden, setChromeHidden] = useState(false)
  const isGameRoute = location.pathname.startsWith('/games/')
  const hideHeader = isGameRoute && chromeHidden
  const isMenuVisible = isMenuOpen && panelRoute === location.pathname
  const isAccountVisible = isAccountOpen && panelRoute === location.pathname
  const chromeContextValue = useMemo(
    () => ({
      chromeHidden,
      setChromeHidden,
    }),
    [chromeHidden],
  )

  useEffect(() => {
    analytics.trackPageView(location.pathname)
  }, [analytics, location.pathname])

  useEffect(() => {
    let mounted = true

    void auth.getSession().then((session) => {
      if (mounted) {
        setSessionUserId(session.userId)
      }
    })

    return () => {
      mounted = false
    }
  }, [auth])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsAccountOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <AppChromeContext.Provider value={chromeContextValue}>
      <div className="min-h-screen bg-background">
        {(isMenuVisible || isAccountVisible) ? (
          <button
            aria-label="Close panel overlay"
            className="fixed inset-0 z-10 bg-[#0c2319]/18 backdrop-blur-[2px]"
            onClick={() => {
              setIsMenuOpen(false)
              setIsAccountOpen(false)
            }}
            type="button"
          />
        ) : null}

        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 py-2 sm:px-4 sm:py-3">
          {!hideHeader ? (
            <header
              className={cn(
                'relative z-20',
                isGameRoute
                  ? 'border-b border-white/55 pb-3 pt-2'
                  : 'border-b border-white/55 pb-4 pt-2',
              )}
            >
              <div className="flex items-start justify-between gap-2 sm:items-center sm:gap-4">
                <Link className="inline-flex min-w-0 flex-1 items-center gap-2.5 pr-2" to="/">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-2xl shadow-md shadow-primary/15 ring-1 ring-black/5 sm:h-10 sm:w-10">
                    <img
                      alt={`${siteConfig.title} logo`}
                      className="h-full w-full object-cover"
                      loading="eager"
                      src="/atlas.png"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg font-semibold tracking-tight sm:text-2xl">
                      {siteConfig.title}
                    </p>
                    <p className="hidden truncate text-xs text-muted-foreground sm:block sm:text-sm">
                      {isGameRoute ? 'Play mode' : siteConfig.tagline}
                    </p>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                  {needRefresh ? (
                    <Button onClick={refreshApp} size="sm" variant="secondary">
                      <RefreshCw className="h-4 w-4" />
                      <span>Update app</span>
                    </Button>
                  ) : null}
                  <Button
                    aria-label="Menu"
                    aria-expanded={isMenuVisible}
                    className="px-3"
                    onClick={() => {
                      setPanelRoute(location.pathname)
                      setIsMenuOpen((current) => !current || panelRoute !== location.pathname)
                      setIsAccountOpen(false)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    {isMenuVisible ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    <span className="hidden sm:inline">Menu</span>
                  </Button>
                  <Button
                    aria-label="Account"
                    aria-expanded={isAccountVisible}
                    className="px-3"
                    onClick={() => {
                      setPanelRoute(location.pathname)
                      setIsAccountOpen(
                        (current) => !current || panelRoute !== location.pathname,
                      )
                      setIsMenuOpen(false)
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <UserRound className="h-4 w-4" />
                    <span className="hidden sm:inline">Account</span>
                  </Button>
                </div>
              </div>

              {isMenuVisible ? (
                <div className="absolute right-0 top-[calc(100%-0.25rem)] z-30 w-[min(22rem,calc(100vw-1.5rem))] rounded-[24px] border border-white/70 bg-[#f7fbf6]/95 p-4 shadow-[0_24px_72px_-36px_rgba(12,49,33,0.35)] backdrop-blur-xl sm:w-[min(24rem,calc(100vw-2rem))] sm:p-5">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Status
                      </p>
                      <div className="flex flex-wrap gap-2">
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
                        <Badge variant="outline">
                          {needRefresh
                            ? 'New version ready to install'
                            : offlineReady
                              ? 'Playable games cached for offline replay'
                              : 'Offline cache after first load'}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Explore
                      </p>
                      <nav className="grid gap-2">
                        <Link
                          className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
                          to="/"
                        >
                          Home
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        {gameCatalog
                          .filter((game) => !game.comingSoon)
                          .map((game) => (
                            <Link
                              className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold transition hover:bg-white"
                              key={game.id}
                              to={getGamePath(game.id)}
                            >
                              {game.title}
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </Link>
                          ))}
                      </nav>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
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
              ) : null}

              {isAccountVisible ? (
                <div className="absolute right-0 top-[calc(100%-0.25rem)] z-30 w-[min(20rem,calc(100vw-1.5rem))] rounded-[24px] border border-white/70 bg-[#f7fbf6]/95 p-4 shadow-[0_24px_72px_-36px_rgba(12,49,33,0.35)] backdrop-blur-xl sm:w-[min(22rem,calc(100vw-2rem))] sm:p-5">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        Account
                      </p>
                      <h2 className="mt-2 font-serif text-xl font-semibold tracking-tight sm:text-2xl">
                        {sessionUserId ? 'Signed in' : 'Save your progress later'}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {sessionUserId
                          ? `Session id: ${sessionUserId}`
                          : 'Anonymous play stays local. Login remains optional and is still stubbed for future sync.'}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <Button onClick={() => void auth.signInWithGoogle()} variant="secondary">
                        Continue with Google
                      </Button>
                      <Button onClick={() => void auth.signInWithGitHub()} variant="outline">
                        Continue with GitHub
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Local scores still work without an account.
                    </p>
                  </div>
                </div>
              ) : null}
            </header>
          ) : null}

          <main
            className={cn(
              'relative z-0 flex-1',
              hideHeader
                ? 'py-0'
                : isGameRoute
                  ? 'pb-5 pt-3 sm:pb-6 sm:pt-4'
                  : 'py-4 sm:py-6',
            )}
          >
            {children}
          </main>

          {!isGameRoute ? (
            <footer className="border-t border-white/55 py-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-end">
                <span className="font-medium">
                  v{buildInfo.version} · {buildInfo.shortCommitSha}
                </span>
              </div>
            </footer>
          ) : null}
        </div>
      </div>
    </AppChromeContext.Provider>
  )
}
