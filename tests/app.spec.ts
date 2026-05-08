import { expect, test } from '@playwright/test'

async function enableDebugMode(
  page: import('@playwright/test').Page,
  overrides?: Partial<{ timerScale: number; revealAnswers: boolean }>,
) {
  await page.addInitScript(() => {
    window.localStorage.setItem('atlas-of-answers:debug', '__DEBUG__')
  })
  await page.addInitScript((settings) => {
    window.localStorage.setItem(
      'atlas-of-answers:debug',
      JSON.stringify(settings),
    )
  }, { timerScale: 1, revealAnswers: true, ...overrides })
}

test('homepage renders the game shelf and offline badge', async ({ page }) => {
  await enableDebugMode(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Train for trivia rounds with games that respect your attention.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Name the Country Flag', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', {
      name: 'Name the Country by Its Outline',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByTestId('offline-badge-flag-quiz')).toBeVisible()
})

test('each difficulty can start a round', async ({ page }) => {
  await enableDebugMode(page)

  for (const difficultyId of ['level-1', 'level-2', 'level-3']) {
    await page.goto('/games/flag-quiz')
    await page.getByTestId(`difficulty-${difficultyId}`).click()
    await page.getByTestId('start-round').click()
    await expect(page.getByTestId('question-progress')).toContainText(
      'Question 1 / 10',
    )
  }
})

test('timer expiry advances to the next question', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByTestId('question-progress')).toContainText(
    'Question 1 / 10',
  )
  await expect
    .poll(async () => page.getByTestId('question-progress').textContent(), {
      timeout: 5000,
    })
    .not.toContain('Question 1 / 10')
})

test('replaying shows the previous high score', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 1,
        playerId: 'e2e-player',
        games: {
          'flag-quiz': {
            highScore: {
              score: 10,
              achievedAt: '2026-05-08T20:00:00.000Z',
              difficultyId: 'level-1',
            },
            recentResult: null,
            lastDifficulty: 'level-1',
          },
        },
      }),
    )
    window.localStorage.setItem(
      'atlas-of-answers:debug',
      JSON.stringify({ timerScale: 0.01, revealAnswers: false }),
    )
  })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByTestId('result-score')).toContainText('0 points', {
    timeout: 15000,
  })
  await expect(page.getByText('Previous best')).toBeVisible()
  await expect(page.getByText('10', { exact: true })).toBeVisible()
})
