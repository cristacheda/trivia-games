import type { DifficultyId } from '@/types/game'

export interface CurrencyQuestionSource {
  code: string
  name: string
  officialName: string
  aliases: string[]
  region: string
  subregion: string
  population: number
  area: number
  flagEmoji: string
  currencyCode: string
  currencyName: string
  currencySymbol: string
  weightModifier: number
}

export interface GuessTheCurrencyQuestion {
  id: string
  difficultyId: DifficultyId
  subject: CurrencyQuestionSource
  options: CurrencyQuestionSource[]
}
