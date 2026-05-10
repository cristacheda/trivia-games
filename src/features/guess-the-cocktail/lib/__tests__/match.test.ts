import { describe, expect, it } from 'vitest'
import { isAcceptableCocktailAnswer } from '@/features/guess-the-cocktail/lib/match'
import type { CocktailQuestionSource } from '@/features/guess-the-cocktail/types'

function makeCocktail(name: string, aliases: string[]): CocktailQuestionSource {
  return {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    aliases,
    category: 'Cocktail',
    alcoholic: 'Alcoholic',
    imageLocalPath: `/cocktails/${name}.jpg`,
    ingredients: ['Gin'],
    popularityTier: 'popular',
    weightModifier: 1,
  }
}

describe('isAcceptableCocktailAnswer', () => {
  it('accepts exact match', () => {
    const cocktail = makeCocktail('Mojito', ['Mojito'])
    expect(isAcceptableCocktailAnswer('Mojito', cocktail)).toBe(true)
  })

  it('accepts case-insensitive match', () => {
    const cocktail = makeCocktail('Mojito', ['Mojito'])
    expect(isAcceptableCocktailAnswer('mojito', cocktail)).toBe(true)
    expect(isAcceptableCocktailAnswer('MOJITO', cocktail)).toBe(true)
  })

  it('accepts alias match', () => {
    const cocktail = makeCocktail('Gin and Tonic', ['Gin and Tonic', 'G&T', 'Gin & Tonic'])
    expect(isAcceptableCocktailAnswer('G&T', cocktail)).toBe(true)
    expect(isAcceptableCocktailAnswer('gin and tonic', cocktail)).toBe(true)
  })

  it('accepts minor typos', () => {
    const cocktail = makeCocktail('Margarita', ['Margarita'])
    expect(isAcceptableCocktailAnswer('Margaritaa', cocktail)).toBe(true)
    expect(isAcceptableCocktailAnswer('Margerita', cocktail)).toBe(true)
  })

  it('accepts diacritic-free variant', () => {
    const cocktail = makeCocktail('Piña Colada', ['Piña Colada', 'Pina Colada'])
    expect(isAcceptableCocktailAnswer('Pina Colada', cocktail)).toBe(true)
  })

  it('rejects empty input', () => {
    const cocktail = makeCocktail('Mojito', ['Mojito'])
    expect(isAcceptableCocktailAnswer('', cocktail)).toBe(false)
    expect(isAcceptableCocktailAnswer('   ', cocktail)).toBe(false)
  })

  it('rejects clearly wrong answer', () => {
    const cocktail = makeCocktail('Mojito', ['Mojito'])
    expect(isAcceptableCocktailAnswer('Negroni', cocktail)).toBe(false)
    expect(isAcceptableCocktailAnswer('xyz', cocktail)).toBe(false)
  })

  it('accepts LIIT abbreviation alias', () => {
    const cocktail = makeCocktail('Long Island Iced Tea', [
      'Long Island Iced Tea',
      'Long Island Ice Tea',
      'LIIT',
    ])
    expect(isAcceptableCocktailAnswer('LIIT', cocktail)).toBe(true)
    expect(isAcceptableCocktailAnswer('Long Island Ice Tea', cocktail)).toBe(true)
  })
})
