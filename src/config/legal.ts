import { env } from '@/config/env'
import { siteConfig } from '@/config/site'

type LegalSection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

type LegalContact = {
  operatorName: string
  contactEmailLocalPart: string
  contactEmailDomainParts: string[]
  mailingAddress: string | null
  effectiveDate: string
  governingLaw: string
  venue: string
}

type LegalProcessor = {
  name: string
  purpose: string
}

export const legalContact: LegalContact = {
  operatorName: 'Dragoș Cristache',
  contactEmailLocalPart: 'dragos',
  contactEmailDomainParts: ['cristache', 'net'],
  mailingAddress: null,
  effectiveDate: 'May 13, 2026',
  governingLaw: 'Romania',
  venue: 'the competent courts of Romania',
}

export const legalProcessors: LegalProcessor[] = [
  {
    name: 'Cloudflare',
    purpose: 'site hosting, content delivery, security, and basic infrastructure telemetry',
  },
  {
    name: 'PostHog',
    purpose: 'optional product analytics after explicit consent',
  },
  {
    name: 'Supabase',
    purpose: 'optional authentication and score/profile sync when enabled in the environment',
  },
]

const normalizedSiteUrl = siteConfig.productionUrl.replace(/\/$/, '')

export const legalConfig = {
  siteName: siteConfig.title,
  siteUrl: normalizedSiteUrl,
  appBaseUrl: env.appBaseUrl.replace(/\/$/, ''),
  contact: legalContact,
  processors: legalProcessors,
} as const

export function getLegalContactEmailAddress() {
  return `${legalContact.contactEmailLocalPart}@${legalContact.contactEmailDomainParts.join('.')}`
}

export function getLegalContactEmailDisplay() {
  return `${legalContact.contactEmailLocalPart} [at] ${legalContact.contactEmailDomainParts.join(' [dot] ')}`
}

export const termsSections: LegalSection[] = [
  {
    heading: 'Acceptance and scope',
    paragraphs: [
      `${legalConfig.siteName} is a browser-based trivia practice service operated by ${legalContact.operatorName}. These Terms of Service govern your access to ${legalConfig.siteUrl} and any related pages, game routes, and features that link to them.`,
      `By accessing or using the service, you agree to these terms. If you do not agree, do not use the service.`,
    ],
  },
  {
    heading: 'Eligibility and anonymous play',
    paragraphs: [
      'The service is intended for general audiences who can form a binding agreement under applicable law. Anonymous play is available without creating an account.',
      'If optional sign-in or sync features are shown in the interface, they are convenience features only and may not be available in every environment or release.',
    ],
  },
  {
    heading: 'Acceptable use',
    bullets: [
      'Use the service for personal, lawful trivia practice and related non-commercial play.',
      'Do not interfere with the service, probe for vulnerabilities, scrape content at abusive volumes, or attempt to bypass technical safeguards.',
      'Do not upload, submit, or transmit unlawful, harmful, or infringing material through any future interactive features.',
      'Do not impersonate another person or misrepresent your identity when using optional profile or sign-in features.',
    ],
  },
  {
    heading: 'Local storage, scores, and feature availability',
    paragraphs: [
      'Gameplay preferences, scores, recent results, and question-deck progress are stored locally in your browser by default. Clearing browser storage, switching browsers, or using private browsing may remove that data.',
      'We aim to keep the service available and accurate, but trivia content, scores, timers, cached assets, and sync behavior may contain mistakes, become unavailable, or behave differently across devices and browsers.',
    ],
  },
  {
    heading: 'Intellectual property',
    paragraphs: [
      `The service, including its design, software, copy, game selection logic, and original branding, is owned by ${legalContact.operatorName} or used under applicable licenses.`,
      'You may use the service for personal use only. You may not copy, redistribute, reverse engineer, sell, or create derivative commercial products from the service except where applicable law allows it despite this restriction.',
    ],
  },
  {
    heading: 'Third-party materials and links',
    paragraphs: [
      'Some game data, artwork sources, libraries, and infrastructure services depend on third-party providers. Their availability and terms may affect how parts of the service behave.',
      'Links to third-party websites or sign-in providers are provided for convenience. We are not responsible for third-party services or their content.',
    ],
  },
  {
    heading: 'Suspension and termination',
    paragraphs: [
      'We may suspend, limit, or block access if we reasonably believe your use is abusive, unlawful, threatens the security or availability of the service, or violates these terms.',
      'You may stop using the service at any time. Because most gameplay data is stored locally by default, you can usually remove that data directly from your browser settings.',
    ],
  },
  {
    heading: 'Disclaimers and limitation of liability',
    paragraphs: [
      'The service is provided on an "as is" and "as available" basis, without warranties of any kind to the extent permitted by law. We do not guarantee uninterrupted availability, perfect accuracy, or fitness for a particular purpose.',
      `To the extent permitted by law, ${legalContact.operatorName} will not be liable for indirect, incidental, special, consequential, or punitive damages, or for loss of data, scores, profits, goodwill, or business interruption arising from your use of the service.`,
    ],
  },
  {
    heading: 'Changes to the service or terms',
    paragraphs: [
      'We may update the service, add or remove features, or revise these terms from time to time. Material updates will be reflected by updating the effective date on this page.',
      'Your continued use after revised terms become effective means you accept the updated terms.',
    ],
  },
  {
    heading: 'Governing law and contact',
    paragraphs: [
      `These terms are governed by the laws of ${legalContact.governingLaw}, without regard to conflict-of-law rules. Disputes that cannot be resolved informally will be submitted to ${legalContact.venue}, except where mandatory consumer law provides otherwise.`,
      'Questions about these terms can be sent to the contact address listed on this page.',
    ],
  },
]

export const privacySections: LegalSection[] = [
  {
    heading: 'Who we are',
    paragraphs: [
      `${legalConfig.siteName} is operated by ${legalContact.operatorName}. This Privacy Policy explains how personal data is handled when you use ${legalConfig.siteUrl}.`,
      'For privacy questions or requests, use the contact address listed on this page.',
    ],
  },
  {
    heading: 'How the app works by default',
    paragraphs: [
      'The service is designed for anonymous, local-first play. You can use the games without creating an account.',
      'Most gameplay data is stored in your browser on the device you are using, rather than being sent to a server by default.',
    ],
  },
  {
    heading: 'Data stored locally in your browser',
    bullets: [
      'an anonymous local player identifier',
      'high scores, recent round results, and rounds played',
      'the last selected difficulty for each game',
      'game-specific question-deck progress used to reduce repeated questions across rounds',
      'sound preference',
      'tracking consent preference',
      'optional display name stored locally for profile and leaderboard presentation',
    ],
  },
  {
    heading: 'Optional analytics and consent',
    paragraphs: [
      'Optional product analytics stay off unless you explicitly allow them through the in-app privacy controls.',
      'If you grant consent, analytics events may include page views, game opens, difficulty selections, round starts, answer outcomes, round completions, homepage card clicks, and high-score events.',
      'Free-text answers are intentionally excluded from analytics payloads.',
    ],
  },
  {
    heading: 'Hosting, security, and essential processing',
    paragraphs: [
      'Even if you decline optional analytics, the hosting or security providers that deliver the site may still process limited technical data such as IP address, request metadata, delivery logs, and security telemetry that are necessary to serve, cache, and protect the service.',
      'This essential processing is separate from optional product analytics and does not rely on your analytics consent choice inside the app.',
    ],
  },
  {
    heading: 'Optional account and sync features',
    paragraphs: [
      'Some releases may expose optional sign-in or sync flows backed by Supabase. Those features are not required for gameplay and may be unavailable in some environments.',
      'If enabled and used, those features may process account identifiers, profile preferences, round summaries, and score records needed to support authentication and cross-device sync.',
    ],
  },
  {
    heading: 'Service providers and processors',
    bullets: legalProcessors.map(
      (processor) => `${processor.name}: ${processor.purpose}.`,
    ),
  },
  {
    heading: 'Legal bases and your rights',
    paragraphs: [
      'Where EU or UK data protection law applies, we rely on consent for optional analytics, legitimate interests for basic site security and service delivery, and performance of a contract or pre-contractual steps where you actively use optional account or sync features.',
      'Depending on your location, you may have rights to access, correct, erase, restrict, object to, or receive a copy of personal data that we control, and to withdraw consent at any time for optional analytics.',
    ],
  },
  {
    heading: 'How to manage your choices',
    paragraphs: [
      'You can change the optional analytics setting at any time from the in-app Privacy controls or the Settings page.',
      'Because gameplay data is mainly stored locally, you can also remove local data through your browser storage settings.',
    ],
  },
  {
    heading: 'Retention and updates',
    paragraphs: [
      'Local browser data stays on your device until you delete it or your browser removes it. Server-side records, if any are created through optional account or analytics features, are retained only for as long as reasonably necessary for the relevant purpose and applicable legal obligations.',
      'We may update this policy as the product evolves. Material changes will be reflected by updating the effective date on this page.',
    ],
  },
]
