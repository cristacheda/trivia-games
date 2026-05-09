import type { DifficultyId } from '@/types/game'

export type ArtistPopularityTier = 'popular' | 'global' | 'obscure'

export interface SongQuestionSource {
  id: string
  songTitle: string
  artistName: string
  aliases: string[]
  era: string
  region: string
  popularityTier: ArtistPopularityTier
  weightModifier: number
}

export interface GuessTheArtistQuestion {
  id: string
  difficultyId: DifficultyId
  subject: SongQuestionSource
  options: string[]
}
