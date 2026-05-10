import { normalizeCocktailText } from '@/features/guess-the-cocktail/lib/normalize'
import type { CocktailQuestionSource } from '@/features/guess-the-cocktail/types'

function levenshtein(a: string, b: string) {
  const rows = a.length + 1
  const cols = b.length + 1
  const matrix = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) =>
      row === 0 ? col : col === 0 ? row : 0,
    ),
  )

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = a[row - 1] === b[col - 1] ? 0 : 1
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      )
    }
  }

  return matrix[a.length][b.length]
}

function getMaxDistance(length: number) {
  if (length <= 5) return 1
  if (length <= 10) return 2
  return 3
}

export function isAcceptableCocktailAnswer(input: string, cocktail: CocktailQuestionSource) {
  const normalizedInput = normalizeCocktailText(input)

  if (!normalizedInput) {
    return false
  }

  const candidates = Array.from(
    new Set(cocktail.aliases.map((alias) => normalizeCocktailText(alias))),
  )

  return candidates.some((candidate) => {
    if (candidate === normalizedInput) {
      return true
    }

    if (
      candidate.length >= 6 &&
      (candidate.includes(normalizedInput) || normalizedInput.includes(candidate))
    ) {
      return true
    }

    return (
      levenshtein(normalizedInput, candidate) <=
      getMaxDistance(Math.max(normalizedInput.length, candidate.length))
    )
  })
}
