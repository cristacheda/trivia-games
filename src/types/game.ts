export type GameId = 'flag-quiz' | 'guess-the-capital' | 'outline-quiz'

export type DifficultyId = 'level-1' | 'level-2' | 'level-3'

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

export interface RoundResult {
  gameId: GameId
  difficultyId: DifficultyId
  totalScore: number
  correctAnswers: number
  totalQuestions: number
  completedAt: string
  previousBestScore: number | null
  beatHighScore: boolean
}

export interface GameLocalStats {
  highScore: HighScoreRecord | null
  recentResult: RoundResult | null
  lastDifficulty: DifficultyId | null
  countryDeck: CountryDeckProgress | null
  capitalDeck: CapitalDeckProgress | null
}

export interface AppPreferences {
  soundEnabled: boolean
}

export interface PersistedAppState {
  version: number
  playerId: string
  games: Partial<Record<GameId, GameLocalStats>>
  preferences: AppPreferences
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
}
