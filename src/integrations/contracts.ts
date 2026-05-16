import type {
  GameId,
  RoundSyncPayload,
  SiteLeaderboardLookup,
  TrackingConsent,
} from '@/types/game'

export interface AuthSessionSummary {
  userId: string | null
  isAnonymous: boolean
}

export interface AuthProvider {
  signInWithGoogle: () => Promise<void>
  signInWithGitHub: () => Promise<void>
  signOut: () => Promise<void>
  getSession: () => Promise<AuthSessionSummary>
}

export interface ScoreSyncProvider {
  syncRoundResult: (payload: RoundSyncPayload) => Promise<void>
  syncLocalSnapshot: (playerId: string) => Promise<void>
  getSiteLeaderboard: (gameId: GameId) => Promise<SiteLeaderboardLookup>
}

export type AnalyticsEventName =
  | 'difficulty_selected'
  | 'game_viewed'
  | 'high_score_beaten'
  | 'homepage_card_clicked'
  | 'question_answered'
  | 'round_completed'
  | 'round_started'

export interface AnalyticsProvider {
  trackPageView: (path: string) => void
  trackEvent: (
    name: AnalyticsEventName,
    payload?: Record<string, string | number | boolean | null>,
  ) => void
}

export interface ConsentProvider {
  getTrackingConsent: () => TrackingConsent
  canTrackAnalytics: () => boolean
  setTrackingConsent: (consent: TrackingConsent) => void
}
