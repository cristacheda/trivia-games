/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import { env } from '@/config/env'
import type {
  AnalyticsProvider,
  AuthProvider,
  ConsentProvider,
  ScoreSyncProvider,
} from '@/integrations/contracts'
import { createGa4AnalyticsProvider } from '@/integrations/ga4-provider'
import { createLocalConsentProvider } from '@/integrations/local-consent-provider'
import {
  noopAnalyticsProvider,
  noopAuthProvider,
  noopScoreSyncProvider,
} from '@/integrations/noop-providers'

interface AppServices {
  auth: AuthProvider
  scoreSync: ScoreSyncProvider
  analytics: AnalyticsProvider
  consent: ConsentProvider
}

export const AppServicesContext = createContext<AppServices | null>(null)

export function AppProviders({ children }: PropsWithChildren) {
  const consent = useMemo<ConsentProvider>(() => createLocalConsentProvider(), [])
  const services = useMemo<AppServices>(
    () => ({
      auth: noopAuthProvider,
      scoreSync: noopScoreSyncProvider,
      analytics: env.analyticsMeasurementId
        ? createGa4AnalyticsProvider({
            canTrack: () => consent.canTrackAnalytics(),
            measurementId: env.analyticsMeasurementId,
          })
        : noopAnalyticsProvider,
      consent,
    }),
    [consent],
  )

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
