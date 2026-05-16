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
    title: 'Guess the Country by Its Flag | Atlas of Answers',
    description:
      'Train on country flags with three difficulty modes, local progress saves, and fast repeat rounds.',
  },
  '/games/guess-the-capital': {
    title: 'Guess the Capital of the Country | Atlas of Answers',
    description:
      'Match countries and US states to their capitals across timed and untimed rounds with local scoring.',
  },
  '/games/outline-quiz': {
    title: 'Guess the Country by Its Outline | Atlas of Answers',
    description:
      'Identify countries and states by outline through escalating quiz modes designed for rapid practice.',
  },
  '/games/guess-the-artist': {
    title: 'Guess the Artist by the Song | Atlas of Answers',
    description:
      'Identify song artists across multiple-choice and free-text rounds with local score tracking.',
  },
  '/games/guess-the-currency': {
    title: 'Guess the Currency of the Country | Atlas of Answers',
    description:
      'Match currencies to the countries that use them across timed and untimed rounds with local score tracking.',
  },
  '/games/guess-the-cocktail': {
    title: 'Guess the Cocktail | Atlas of Answers',
    description:
      'Identify cocktails from photos across easy, medium, and hard difficulty levels with local score tracking.',
  },
  '/settings': {
    title: 'Settings | Atlas of Answers',
    description:
      'Manage sound, privacy, and account sync preferences for Atlas of Answers.',
  },
  '/terms': {
    title: 'Terms of Service | Atlas of Answers',
    description:
      'Review the terms that govern access to Atlas of Answers, including anonymous play and acceptable use.',
  },
  '/privacy': {
    title: 'Privacy Policy | Atlas of Answers',
    description:
      'Learn how Atlas of Answers handles local storage, optional analytics, and privacy choices.',
  },
  '*': {
    title: `Page Not Found | ${siteConfig.title}`,
    description: defaultDescription,
  },
}

export function getRouteSeo(pathname: string): RouteSeo {
  return routeSeo[pathname] ?? routeSeo['*']
}
