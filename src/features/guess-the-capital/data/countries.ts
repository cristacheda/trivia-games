import countries from 'world-countries'
import type { CapitalQuestionSource } from '@/features/guess-the-capital/types'

function dedupeAliases(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function buildCapitalAliases(capitalNames: string[]) {
  const aliases = new Set<string>()

  for (const capitalName of capitalNames) {
    aliases.add(capitalName)
    aliases.add(titleCase(capitalName))

    if (capitalName.startsWith('St. ')) {
      aliases.add(capitalName.replace(/^St\. /, 'Saint '))
    }

    if (capitalName.startsWith('Saint ')) {
      aliases.add(capitalName.replace(/^Saint /, 'St. '))
      aliases.add(capitalName.replace(/^Saint /, 'St '))
    }
  }

  return Array.from(aliases)
}

export function computeCapitalSelectionWeight(
  subject: Pick<
    CapitalQuestionSource,
    'kind' | 'region' | 'population' | 'area'
  >,
  difficultyId: 'level-1' | 'level-2' | 'level-3',
) {
  let weight = subject.kind === 'state' ? 0.75 : 1

  if (subject.kind === 'country') {
    if (difficultyId === 'level-1') {
      if (subject.region === 'Europe') {
        weight *= 0.72
      } else if (subject.region === 'Africa') {
        weight *= 1.18
      } else if (subject.region === 'Oceania') {
        weight *= 1.22
      } else if (subject.region === 'Asia') {
        weight *= 1.08
      } else if (subject.region === 'Americas') {
        weight *= 1.04
      }
    } else {
      if (subject.region === 'Europe') {
        weight *= 0.32
      } else if (subject.region === 'Africa') {
        weight *= 1.42
      } else if (subject.region === 'Oceania') {
        weight *= 1.48
      } else if (subject.region === 'Asia') {
        weight *= 1.2
      } else if (subject.region === 'Americas') {
        weight *= 1.12
      }
    }

    if (subject.population < 5_000_000) {
      weight *= difficultyId === 'level-1' ? 1.16 : 1.36
    } else if (subject.population < 20_000_000) {
      weight *= difficultyId === 'level-1' ? 1.08 : 1.18
    }

    if (subject.area < 35_000) {
      weight *= difficultyId === 'level-1' ? 1.06 : 1.14
    }
  }

  return Number(weight.toFixed(3))
}

export const capitalCountryQuestionBank: CapitalQuestionSource[] = countries
  .filter((country) => country.unMember && (country.capital?.length ?? 0) > 0)
  .map((country) => {
    const population = (country as { population?: number }).population ?? 0
    const capitalAliases = buildCapitalAliases(dedupeAliases(country.capital ?? []))

    return {
      code: country.cca2,
      kind: 'country' as const,
      name: country.name.common,
      region: country.region || 'Other',
      subregion: country.subregion || 'Other',
      population,
      area: country.area ?? 0,
      capital: country.capital?.[0] ?? '',
      capitalAliases,
      weightModifier: 1,
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export const capitalCountryQuestionBankByCode = new Map(
  capitalCountryQuestionBank.map((country) => [country.code, country] as const),
)
