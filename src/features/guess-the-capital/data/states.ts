import type { CapitalQuestionSource } from '@/features/guess-the-capital/types'

const usStates: Array<{ code: string; name: string; capital: string }> = [
  { code: 'US-AL', name: 'Alabama', capital: 'Montgomery' },
  { code: 'US-AK', name: 'Alaska', capital: 'Juneau' },
  { code: 'US-AZ', name: 'Arizona', capital: 'Phoenix' },
  { code: 'US-AR', name: 'Arkansas', capital: 'Little Rock' },
  { code: 'US-CA', name: 'California', capital: 'Sacramento' },
  { code: 'US-CO', name: 'Colorado', capital: 'Denver' },
  { code: 'US-CT', name: 'Connecticut', capital: 'Hartford' },
  { code: 'US-DE', name: 'Delaware', capital: 'Dover' },
  { code: 'US-FL', name: 'Florida', capital: 'Tallahassee' },
  { code: 'US-GA', name: 'Georgia', capital: 'Atlanta' },
  { code: 'US-HI', name: 'Hawaii', capital: 'Honolulu' },
  { code: 'US-ID', name: 'Idaho', capital: 'Boise' },
  { code: 'US-IL', name: 'Illinois', capital: 'Springfield' },
  { code: 'US-IN', name: 'Indiana', capital: 'Indianapolis' },
  { code: 'US-IA', name: 'Iowa', capital: 'Des Moines' },
  { code: 'US-KS', name: 'Kansas', capital: 'Topeka' },
  { code: 'US-KY', name: 'Kentucky', capital: 'Frankfort' },
  { code: 'US-LA', name: 'Louisiana', capital: 'Baton Rouge' },
  { code: 'US-ME', name: 'Maine', capital: 'Augusta' },
  { code: 'US-MD', name: 'Maryland', capital: 'Annapolis' },
  { code: 'US-MA', name: 'Massachusetts', capital: 'Boston' },
  { code: 'US-MI', name: 'Michigan', capital: 'Lansing' },
  { code: 'US-MN', name: 'Minnesota', capital: 'Saint Paul' },
  { code: 'US-MS', name: 'Mississippi', capital: 'Jackson' },
  { code: 'US-MO', name: 'Missouri', capital: 'Jefferson City' },
  { code: 'US-MT', name: 'Montana', capital: 'Helena' },
  { code: 'US-NE', name: 'Nebraska', capital: 'Lincoln' },
  { code: 'US-NV', name: 'Nevada', capital: 'Carson City' },
  { code: 'US-NH', name: 'New Hampshire', capital: 'Concord' },
  { code: 'US-NJ', name: 'New Jersey', capital: 'Trenton' },
  { code: 'US-NM', name: 'New Mexico', capital: 'Santa Fe' },
  { code: 'US-NY', name: 'New York', capital: 'Albany' },
  { code: 'US-NC', name: 'North Carolina', capital: 'Raleigh' },
  { code: 'US-ND', name: 'North Dakota', capital: 'Bismarck' },
  { code: 'US-OH', name: 'Ohio', capital: 'Columbus' },
  { code: 'US-OK', name: 'Oklahoma', capital: 'Oklahoma City' },
  { code: 'US-OR', name: 'Oregon', capital: 'Salem' },
  { code: 'US-PA', name: 'Pennsylvania', capital: 'Harrisburg' },
  { code: 'US-RI', name: 'Rhode Island', capital: 'Providence' },
  { code: 'US-SC', name: 'South Carolina', capital: 'Columbia' },
  { code: 'US-SD', name: 'South Dakota', capital: 'Pierre' },
  { code: 'US-TN', name: 'Tennessee', capital: 'Nashville' },
  { code: 'US-TX', name: 'Texas', capital: 'Austin' },
  { code: 'US-UT', name: 'Utah', capital: 'Salt Lake City' },
  { code: 'US-VT', name: 'Vermont', capital: 'Montpelier' },
  { code: 'US-VA', name: 'Virginia', capital: 'Richmond' },
  { code: 'US-WA', name: 'Washington', capital: 'Olympia' },
  { code: 'US-WV', name: 'West Virginia', capital: 'Charleston' },
  { code: 'US-WI', name: 'Wisconsin', capital: 'Madison' },
  { code: 'US-WY', name: 'Wyoming', capital: 'Cheyenne' },
]

function buildCapitalAliases(capital: string) {
  const aliases = [capital]

  if (capital === 'Saint Paul') {
    aliases.push('St Paul', 'St. Paul')
  }

  return aliases
}

export const capitalStateQuestionBank: CapitalQuestionSource[] = usStates
  .map(({ code, name, capital }) => ({
    code,
    kind: 'state' as const,
    name,
    region: 'Americas',
    subregion: 'North America',
    population: 0,
    area: 0,
    capital,
    capitalAliases: buildCapitalAliases(capital),
    weightModifier: 1,
  }))
  .sort((left, right) => left.name.localeCompare(right.name))

export const capitalStateQuestionBankByCode = new Map(
  capitalStateQuestionBank.map((state) => [state.code, state] as const),
)
