import type { DifficultyId } from '@/types/game'

export interface CountryQuestionSource {
  code: string
  name: string
  officialName: string
  aliases: string[]
  region: string
  subregion: string
  population: number
  area: number
  flagEmoji: string
  weightModifier: number
}

export interface FlagQuizQuestion {
  id: string
  difficultyId: DifficultyId
  country: CountryQuestionSource
  options: CountryQuestionSource[]
}
