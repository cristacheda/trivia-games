/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react'
import { env } from '@/config/env'
import { useOnlineStatus } from '@/hooks/use-online-status'
import type {
  AnalyticsProvider,
  AuthProvider,
  ConsentProvider,
  ScoreSyncProvider,
} from '@/integrations/contracts'
import { createLocalConsentProvider } from '@/integrations/local-consent-provider'
import {
  noopAnalyticsProvider,
  noopAuthProvider,
  noopScoreSyncProvider,
} from '@/integrations/noop-providers'
import { createPostHogAnalyticsProvider } from '@/integrations/posthog-provider'
import {
  createSupabaseAuthProvider,
  createSupabaseScoreSyncProvider,
  getSupabaseBrowserClient,
} from '@/integrations/supabase-providers'
import { STORAGE_EVENT, getPlayerId } from '@/lib/storage'

interface AppServices {
  auth: AuthProvider
  scoreSync: ScoreSyncProvider
  analytics: AnalyticsProvider
  consent: ConsentProvider
}

export const AppServicesContext = createContext<AppServices | null>(null)

export function AppProviders({ children }: PropsWithChildren) {
  const consent = useMemo<ConsentProvider>(() => createLocalConsentProvider(), [])
  const isOnline = useOnlineStatus()
  const supabaseClient = useMemo(() => getSupabaseBrowserClient(), [])
  const auth = useMemo<AuthProvider>(
    () => (supabaseClient ? createSupabaseAuthProvider(supabaseClient) : noopAuthProvider),
    [supabaseClient],
  )
  const scoreSync = useMemo<ScoreSyncProvider>(
    () =>
      supabaseClient
        ? createSupabaseScoreSyncProvider(supabaseClient)
        : noopScoreSyncProvider,
    [supabaseClient],
  )
  const services = useMemo<AppServices>(
    () => ({
      auth,
      scoreSync,
      analytics: env.posthogKey
        ? createPostHogAnalyticsProvider({
            apiHost: env.posthogHost,
            canTrack: () => consent.canTrackAnalytics(),
            token: env.posthogKey,
          })
        : noopAnalyticsProvider,
      consent,
    }),
    [auth, consent, scoreSync],
  )

  useEffect(() => {
    if (!supabaseClient) {
      return
    }

    let cancelled = false
    let syncTimeoutId: number | null = null

    const scheduleSnapshotSync = () => {
      if (!isOnline) {
        return
      }

      if (syncTimeoutId) {
        window.clearTimeout(syncTimeoutId)
      }

      syncTimeoutId = window.setTimeout(() => {
        void auth
          .getSession()
          .then((session) => {
            if (cancelled || !session.userId) {
              return
            }

            return scoreSync.syncLocalSnapshot(getPlayerId())
          })
          .catch(() => undefined)
      }, 150)
    }

    scheduleSnapshotSync()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(() => {
      scheduleSnapshotSync()
    })

    window.addEventListener(STORAGE_EVENT, scheduleSnapshotSync)
    window.addEventListener('storage', scheduleSnapshotSync)

    return () => {
      cancelled = true
      if (syncTimeoutId) {
        window.clearTimeout(syncTimeoutId)
      }
      subscription.unsubscribe()
      window.removeEventListener(STORAGE_EVENT, scheduleSnapshotSync)
      window.removeEventListener('storage', scheduleSnapshotSync)
    }
  }, [auth, isOnline, scoreSync, supabaseClient])

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  )
}

export function useAppServices() {
  const value = useContext(AppServicesContext)

  if (!value) {
    throw new Error('useAppServices must be used within AppProviders')
  }

  return value
}
