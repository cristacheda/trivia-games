import type { GameCatalogEntry, GameId } from '@/types/game'

export const siteConfig = {
  title: 'Atlas of Answers',
  tagline: 'A thoughtful collection of trivia training games.',
  description:
    'Train for pub quizzes and stage contests with fast, elegant practice rounds built for repetition.',
  githubUrl: 'https://github.com/cristacheda/trivia-games',
  productionUrl:
    import.meta.env.VITE_APP_BASE_URL || 'https://triviagames.cristache.net',
} as const

export const gameCatalog: GameCatalogEntry[] = [
  {
    id: 'flag-quiz',
    title: 'Name the Country Flag',
    description:
      'Spot national flags quickly, with a bias toward countries that most European players see less often.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
  },
  {
    id: 'guess-the-capital',
    title: 'Guess the Capital',
    description:
      'Match UN countries and US states to their capitals, with tougher rounds steering toward more obscure geography.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
  },
  {
    id: 'outline-quiz',
    title: 'Name the Country by Its Outline',
    description:
      'A shape-first challenge built for geography specialists and people who enjoy getting humbled.',
    status: 'coming-soon',
    offlineCapable: false,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: true,
    teaser: 'Coming after the flag quiz review cycle.',
  },
]

export function getGamePath(gameId: GameId) {
  return `/games/${gameId}`
}
