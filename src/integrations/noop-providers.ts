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
    return {
      userId: null,
      isAnonymous: false,
    }
  },
}

export const noopScoreSyncProvider: ScoreSyncProvider = {
  async syncRoundResult() {},
  async syncLocalSnapshot() {},
  async getSiteLeaderboard() {
    return {
      status: 'coming-soon',
      entries: [],
      playerRank: null,
    }
  },
}

export const noopAnalyticsProvider: AnalyticsProvider = {
  trackPageView() {},
  trackEvent() {},
}

export const noopConsentProvider: ConsentProvider = {
  getTrackingConsent() {
    return 'unknown'
  },
  canTrackAnalytics() {
    return false
  },
  setTrackingConsent() {},
}
