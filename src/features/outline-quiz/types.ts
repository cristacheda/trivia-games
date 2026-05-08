import type { DifficultyId } from '@/types/game'

export type OutlineSubjectKind = 'country' | 'state'
export type OutlineFamiliarityBand = 'common' | 'standard' | 'niche'

export interface OutlineQuestionSource {
  code: string
  kind: OutlineSubjectKind
  name: string
  officialName: string
  aliases: string[]
  region: string
  subregion: string
  population: number | null
  area: number | null
  familiarityBand: OutlineFamiliarityBand
  flagEmoji: string
  outlinePath: string
  outlineViewBox: string
  baseWeight: number
  hardWeight: number
}

export interface OutlineQuizQuestion {
  id: string
  difficultyId: DifficultyId
  subject: OutlineQuestionSource
  options: OutlineQuestionSource[]
}
