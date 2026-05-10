import { describe, expect, it } from 'vitest'
import {
  buildGuessTheCocktailRegularDeck,
  buildGuessTheCocktailObscureDeck,
  buildGuessTheCocktailRound,
  sampleWeightedUnique,
} from '@/features/guess-the-cocktail/lib/round'
import { applyRegularCocktailWeights, getObscureCocktailPool } from '@/features/guess-the-cocktail/data/cocktails'
import { getGuessTheCocktailDifficultyRule } from '@/features/guess-the-cocktail/constants'

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

describe('sampleWeightedUnique', () => {
  it('returns the requested count without duplicates', () => {
    const bank = applyRegularCocktailWeights('level-1')
    const random = seededRandom(42)
    const result = sampleWeightedUnique(bank, 10, random)
    expect(result).toHaveLength(10)
    expect(new Set(result.map((c) => c.id)).size).toBe(10)
  })
})

describe('buildGuessTheCocktailRegularDeck', () => {
  it('contains no obscure cocktails', () => {
    const deck = buildGuessTheCocktailRegularDeck(seededRandom(1), 'level-1')
    for (const c of deck) {
      expect(c.popularityTier).not.toBe('obscure')
    }
  })

  it('produces deterministic output for the same seed', () => {
    const deck1 = buildGuessTheCocktailRegularDeck(seededRandom(7), 'level-1').map((c) => c.id)
    const deck2 = buildGuessTheCocktailRegularDeck(seededRandom(7), 'level-1').map((c) => c.id)
    expect(deck1).toEqual(deck2)
  })

  it('produces different order for different seeds', () => {
    const deck1 = buildGuessTheCocktailRegularDeck(seededRandom(1), 'level-1').map((c) => c.id)
    const deck2 = buildGuessTheCocktailRegularDeck(seededRandom(2), 'level-1').map((c) => c.id)
    expect(deck1).not.toEqual(deck2)
  })
})

describe('buildGuessTheCocktailObscureDeck', () => {
  it('contains only obscure cocktails', () => {
    const deck = buildGuessTheCocktailObscureDeck(seededRandom(5))
    for (const c of deck) {
      expect(c.popularityTier).toBe('obscure')
    }
  })

  it('covers the full obscure pool', () => {
    const pool = getObscureCocktailPool()
    const deck = buildGuessTheCocktailObscureDeck(seededRandom(9))
    expect(deck).toHaveLength(pool.length)
  })
})

describe('buildGuessTheCocktailRound', () => {
  it('generates the correct number of questions', () => {
    const random = seededRandom(5)
    const subjects = applyRegularCocktailWeights('level-1').slice(0, 19)
    const obscure = getObscureCocktailPool().slice(0, 1)
    const rule = getGuessTheCocktailDifficultyRule('level-1')
    const round = buildGuessTheCocktailRound(rule, [...subjects, ...obscure], random)
    expect(round).toHaveLength(20)
  })

  it('gives each question the correct difficultyId', () => {
    const random = seededRandom(5)
    const subjects = applyRegularCocktailWeights('level-2').slice(0, 5)
    const rule = getGuessTheCocktailDifficultyRule('level-2')
    const round = buildGuessTheCocktailRound(rule, subjects, random)
    for (const q of round) {
      expect(q.difficultyId).toBe('level-2')
    }
  })

  it('includes the correct cocktail among the options for multiple-choice', () => {
    const random = seededRandom(3)
    const subjects = applyRegularCocktailWeights('level-1').slice(0, 20)
    const rule = getGuessTheCocktailDifficultyRule('level-1')
    const round = buildGuessTheCocktailRound(rule, subjects, random)
    for (const q of round) {
      const correctOption = q.options.find((o) => o.id === q.cocktail.id)
      expect(correctOption).toBeDefined()
      expect(q.options).toHaveLength(rule.optionCount!)
    }
  })

  it('has no duplicate option names within a question', () => {
    const random = seededRandom(11)
    const subjects = applyRegularCocktailWeights('level-2').slice(0, 20)
    const rule = getGuessTheCocktailDifficultyRule('level-2')
    const round = buildGuessTheCocktailRound(rule, subjects, random)
    for (const q of round) {
      const names = q.options.map((o) => o.name)
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('returns empty options for free-text difficulty', () => {
    const random = seededRandom(9)
    const subjects = applyRegularCocktailWeights('level-3').slice(0, 5)
    const rule = getGuessTheCocktailDifficultyRule('level-3')
    const round = buildGuessTheCocktailRound(rule, subjects, random)
    for (const q of round) {
      expect(q.options).toHaveLength(0)
    }
  })
})
