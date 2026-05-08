import type { PropsWithChildren } from 'react'
import { AppServicesContext } from '@/app/app-providers'
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

export function AppServicesContextForTests({
  analytics = noopAnalyticsProvider,
  auth = noopAuthProvider,
  children,
  consent = noopConsentProvider,
  scoreSync = noopScoreSyncProvider,
}: PropsWithChildren<Partial<AppServices>>) {
  return (
    <AppServicesContext.Provider
      value={{ analytics, auth, consent, scoreSync }}
    >
      {children}
    </AppServicesContext.Provider>
  )
}
