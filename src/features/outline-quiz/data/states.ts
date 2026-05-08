import usaMap from '@svg-maps/usa'
import type { DifficultyId } from '@/types/game'
import { svgPathBbox } from 'svg-path-bbox'
import type { OutlineQuestionSource } from '@/features/outline-quiz/types'

interface SvgMapLocation {
  id: string
  name: string
  path: string
}

interface StateMetadata {
  code: string
  name: string
  subregion: string
  familiarityBand: OutlineQuestionSource['familiarityBand']
  aliases?: string[]
}

const stateMetadata: StateMetadata[] = [
  { code: 'AL', name: 'Alabama', subregion: 'East South Central', familiarityBand: 'standard' },
  { code: 'AK', name: 'Alaska', subregion: 'Pacific', familiarityBand: 'standard' },
  { code: 'AZ', name: 'Arizona', subregion: 'Mountain', familiarityBand: 'common' },
  { code: 'AR', name: 'Arkansas', subregion: 'West South Central', familiarityBand: 'niche' },
  { code: 'CA', name: 'California', subregion: 'Pacific', familiarityBand: 'common' },
  { code: 'CO', name: 'Colorado', subregion: 'Mountain', familiarityBand: 'common' },
  { code: 'CT', name: 'Connecticut', subregion: 'New England', familiarityBand: 'standard' },
  { code: 'DE', name: 'Delaware', subregion: 'South Atlantic', familiarityBand: 'niche' },
  { code: 'FL', name: 'Florida', subregion: 'South Atlantic', familiarityBand: 'common' },
  { code: 'GA', name: 'Georgia', subregion: 'South Atlantic', familiarityBand: 'common' },
  { code: 'HI', name: 'Hawaii', subregion: 'Pacific', familiarityBand: 'standard' },
  { code: 'ID', name: 'Idaho', subregion: 'Mountain', familiarityBand: 'niche' },
  { code: 'IL', name: 'Illinois', subregion: 'East North Central', familiarityBand: 'common' },
  { code: 'IN', name: 'Indiana', subregion: 'East North Central', familiarityBand: 'standard' },
  { code: 'IA', name: 'Iowa', subregion: 'West North Central', familiarityBand: 'niche' },
  { code: 'KS', name: 'Kansas', subregion: 'West North Central', familiarityBand: 'niche' },
  { code: 'KY', name: 'Kentucky', subregion: 'East South Central', familiarityBand: 'standard' },
  { code: 'LA', name: 'Louisiana', subregion: 'West South Central', familiarityBand: 'common' },
  { code: 'ME', name: 'Maine', subregion: 'New England', familiarityBand: 'standard' },
  { code: 'MD', name: 'Maryland', subregion: 'South Atlantic', familiarityBand: 'standard' },
  { code: 'MA', name: 'Massachusetts', subregion: 'New England', familiarityBand: 'common' },
  { code: 'MI', name: 'Michigan', subregion: 'East North Central', familiarityBand: 'common' },
  { code: 'MN', name: 'Minnesota', subregion: 'West North Central', familiarityBand: 'standard' },
  { code: 'MS', name: 'Mississippi', subregion: 'East South Central', familiarityBand: 'niche' },
  { code: 'MO', name: 'Missouri', subregion: 'West North Central', familiarityBand: 'standard' },
  { code: 'MT', name: 'Montana', subregion: 'Mountain', familiarityBand: 'niche' },
  { code: 'NE', name: 'Nebraska', subregion: 'West North Central', familiarityBand: 'niche' },
  { code: 'NV', name: 'Nevada', subregion: 'Mountain', familiarityBand: 'standard' },
  { code: 'NH', name: 'New Hampshire', subregion: 'New England', familiarityBand: 'niche' },
  { code: 'NJ', name: 'New Jersey', subregion: 'Middle Atlantic', familiarityBand: 'common' },
  { code: 'NM', name: 'New Mexico', subregion: 'Mountain', familiarityBand: 'niche' },
  { code: 'NY', name: 'New York', subregion: 'Middle Atlantic', familiarityBand: 'common' },
  { code: 'NC', name: 'North Carolina', subregion: 'South Atlantic', familiarityBand: 'common' },
  { code: 'ND', name: 'North Dakota', subregion: 'West North Central', familiarityBand: 'niche' },
  { code: 'OH', name: 'Ohio', subregion: 'East North Central', familiarityBand: 'common' },
  { code: 'OK', name: 'Oklahoma', subregion: 'West South Central', familiarityBand: 'standard' },
  { code: 'OR', name: 'Oregon', subregion: 'Pacific', familiarityBand: 'standard' },
  { code: 'PA', name: 'Pennsylvania', subregion: 'Middle Atlantic', familiarityBand: 'common' },
  { code: 'RI', name: 'Rhode Island', subregion: 'New England', familiarityBand: 'niche' },
  { code: 'SC', name: 'South Carolina', subregion: 'South Atlantic', familiarityBand: 'standard' },
  { code: 'SD', name: 'South Dakota', subregion: 'West North Central', familiarityBand: 'niche' },
  { code: 'TN', name: 'Tennessee', subregion: 'East South Central', familiarityBand: 'common' },
  { code: 'TX', name: 'Texas', subregion: 'West South Central', familiarityBand: 'common' },
  { code: 'UT', name: 'Utah', subregion: 'Mountain', familiarityBand: 'standard' },
  { code: 'VT', name: 'Vermont', subregion: 'New England', familiarityBand: 'niche' },
  { code: 'VA', name: 'Virginia', subregion: 'South Atlantic', familiarityBand: 'common' },
  { code: 'WA', name: 'Washington', subregion: 'Pacific', familiarityBand: 'common' },
  { code: 'WI', name: 'Wisconsin', subregion: 'East North Central', familiarityBand: 'standard' },
  { code: 'WV', name: 'West Virginia', subregion: 'South Atlantic', familiarityBand: 'niche' },
  { code: 'WY', name: 'Wyoming', subregion: 'Mountain', familiarityBand: 'niche' },
]

function createOutlineViewBox(path: string) {
  const [minX, minY, maxX, maxY] = svgPathBbox(path)
  const padding = Math.max((maxX - minX) * 0.12, (maxY - minY) * 0.12, 4)
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2

  return `${minX - padding} ${minY - padding} ${width} ${height}`
}

export function computeOutlineStateWeight(
  subject: Pick<OutlineQuestionSource, 'subregion' | 'familiarityBand' | 'name'>,
  difficultyId: DifficultyId,
) {
  const hardMode = difficultyId !== 'level-1'
  let weight = 0.32

  if (subject.familiarityBand === 'common') {
    weight *= hardMode ? 0.62 : 0.82
  } else if (subject.familiarityBand === 'standard') {
    weight *= hardMode ? 1.04 : 1.02
  } else {
    weight *= hardMode ? 1.68 : 1.18
  }

  if (
    subject.subregion === 'New England' ||
    subject.subregion === 'Mountain' ||
    subject.subregion === 'West North Central'
  ) {
    weight *= hardMode ? 1.18 : 1.06
  }

  if (subject.name === 'Alaska' || subject.name === 'Hawaii') {
    weight *= hardMode ? 1.22 : 1.1
  }

  return Number(weight.toFixed(3))
}

const stateLocationsByCode = new Map(
  (usaMap.locations as SvgMapLocation[]).map(
    (location) => [location.id.toUpperCase(), location] as const,
  ),
)

export const outlineStateQuestionBank: OutlineQuestionSource[] = stateMetadata
  .map((state) => {
    const location = stateLocationsByCode.get(state.code)

    if (!location) {
      throw new Error(`Missing USA outline for ${state.code}`)
    }

    const baseQuestion: OutlineQuestionSource = {
      code: `US-${state.code}`,
      kind: 'state',
      name: state.name,
      officialName: `${state.name} ${state.name.includes('Island') ? '' : 'State'}`.trim(),
      aliases: [state.name, `State of ${state.name}`, ...(state.aliases ?? [])],
      region: 'Americas',
      subregion: state.subregion,
      population: null,
      area: null,
      familiarityBand: state.familiarityBand,
      flagEmoji: '',
      outlinePath: location.path,
      outlineViewBox: createOutlineViewBox(location.path),
      baseWeight: 1,
      hardWeight: 1,
    }

    return {
      ...baseQuestion,
      baseWeight: computeOutlineStateWeight(baseQuestion, 'level-1'),
      hardWeight: computeOutlineStateWeight(baseQuestion, 'level-2'),
    }
  })
  .sort((left, right) => left.name.localeCompare(right.name))

export const outlineStateQuestionBankByCode = new Map(
  outlineStateQuestionBank.map((state) => [state.code, state] as const),
)
