import type { DifficultyRule } from '@/types/game'
import {
  applyRegularCocktailWeights,
  getObscureCocktailPool,
} from '@/features/guess-the-cocktail/data/cocktails'
import type { CocktailQuestionSource, GuessTheCocktailQuestion } from '@/features/guess-the-cocktail/types'

export function sampleWeightedUnique(values: CocktailQuestionSource[], count: number, random: () => number) {
  const pool = [...values]
  const result: CocktailQuestionSource[] = []

  while (result.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((sum, value) => sum + value.weightModifier, 0)
    let roll = random() * totalWeight
    let selectedIndex = 0

    for (let index = 0; index < pool.length; index += 1) {
      roll -= pool[index].weightModifier
      if (roll <= 0) {
        selectedIndex = index
        break
      }
    }

    const [selected] = pool.splice(selectedIndex, 1)
    result.push(selected)
  }

  return result
}

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function buildOptions(subject: CocktailQuestionSource, optionCount: number, random: () => number) {
  const distractors = shuffle(
    applyRegularCocktailWeights('level-1').filter(
      (candidate) => candidate.id !== subject.id,
    ),
    random,
  )
    .filter(
      (candidate, index, candidates) =>
        candidates.findIndex((item) => item.name === candidate.name) === index,
    )
    .slice(0, optionCount - 1)

  return shuffle([subject, ...distractors], random)
}

export function buildGuessTheCocktailRegularDeck(
  random: () => number = Math.random,
  difficultyId: DifficultyRule['id'] = 'level-1',
) {
  const pool = applyRegularCocktailWeights(difficultyId)
  return sampleWeightedUnique(pool, pool.length, random)
}

export function buildGuessTheCocktailObscureDeck(random: () => number = Math.random) {
  const pool = getObscureCocktailPool()
  return sampleWeightedUnique(pool, pool.length, random)
}

export function buildGuessTheCocktailRound(
  difficulty: DifficultyRule,
  subjects: CocktailQuestionSource[],
  random: () => number = Math.random,
): GuessTheCocktailQuestion[] {
  return shuffle(subjects, random).map((subject, index) => ({
    id: `${difficulty.id}-${subject.id}-${index + 1}`,
    difficultyId: difficulty.id,
    cocktail: subject,
    options:
      difficulty.optionCount === null
        ? []
        : buildOptions(subject, difficulty.optionCount, random),
  }))
}
