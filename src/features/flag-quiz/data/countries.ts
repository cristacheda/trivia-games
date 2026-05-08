import countries from 'world-countries'
import type { CountryQuestionSource } from '@/features/flag-quiz/types'

function dedupeAliases(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function computeSelectionWeight(country: CountryQuestionSource) {
  let weight = country.weightModifier

  if (country.region === 'Europe') {
    weight *= 0.42
  } else if (country.region === 'Africa') {
    weight *= 1.32
  } else if (country.region === 'Oceania') {
    weight *= 1.36
  } else if (country.region === 'Asia') {
    weight *= 1.14
  } else if (country.region === 'Americas') {
    weight *= 1.08
  }

  if (country.population < 5_000_000) {
    weight *= 1.3
  } else if (country.population < 20_000_000) {
    weight *= 1.16
  }

  if (country.area < 35_000) {
    weight *= 1.12
  }

  return Number(weight.toFixed(3))
}

export const flagQuestionBank: CountryQuestionSource[] = countries
  .filter((country) => country.unMember)
  .map((country) => {
    const population = (country as { population?: number }).population ?? 0
    const aliases = dedupeAliases([
      country.name.common,
      country.name.official,
      ...(country.altSpellings ?? []),
    ])

    const source: CountryQuestionSource = {
      code: country.cca2,
      name: country.name.common,
      officialName: country.name.official,
      aliases,
      region: country.region || 'Other',
      subregion: country.subregion || 'Other',
      population,
      area: country.area ?? 0,
      flagEmoji: country.flag || '',
      weightModifier: 1,
    }

    return {
      ...source,
      weightModifier: computeSelectionWeight(source),
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))
