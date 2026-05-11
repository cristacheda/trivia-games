import { expect, test } from '@playwright/test'
import { capitalStateQuestionBank } from '@/features/guess-the-capital/data/states'
import {
  QUESTIONS_PER_ROUND,
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  seedAppState,
  startRound,
  useMobileViewport,
} from './helpers'

const US_STATE_CAPITALS = new Set(
  capitalStateQuestionBank.map((state) => state.capital),
)

test('each capital-game difficulty can start a round', async ({ page }) => {
  await enableDebugMode(page)

  for (const difficultyId of ['level-1', 'level-2', 'level-3']) {
    await page.goto('/games/guess-the-capital')
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, difficultyId)
  }
})

test('capital game state questions only show US state capitals as options', async ({
  page,
}) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  let foundStateQuestion = false

  for (let index = 0; index < QUESTIONS_PER_ROUND; index += 1) {
    if ((await page.getByText('US state', { exact: true }).count()) > 0) {
      foundStateQuestion = true
      const optionTexts = await page
        .locator('[data-testid^="answer-"]')
        .allTextContents()

      expect(optionTexts).toHaveLength(5)
      expect(optionTexts.every((option) => US_STATE_CAPITALS.has(option.trim()))).toBe(
        true,
      )
      break
    }

    await page.locator('[data-correct="true"]').first().click()
    await expect
      .poll(async () => page.getByTestId('question-progress').textContent(), {
        timeout: 5000,
      })
      .toContain(`Question ${index + 2} / ${QUESTIONS_PER_ROUND}`)
  }

  expect(foundStateQuestion).toBe(true)
})

test('capital game shows flags for country questions and no flag for state questions', async ({
  page,
}) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await useMobileViewport(page)
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  let sawCountryQuestion = false
  let sawStateQuestion = false

  for (let index = 0; index < QUESTIONS_PER_ROUND; index += 1) {
    const isStateQuestion =
      (await page.getByText('US state', { exact: true }).count()) > 0

    if (isStateQuestion) {
      sawStateQuestion = true
      await expect(page.getByAltText(/^Flag of /)).toHaveCount(0)
    } else {
      sawCountryQuestion = true
      await expect(page.getByAltText(/^Flag of /)).toBeVisible()
    }

    if (sawCountryQuestion && sawStateQuestion) {
      break
    }

    await page.locator('[data-correct="true"]').first().click()

    if (index < QUESTIONS_PER_ROUND - 1) {
      await expect
        .poll(async () => page.getByTestId('question-progress').textContent(), {
          timeout: 5000,
        })
        .toContain(`Question ${index + 2} / ${QUESTIONS_PER_ROUND}`)
    }
  }

  expect(sawCountryQuestion).toBe(true)
  expect(sawStateQuestion).toBe(true)
})

test('capital game free-text input autofocuses and reveals the correct capital', async ({
  page,
}) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await useMobileViewport(page)
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

  await expect(page.locator('#capital-answer')).toBeFocused()

  const correctAnswer = await page.locator('#capital-answer').getAttribute('data-answer')
  await page.locator('#capital-answer').fill('Definitely not the correct capital')
  await page.getByRole('button', { name: 'Lock answer' }).click()

  await expect(page.getByTestId('revealed-correct-answer')).toContainText(
    `Correct answer: ${correctAnswer}`,
  )
})

test('starting new capital rounds advances the shared country and state decks across reloads', async ({
  page,
}) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  const firstDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['guess-the-capital']?.capitalDeck
  })

  await page.reload()
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

  const secondDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['guess-the-capital']?.capitalDeck
  })

  expect(firstDeck.nextCountryIndex).toBe(18)
  expect(firstDeck.nextStateIndex).toBe(2)
  expect(secondDeck.nextCountryIndex).toBe(36)
  expect(secondDeck.nextStateIndex).toBe(4)
  expect(secondDeck.orderedCountryCodes).toEqual(firstDeck.orderedCountryCodes)
  expect(secondDeck.orderedStateCodes).toEqual(firstDeck.orderedStateCodes)
})

test('capital game replaying shows the previous high score', async ({ page }) => {
  test.setTimeout(150000)

  await seedAppState(page, {
    version: 5,
    playerId: 'e2e-player',
    games: {
      'guess-the-capital': {
        highScore: {
          score: 8,
          achievedAt: '2026-05-08T20:00:00.000Z',
          difficultyId: 'level-1',
        },
        recentResult: null,
        lastDifficulty: 'level-1',
        countryDeck: null,
        capitalDeck: null,
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
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect(page.getByTestId('result-score')).toContainText('0 points', {
    timeout: 130000,
  })
  await expect(page.getByText('Previous best')).toBeVisible()
  await expect(page.getByText('8', { exact: true })).toBeVisible()
})
