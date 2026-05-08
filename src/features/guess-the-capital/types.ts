import type { DifficultyId } from '@/types/game'

export type CapitalSubjectKind = 'country' | 'state'

export interface CapitalQuestionSource {
  code: string
  kind: CapitalSubjectKind
  name: string
  region: string
  subregion: string
  population: number
  area: number
  capital: string
  capitalAliases: string[]
  weightModifier: number
}

export interface GuessTheCapitalQuestion {
  id: string
  difficultyId: DifficultyId
  subject: CapitalQuestionSource
  options: string[]
}
