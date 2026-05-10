import type { DifficultyId } from '@/types/game'

export type CocktailPopularityTier = 'popular' | 'common' | 'obscure'

export interface CocktailQuestionSource {
  id: string
  name: string
  aliases: string[]
  category: string
  alcoholic: string
  imageLocalPath: string
  ingredients: string[]
  popularityTier: CocktailPopularityTier
  weightModifier: number
}

export interface GuessTheCocktailQuestion {
  id: string
  difficultyId: DifficultyId
  cocktail: CocktailQuestionSource
  options: CocktailQuestionSource[]
}
