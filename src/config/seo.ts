import { siteConfig } from '@/config/site'

export type RouteSeo = {
  title: string
  description: string
}

const defaultDescription = siteConfig.description

export const routeSeo: Record<string, RouteSeo> = {
  '/': {
    title: `${siteConfig.title} | Home`,
    description:
      'Practice trivia with polished geography rounds, local score tracking, and mobile-first game flow.',
  },
  '/games/flag-quiz': {
    title: 'Name the Country Flag | Atlas of Answers',
    description:
      'Train on country flags with three difficulty modes, local progress saves, and fast repeat rounds.',
  },
  '/games/guess-the-capital': {
    title: 'Guess the Capital | Atlas of Answers',
    description:
      'Match countries and US states to their capitals across timed and untimed rounds with local scoring.',
  },
  '/games/outline-quiz': {
    title: 'Name the Country by Its Outline | Atlas of Answers',
    description:
      'Identify countries and states by outline through escalating quiz modes designed for rapid practice.',
  },
  '/games/guess-the-artist': {
    title: 'Guess the Artist by Song | Atlas of Answers',
    description:
      'Identify song artists across multiple-choice and free-text rounds with local score tracking.',
  },
  '*': {
    title: `Page Not Found | ${siteConfig.title}`,
    description: defaultDescription,
  },
}

export function getRouteSeo(pathname: string): RouteSeo {
  return routeSeo[pathname] ?? routeSeo['*']
}
