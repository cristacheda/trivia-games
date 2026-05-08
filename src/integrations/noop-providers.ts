import type {
  AnalyticsProvider,
  AuthProvider,
  ConsentProvider,
  ScoreSyncProvider,
} from '@/integrations/contracts'

export const noopAuthProvider: AuthProvider = {
  async signInWithGoogle() {},
  async signInWithGitHub() {},
  async signOut() {},
  async getSession() {
    return { userId: null }
  },
}

export const noopScoreSyncProvider: ScoreSyncProvider = {
  async syncRoundResult() {},
  async syncLocalSnapshot() {},
}

export const noopAnalyticsProvider: AnalyticsProvider = {
  trackPageView() {},
  trackEvent() {},
}

export const noopConsentProvider: ConsentProvider = {
  canTrackAnalytics() {
    return false
  },
  openConsentManager() {},
}
