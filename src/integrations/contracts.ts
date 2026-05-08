import type { RoundResult } from '@/types/game'

export interface AuthProvider {
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  getSession: () => Promise<{ userId: string | null }>
}

export interface ScoreSyncProvider {
  syncRoundResult: (result: RoundResult) => Promise<void>
  syncLocalSnapshot: (playerId: string) => Promise<void>
}

export interface AnalyticsProvider {
  trackPageView: (path: string) => void
  trackEvent: (
    name:
      | 'game_viewed'
      | 'game_started'
      | 'question_answered'
      | 'round_completed'
      | 'high_score_beaten'
      | 'homepage_card_clicked',
    payload?: Record<string, string | number | boolean | null>,
  ) => void
}

export interface ConsentProvider {
  canTrackAnalytics: () => boolean
  openConsentManager: () => void
}
