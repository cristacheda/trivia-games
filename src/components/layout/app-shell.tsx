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
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppServices } from '@/app/app-providers'
import { AppChromeContext } from '@/components/layout/app-chrome'
import { shellLogoSrc } from '@/components/layout/shell-logo'
import { PrivacyPanel } from '@/components/privacy-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { buildInfo } from '@/config/build'
import { gameCatalog, getGamePath, siteConfig } from '@/config/site'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePwaStatus } from '@/hooks/use-pwa-status'
import { getTrackingConsent, useTrackingConsent } from '@/lib/storage'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const shouldPromptForTrackingOnLoad = getTrackingConsent() === 'unknown'
  const isOnline = useOnlineStatus()
  const { needRefresh, refreshApp } = usePwaStatus()
  const { analytics, auth, consent } = useAppServices()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(shouldPromptForTrackingOnLoad)
  const [panelRoute, setPanelRoute] = useState<string | null>(
    shouldPromptForTrackingOnLoad ? location.pathname : null,
  )
  const [cloudSessionSummary, setCloudSessionSummary] = useState({
    userId: null as string | null,
    isAnonymous: false,
  })
  const [accountError, setAccountError] = useState<string | null>(null)
  const [accountPending, setAccountPending] = useState(false)
  const [chromeHidden, setChromeHidden] = useState(false)
  const trackingConsent = useTrackingConsent()
  const isGameRoute = location.pathname.startsWith('/games/')
  const hideHeader = isGameRoute && chromeHidden
  const isMenuVisible = isMenuOpen && panelRoute === location.pathname
  const isAccountVisible = isAccountOpen && panelRoute === location.pathname
  const isPrivacyVisible = isPrivacyOpen && panelRoute === location.pathname
  const chromeContextValue = useMemo(
    () => ({
      chromeHidden,
      setChromeHidden,
    }),
    [chromeHidden],
  )
  const sessionSummary = isOnline
    ? cloudSessionSummary
    : {
        userId: null,
        isAnonymous: false,
      }

  useEffect(() => {
    analytics.trackPageView(location.pathname)
  }, [analytics, location.pathname, trackingConsent])

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
        setIsAccountOpen(false)
        setIsPrivacyOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const closePanels = () => {
    setIsMenuOpen(false)
    setIsAccountOpen(false)
    setIsPrivacyOpen(false)
  }

  const handleGoogleAuth = async () => {
    setAccountError(null)
    setAccountPending(true)

    try {
      await auth.signInWithGoogle()
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Google sign-in failed.')
    } finally {
      setAccountPending(false)
    }
  }

  const googleButtonLabel = accountPending
    ? 'Opening Google...'
    : sessionSummary.userId && sessionSummary.isAnonymous
      ? 'Link Google account'
      : 'Continue with Google'

  const handleSignOut = async () => {
    setAccountError(null)
    setAccountPending(true)

    try {
      await auth.signOut()
      setCloudSessionSummary({
        userId: null,
        isAnonymous: false,
      })
      closePanels()
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Sign out failed.')
    } finally {
      setAccountPending(false)
    }
  }

  const openSettings = () => {
    closePanels()
    void navigate('/settings')
  }

  const openPrivacyPanel = () => {
    setPanelRoute(location.pathname)
    setIsPrivacyOpen(true)
    setIsMenuOpen(false)
    setIsAccountOpen(false)
  }

  return (
    <AppChromeContext.Provider value={chromeContextValue}>
      <div className="min-h-screen bg-background">
        {(isMenuVisible || isAccountVisible || isPrivacyVisible) ? (
          <button
            aria-label="Close panel overlay"
            className="fixed inset-0 z-10 bg-[#0c2319]/18 backdrop-blur-[2px]"
            onClick={closePanels}
            type="button"
          />
        ) : null}

        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-3 pt-2 sm:px-4 sm:pt-3">
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
                      src={shellLogoSrc}
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
                      setIsPrivacyOpen(false)
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
                      setIsPrivacyOpen(false)
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
                        onClick={() => {
                          if (panelRoute !== location.pathname || !isPrivacyVisible) {
                            openPrivacyPanel()
                            return
                          }

                          setIsPrivacyOpen(false)
                          setIsMenuOpen(false)
                          setIsAccountOpen(false)
                        }}
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

                    <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      <Link className="underline-offset-4 hover:underline" to="/privacy">
                        Privacy Policy
                      </Link>
                      <Link className="underline-offset-4 hover:underline" to="/terms">
                        Terms of Service
                      </Link>
                    </nav>
                  </div>
                </div>
              ) : null}

              {isPrivacyVisible ? (
                <div className="absolute right-0 top-[calc(100%-0.25rem)] z-30 w-[min(28rem,calc(100vw-1.5rem))] rounded-[24px] border border-white/70 bg-[#f7fbf6]/95 p-4 shadow-[0_24px_72px_-36px_rgba(12,49,33,0.35)] backdrop-blur-xl sm:w-[min(32rem,calc(100vw-2rem))] sm:p-5">
                  <PrivacyPanel
                    onAllowTracking={() => {
                      consent.setTrackingConsent('granted')
                      closePanels()
                    }}
                    onDenyTracking={() => {
                      consent.setTrackingConsent('denied')
                      closePanels()
                    }}
                    trackingConsent={trackingConsent}
                  />
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
                        {sessionSummary.userId
                          ? sessionSummary.isAnonymous
                            ? 'Cloud sync is active'
                            : 'Signed in with Google'
                          : 'Save your progress later'}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {sessionSummary.userId
                          ? sessionSummary.isAnonymous
                            ? 'Anonymous play now syncs scores and settings to your Supabase profile. Link Google any time to keep the same profile.'
                            : `Session id: ${sessionSummary.userId}`
                          : 'Anonymous play still works locally. Once Supabase auth initializes, progress can sync without forcing a login.'}
                      </p>
                    </div>

                    <div className="grid gap-2">
                      {sessionSummary.userId && !sessionSummary.isAnonymous ? (
                        <>
                          <Button onClick={openSettings} variant="secondary">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Button>
                          <Button
                            disabled={accountPending}
                            onClick={() => void handleSignOut()}
                            variant="outline"
                          >
                            <LogOut className="h-4 w-4" />
                            {accountPending ? 'Signing out...' : 'Sign out'}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            disabled={accountPending}
                            onClick={() => void handleGoogleAuth()}
                            variant="secondary"
                          >
                            {googleButtonLabel}
                          </Button>
                          <Button onClick={openSettings} variant="outline">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Button>
                        </>
                      )}
                    </div>

                    {accountError ? (
                      <p className="rounded-2xl bg-[#fff0ea] px-3 py-2 text-sm text-[#8a3d1f]">
                        {accountError}
                      </p>
                    ) : null}

                    <p className="text-xs text-muted-foreground">
                      {sessionSummary.userId
                        ? sessionSummary.isAnonymous
                          ? 'Cloud sync is active for this anonymous profile. Link Google later to keep the same history.'
                          : 'Cloud sync is active for this signed-in profile.'
                        : 'Local play still works offline. Cloud sync starts once a Supabase session is available.'}
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link className="underline-offset-4 hover:underline" to="/privacy">
                    Privacy Policy
                  </Link>
                  <Link className="underline-offset-4 hover:underline" to="/terms">
                    Terms of Service
                  </Link>
                </nav>
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
