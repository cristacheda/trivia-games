/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import type {
  AnalyticsProvider,
  AuthProvider,
  ConsentProvider,
  ScoreSyncProvider,
} from '@/integrations/contracts'
import {
  noopAnalyticsProvider,
  noopAuthProvider,
  noopConsentProvider,
  noopScoreSyncProvider,
} from '@/integrations/noop-providers'

interface AppServices {
  auth: AuthProvider
  scoreSync: ScoreSyncProvider
  analytics: AnalyticsProvider
  consent: ConsentProvider
}

const AppServicesContext = createContext<AppServices | null>(null)

export function AppProviders({ children }: PropsWithChildren) {
  const services = useMemo<AppServices>(
    () => ({
      auth: noopAuthProvider,
      scoreSync: noopScoreSyncProvider,
      analytics: noopAnalyticsProvider,
      consent: noopConsentProvider,
    }),
    [],
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
