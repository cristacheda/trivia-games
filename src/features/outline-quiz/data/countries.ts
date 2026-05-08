import worldMap from '@svg-maps/world'
import countries from 'world-countries'
import { svgPathBbox } from 'svg-path-bbox'
import type { DifficultyId } from '@/types/game'
import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

interface SvgMapLocation {
  id: string
  name: string
  path: string
}

const islandSubregions = new Set([
  'Caribbean',
  'Melanesia',
  'Micronesia',
  'Polynesia',
])

function dedupeAliases(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function createOutlineViewBox(path: string) {
  const [minX, minY, maxX, maxY] = svgPathBbox(path)
  const padding = Math.max((maxX - minX) * 0.12, (maxY - minY) * 0.12, 4)
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2

  return `${minX - padding} ${minY - padding} ${width} ${height}`
}

export function computeOutlineCountryWeight(
  subject: Pick<OutlineQuestionSource, 'region' | 'subregion' | 'population' | 'area'>,
  difficultyId: DifficultyId,
) {
  const hardMode = difficultyId !== 'level-1'
  let weight = 1

  if (subject.region === 'Europe') {
    weight *= hardMode ? 0.28 : 0.64
  } else if (subject.region === 'Africa') {
    weight *= hardMode ? 1.48 : 1.2
  } else if (subject.region === 'Oceania') {
    weight *= hardMode ? 1.62 : 1.26
  } else if (subject.region === 'Asia') {
    weight *= hardMode ? 1.22 : 1.08
  } else if (subject.region === 'Americas') {
    weight *= hardMode ? 1.14 : 1.02
  }

  if (subject.population !== null) {
    if (subject.population < 2_000_000) {
      weight *= hardMode ? 1.72 : 1.28
    } else if (subject.population < 10_000_000) {
      weight *= hardMode ? 1.34 : 1.14
    } else if (subject.population < 25_000_000) {
      weight *= hardMode ? 1.12 : 1.04
    }
  }

  if (subject.area !== null) {
    if (subject.area < 10_000) {
      weight *= hardMode ? 1.42 : 1.12
    } else if (subject.area < 50_000) {
      weight *= hardMode ? 1.18 : 1.08
    }
  }

  if (islandSubregions.has(subject.subregion)) {
    weight *= hardMode ? 1.28 : 1.1
  }

  return Number(weight.toFixed(3))
}

const worldLocationsByCode = new Map(
  (worldMap.locations as SvgMapLocation[]).map(
    (location) => [location.id.toUpperCase(), location] as const,
  ),
)

export const outlineCountryQuestionBank: OutlineQuestionSource[] = countries
  .filter((country) => country.unMember)
  .map((country) => {
    const location = worldLocationsByCode.get(country.cca2)

    if (!location) {
      throw new Error(`Missing world outline for ${country.cca2}`)
    }

    const population = (country as { population?: number }).population ?? 0
    const area = country.area ?? 0
    const aliases = dedupeAliases([
      country.name.common,
      country.name.official,
      ...(country.altSpellings ?? []),
    ])
    const baseQuestion: OutlineQuestionSource = {
      code: country.cca2,
      kind: 'country',
      name: country.name.common,
      officialName: country.name.official,
      aliases,
      region: country.region || 'Other',
      subregion: country.subregion || 'Other',
      population,
      area,
      familiarityBand:
        country.region === 'Europe' && population > 10_000_000 ? 'common' : 'standard',
      flagEmoji: country.flag || '',
      outlinePath: location.path,
      outlineViewBox: createOutlineViewBox(location.path),
      baseWeight: 1,
      hardWeight: 1,
    }

    return {
      ...baseQuestion,
      baseWeight: computeOutlineCountryWeight(baseQuestion, 'level-1'),
      hardWeight: computeOutlineCountryWeight(baseQuestion, 'level-2'),
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export const outlineCountryQuestionBankByCode = new Map(
  outlineCountryQuestionBank.map((country) => [country.code, country] as const),
)
