import { expect, test } from '@playwright/test'
import {
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  seedAppState,
  startRound,
  useMobileViewport,
} from './helpers'

test('each outline-game difficulty can start a round', async ({ page }) => {
  await enableDebugMode(page)

  for (const difficultyId of ['level-1', 'level-2', 'level-3']) {
    await page.goto('/games/outline-quiz')
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, difficultyId)
  }
})

test('outline game free-text input autofocuses and reveals the correct place', async ({
  page,
}) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await useMobileViewport(page)
  await page.goto('/games/outline-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

  await expect(page.locator('#outline-answer')).toBeFocused()

  const correctAnswer = await page.locator('#outline-answer').getAttribute('data-answer')
  await page.locator('#outline-answer').fill('Definitely not the correct place')
  await page.getByRole('button', { name: 'Lock answer' }).click()

  await expect(page.getByTestId('revealed-correct-answer')).toContainText(
    `Correct answer: ${correctAnswer}`,
  )
})

test('starting new outline rounds advances the shared country and state decks across reloads', async ({
  page,
}) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/outline-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  const firstDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['outline-quiz']?.outlineDeck
  })

  await page.reload()
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

  const secondDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['outline-quiz']?.outlineDeck
  })

  expect(firstDeck.nextCountryIndex).toBe(18)
  expect(firstDeck.nextStateIndex).toBe(2)
  expect(secondDeck.nextCountryIndex).toBe(36)
  expect(secondDeck.nextStateIndex).toBe(4)
  expect(secondDeck.orderedCountryCodes).toEqual(firstDeck.orderedCountryCodes)
  expect(secondDeck.orderedStateCodes).toEqual(firstDeck.orderedStateCodes)
})

test('outline game replaying shows the previous high score', async ({ page }) => {
  test.setTimeout(150000)

  await seedAppState(page, {
    version: 5,
    playerId: 'e2e-player',
    games: {
      'outline-quiz': {
        highScore: {
          score: 8,
          achievedAt: '2026-05-08T20:00:00.000Z',
          difficultyId: 'level-1',
        },
        recentResult: null,
        lastDifficulty: 'level-1',
        countryDeck: null,
        capitalDeck: null,
        outlineDeck: null,
      },
    },
    preferences: {
      soundEnabled: true,
    },
  })
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'atlas-of-answers:debug',
      JSON.stringify({ timerScale: 0.01, revealAnswers: false }),
    )
  })
  await page.goto('/games/outline-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect(page.getByTestId('result-score')).toContainText('0 points', {
    timeout: 130000,
  })
  await expect(page.getByText('Previous best')).toBeVisible()
  await expect(page.getByText('8', { exact: true })).toBeVisible()
})
