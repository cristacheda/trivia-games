import { expect, test } from '@playwright/test'
import {
  answerFirstChoice,
  answerCorrectChoice,
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  expectQuestionNumber,
  startRound,
  useMobileViewport,
} from './helpers'

const OFFLINE_GAME_ROUTES = [
  '/games/flag-quiz',
  '/games/guess-the-capital',
  '/games/outline-quiz',
  '/games/guess-the-artist',
  '/games/guess-the-currency',
  '/games/guess-the-cocktail',
] as const

async function warmOfflineCache(page: import('@playwright/test').Page) {
  await page.goto('/')
  await dismissPrivacyPromptIfVisible(page)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)

  for (const route of OFFLINE_GAME_ROUTES) {
    await page.goto(route)
    await dismissPrivacyPromptIfVisible(page)
    await page.waitForLoadState('networkidle')
  }
}

async function goOffline(page: import('@playwright/test').Page) {
  await page.context().setOffline(true)
}

async function verifyOfflineMultipleChoiceRound(
  page: import('@playwright/test').Page,
  route: string,
) {
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  for (let questionNumber = 1; questionNumber <= 3; questionNumber += 1) {
    await answerCorrectChoice(page)

    if (questionNumber < 3) {
      await expectQuestionNumber(page, questionNumber + 1)
    }
  }
}

test.describe('production offline playability', () => {
  test('offline route changes still work when the session started directly on cocktail', async ({
    page,
  }) => {
    await enableDebugMode(page)
    await useMobileViewport(page)

    await page.goto('/games/guess-the-cocktail')
    await dismissPrivacyPromptIfVisible(page)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)

    await goOffline(page)

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', {
        name: 'Train like you are about to walk into the next quiz final.',
      }),
    ).toBeVisible()
    await expect(page.getByText('Atlas of Answers')).toBeVisible()
  })

  test('home shell and standard games stay playable offline after warm-up', async ({
    page,
  }) => {
    await enableDebugMode(page)
    await useMobileViewport(page)

    await warmOfflineCache(page)
    await goOffline(page)

    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(
      page.getByRole('heading', {
        name: 'Train like you are about to walk into the next quiz final.',
      }),
    ).toBeVisible()
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByText('Offline', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /menu/i }).click()

    for (const route of [
      '/games/flag-quiz',
      '/games/guess-the-capital',
      '/games/outline-quiz',
      '/games/guess-the-currency',
    ]) {
      await verifyOfflineMultipleChoiceRound(page, route)
    }
  })

  test('timed gameplay continues advancing offline', async ({ page }) => {
    await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
    await useMobileViewport(page)

    await warmOfflineCache(page)
    await goOffline(page)

    await page.goto('/games/flag-quiz', { waitUntil: 'domcontentloaded' })
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, 'level-2')

    await expectQuestionNumber(page, 1)
    await expect
      .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
        timeout: 7000,
      })
      .not.toContain('Question 1 / 20')
  })

  test('artist game stays playable offline without preview playback', async ({
    page,
  }) => {
    await enableDebugMode(page)
    await useMobileViewport(page)

    await warmOfflineCache(page)
    await goOffline(page)

    await page.goto('/games/guess-the-artist', { waitUntil: 'domcontentloaded' })
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, 'level-1')

    await expect(page.getByText('Offline', { exact: true })).toBeVisible()
    await expect(page.getByText('No cover')).toBeVisible()
    await expect(page.getByText('Playing snippet')).toHaveCount(0)
    await expect(page.getByText('Loading preview…')).toHaveCount(0)

    for (let questionNumber = 1; questionNumber <= 3; questionNumber += 1) {
      await answerFirstChoice(page)

      if (questionNumber < 3) {
        await expectQuestionNumber(page, questionNumber + 1)
      }
    }
  })

  test('cocktail game loads a fresh offline round image after standard warm-up', async ({
    page,
  }) => {
    await enableDebugMode(page)
    await useMobileViewport(page)

    await warmOfflineCache(page)
    await goOffline(page)

    await page.goto('/games/guess-the-cocktail', {
      waitUntil: 'domcontentloaded',
    })
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, 'level-1')

    const cocktailImage = page.getByAltText('Cocktail to identify')
    await expect(cocktailImage).toBeVisible()
    await expect(cocktailImage).toHaveJSProperty('complete', true)
    await expect(
      cocktailImage.evaluate((image) => (image as HTMLImageElement).naturalWidth),
    ).resolves.toBeGreaterThan(0)
  })
})
