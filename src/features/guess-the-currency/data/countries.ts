import countries from 'world-countries'
import type { DifficultyId } from '@/types/game'
import type { CurrencyQuestionSource } from '@/features/guess-the-currency/types'

function dedupeAliases(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function computeCurrencySelectionWeight(
  source: Pick<CurrencyQuestionSource, 'region' | 'population' | 'area'>,
  difficultyId: DifficultyId,
): number {
  let weight = 1.0

  if (source.region === 'Europe') {
    weight *= 0.25
  } else if (source.region === 'Africa') {
    weight *= 1.3
  } else if (source.region === 'Oceania') {
    weight *= 1.35
  } else if (source.region === 'Asia') {
    weight *= 1.15
  } else if (source.region === 'Americas') {
    weight *= 1.1
  }

  if (difficultyId === 'level-2' || difficultyId === 'level-3') {
    if (source.population < 1_000_000) {
      weight *= 1.6
    } else if (source.population < 5_000_000) {
      weight *= 1.4
    } else if (source.population < 20_000_000) {
      weight *= 1.2
    }

    if (source.area < 10_000) {
      weight *= 1.3
    }
  }

  return Number(weight.toFixed(3))
}

export const currencyQuestionBank: CurrencyQuestionSource[] = countries
  .filter(
    (country) =>
      country.unMember &&
      country.currencies != null &&
      Object.keys(country.currencies).length > 0,
  )
  .map((country) => {
    const population = (country as { population?: number }).population ?? 0
    const [currencyCode, currencyData] = Object.entries(country.currencies)[0]
    const aliases = dedupeAliases([
      country.name.common,
      country.name.official,
      ...(country.altSpellings ?? []),
    ])

    return {
      code: country.cca2,
      name: country.name.common,
      officialName: country.name.official,
      aliases,
      region: country.region || 'Other',
      subregion: country.subregion || 'Other',
      population,
      area: country.area ?? 0,
      flagEmoji: country.flag || '',
      currencyCode,
      currencyName: currencyData.name,
      currencySymbol: currencyData.symbol,
      weightModifier: 1,
    } satisfies CurrencyQuestionSource
  })
  .sort((a, b) => a.name.localeCompare(b.name))

export const currencyQuestionBankByCode = new Map(
  currencyQuestionBank.map((country) => [country.code, country] as const),
)
