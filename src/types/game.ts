export type GameId =
  | 'flag-quiz'
  | 'guess-the-capital'
  | 'outline-quiz'
  | 'guess-the-artist'
  | 'guess-the-currency'
  | 'guess-the-cocktail'
  | 'guess-the-official-language'

export type DifficultyId = 'level-1' | 'level-2' | 'level-3'
export type TrackingConsent = 'unknown' | 'granted' | 'denied'
export type QuestionCount = 10 | 20 | 30 | 40

export type AnswerMode = 'multiple-choice' | 'free-text'

export interface DifficultyRule {
  id: DifficultyId
  label: string
  prompt: string
  answerMode: AnswerMode
  optionCount: number | null
  timeLimitSeconds: number | null
  pointsPerCorrect: number
}

export interface HighScoreRecord {
  score: number
  achievedAt: string
  difficultyId: DifficultyId
}

export interface SiteLeaderboardEntry {
  gameId: GameId
  rank: number
  score: number
  achievedAt: string
  playerLabel?: string | null
  isCurrentPlayer: boolean
}

export type SiteLeaderboardLookup =
  | {
      status: 'coming-soon'
      entries: []
      playerRank: null
    }
  | {
      status: 'ready'
      entries: SiteLeaderboardEntry[]
      playerRank: SiteLeaderboardEntry | null
    }

export interface CountryDeckProgress {
  orderedCountryCodes: string[]
  nextIndex: number
}

export interface CapitalDeckProgress {
  orderedCountryCodes: string[]
  nextCountryIndex: number
  orderedStateCodes: string[]
  nextStateIndex: number
}

export interface OutlineDeckProgress {
  orderedCountryCodes: string[]
  nextCountryIndex: number
  orderedStateCodes: string[]
  nextStateIndex: number
}

export interface ArtistDeckProgress {
  orderedSongIds: string[]
  nextIndex: number
}

export interface CurrencyDeckProgress {
  orderedCountryCodes: string[]
  nextIndex: number
}

export interface CocktailDeckProgress {
  orderedRegularIds: string[]
  nextRegularIndex: number
  orderedObscureIds: string[]
  nextObscureIndex: number
}

export interface RoundResult {
  roundId: string
  gameId: GameId
  difficultyId: DifficultyId
  totalScore: number
  correctAnswers: number
  totalQuestions: number
  completedAt: string
  previousBestScore: number | null
  beatHighScore: boolean
}

export interface RoundSyncPayload {
  result: RoundResult
  roundDurationSeconds: number
  timeoutsCount: number
}

export interface GameLocalStats {
  highScore: HighScoreRecord | null
  recentResult: RoundResult | null
  lastDifficulty: DifficultyId | null
  questionCount: QuestionCount
  roundsPlayed: number
  countryDeck: CountryDeckProgress | null
  capitalDeck: CapitalDeckProgress | null
  outlineDeck: OutlineDeckProgress | null
  artistDeck: ArtistDeckProgress | null
  currencyDeck: CurrencyDeckProgress | null
  cocktailDeck: CocktailDeckProgress | null
}

export interface AppPreferences {
  soundEnabled: boolean
  trackingConsent: TrackingConsent
}

export interface PlayerProfile {
  displayName: string | null
}

export interface PersistedAppState {
  version: number
  playerId: string
  games: Partial<Record<GameId, GameLocalStats>>
  preferences: AppPreferences
  profile: PlayerProfile
}

export interface GameCatalogEntry {
  id: GameId
  title: string
  description: string
  status: 'ready' | 'coming-soon'
  offlineCapable: boolean
  difficultySet: DifficultyId[]
  comingSoon: boolean
  teaser?: string
  isNew?: boolean
}
