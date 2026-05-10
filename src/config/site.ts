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
      'Spot country and state outlines quickly, with harder rounds leaning into smaller and less familiar geography.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
  },
  {
    id: 'guess-the-artist',
    title: 'Guess the Artist by Song',
    description:
      'Read a song title and identify the artist, with harder rounds shifting toward less obvious global tracks.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
  },
  {
    id: 'guess-the-currency',
    title: 'Guess the Currency',
    description:
      'Match countries to the currencies they actually use, with rounds that bias toward smaller and less-known nations.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
    isNew: true,
  },
  {
    id: 'guess-the-cocktail',
    title: 'Guess the Cocktail',
    description:
      'Look at the photo and name the cocktail — easier rounds stick to classics, harder ones reach for the obscure.',
    status: 'ready',
    offlineCapable: true,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: false,
    isNew: true,
  },
  {
    id: 'guess-the-official-language',
    title: 'Guess the Official Language',
    description:
      'Train on official languages without assuming one-country, one-language simplicity.',
    status: 'coming-soon',
    offlineCapable: false,
    difficultySet: ['level-1', 'level-2', 'level-3'],
    comingSoon: true,
    teaser: 'Built for countries with more than one official answer.',
  },
]

export function getGamePath(gameId: GameId) {
  return `/games/${gameId}`
}
