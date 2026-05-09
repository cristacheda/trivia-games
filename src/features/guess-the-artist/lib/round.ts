import type { DifficultyRule } from '@/types/game'
import { applySongDifficultyWeights } from '@/features/guess-the-artist/data/songs'
import type { GuessTheArtistQuestion, SongQuestionSource } from '@/features/guess-the-artist/types'

export function sampleWeightedUnique(values: SongQuestionSource[], count: number, random: () => number) {
  const pool = [...values]
  const result: SongQuestionSource[] = []

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

export function shuffle<T>(values: T[], random: () => number) {
  const result = [...values]

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
  }

  return result
}

function buildOptions(subject: SongQuestionSource, optionCount: number, random: () => number) {
  const distractors = shuffle(
    applySongDifficultyWeights('level-1').filter(
      (candidate) =>
        candidate.id !== subject.id && candidate.artistName !== subject.artistName,
    ),
    random,
  )
    .filter(
      (candidate, index, candidates) =>
        candidates.findIndex((item) => item.artistName === candidate.artistName) === index,
    )
    .slice(0, optionCount - 1)
    .map((candidate) => candidate.artistName)

  return shuffle([subject.artistName, ...distractors], random)
}

export function buildGuessTheArtistDeck(
  random: () => number = Math.random,
  difficultyId: DifficultyRule['id'] = 'level-1',
) {
  const weightedBank = applySongDifficultyWeights(difficultyId)
  return sampleWeightedUnique(weightedBank, weightedBank.length, random)
}

export function buildGuessTheArtistRound(
  difficulty: DifficultyRule,
  subjects: SongQuestionSource[],
  random: () => number = Math.random,
): GuessTheArtistQuestion[] {
  return shuffle(subjects, random).map((subject, index) => ({
    id: `${difficulty.id}-${subject.id}-${index + 1}`,
    difficultyId: difficulty.id,
    subject,
    options:
      difficulty.optionCount === null
        ? []
        : buildOptions(subject, difficulty.optionCount, random),
  }))
}
