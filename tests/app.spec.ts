import { expect, test } from '@playwright/test'

const QUESTIONS_PER_ROUND = 20

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

async function useMobileViewport(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 390, height: 844 })
}

test('homepage renders the game shelf and offline badge on mobile', async ({ page }) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Train like you are about to walk into the next quiz final.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Name the Country Flag', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Name the Country by Its Outline',
      exact: true,
    }),
  ).toBeVisible()
  await expect(page.getByTestId('offline-badge-flag-quiz')).toBeVisible()
  await expect(page.getByText('Atlas of Answers')).toBeVisible()
  await expect(page.getByRole('button', { name: /menu/i })).toBeVisible()

  await expect
    .poll(async () =>
      page
        .getByRole('heading', {
          name: 'Train like you are about to walk into the next quiz final.',
        })
        .evaluate((element) => window.getComputedStyle(element).fontSize),
    )
    .toBe('24px')
  await expect(
    page.getByText('Atlas of Answers').evaluate(
      (element) => element.scrollWidth <= element.clientWidth + 1,
    ),
  ).resolves.toBe(true)
})

test('each difficulty can start a round', async ({ page }) => {
  await enableDebugMode(page)

  for (const difficultyId of ['level-1', 'level-2', 'level-3']) {
    await page.goto('/games/flag-quiz')
    await page.getByTestId(`difficulty-${difficultyId}`).click()
    await page.getByTestId('start-round').click()
    await expect(page.getByTestId('question-progress')).toContainText(
      `Question 1 / ${QUESTIONS_PER_ROUND}`,
    )
  }
})

test('untimed level 1 shows learning mode without a countdown', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByText('Learning mode')).toBeVisible()
  await expect(page.getByText('No time limit')).toBeVisible()
  await expect(page.getByText(/s left/)).toHaveCount(0)
})

test('timer expiry advances to the next question on timed difficulties', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-2').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByTestId('question-progress')).toContainText(
    `Question 1 / ${QUESTIONS_PER_ROUND}`,
  )
  await expect
    .poll(async () => page.getByTestId('question-progress').textContent(), {
      timeout: 5000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('active round hides extra chrome on mobile', async ({ page }) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-2').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByTestId('question-progress')).toContainText(
    `Question 1 / ${QUESTIONS_PER_ROUND}`,
  )
  await expect(page.getByText('Atlas of Answers')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Name the Country Flag' }),
  ).toHaveCount(0)
})

test('wrong multiple-choice answer marks wrong and correct options before advancing', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  const answers = page.locator('[data-testid^="answer-"]')
  const correctAnswer = page.locator('[data-correct="true"]').first()
  const answerCount = await answers.count()
  let wrongAnswer = answers.first()

  for (let index = 0; index < answerCount; index += 1) {
    const candidate = answers.nth(index)
    if ((await candidate.getAttribute('data-correct')) !== 'true') {
      wrongAnswer = candidate
      break
    }
  }

  await wrongAnswer.click()

  await expect(wrongAnswer).toHaveAttribute('data-feedback', 'wrong')
  await expect(correctAnswer).toHaveAttribute('data-feedback', 'correct')
  await expect(page.getByTestId('resolution-message')).toContainText(
    'The correct answer was',
  )
})

test('correct multiple-choice answer triggers success feedback and advances', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  const correctAnswer = page.locator('[data-correct="true"]').first()
  await correctAnswer.click()

  await expect(correctAnswer).toHaveAttribute('data-feedback', 'correct')
  await expect(page.getByTestId('resolution-message')).toContainText('Correct.')
  await expect
    .poll(async () => page.getByTestId('question-progress').textContent(), {
      timeout: 5000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('replaying shows the previous high score', async ({ page }) => {
  test.setTimeout(45000)

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
  await page.getByTestId('difficulty-level-2').click()
  await page.getByTestId('start-round').click()

  await expect(page.getByTestId('result-score')).toContainText('0 points', {
    timeout: 30000,
  })
  await expect(page.getByText('Previous best')).toBeVisible()
  await expect(page.getByText('10', { exact: true })).toBeVisible()
  await expect(page.getByTestId('confetti-layer')).toHaveAttribute(
    'data-active',
    'false',
  )
})

test('starting new rounds advances the shared country deck across reloads and difficulty changes', async ({
  page,
}) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  const firstDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['flag-quiz']?.countryDeck
  })

  await page.reload()
  await page.getByTestId('difficulty-level-3').click()
  await page.getByTestId('start-round').click()

  const secondDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['flag-quiz']?.countryDeck
  })

  expect(firstDeck.nextIndex).toBe(QUESTIONS_PER_ROUND)
  expect(secondDeck.nextIndex).toBe(QUESTIONS_PER_ROUND * 2)
  expect(secondDeck.orderedCountryCodes).toEqual(firstDeck.orderedCountryCodes)
  expect(
    new Set(secondDeck.orderedCountryCodes.slice(0, secondDeck.nextIndex)).size,
  ).toBe(QUESTIONS_PER_ROUND * 2)
})

test('beating the high score activates the long confetti celebration', async ({ page }) => {
  test.setTimeout(60000)

  await page.addInitScript(() => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify({
        version: 1,
        playerId: 'e2e-player',
        games: {
          'flag-quiz': {
            highScore: {
              score: 0,
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
      JSON.stringify({ timerScale: 1, revealAnswers: true }),
    )
  })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-1').click()
  await page.getByTestId('start-round').click()

  for (let index = 0; index < QUESTIONS_PER_ROUND; index += 1) {
    await page.locator('[data-correct="true"]').first().click()
    if (index < QUESTIONS_PER_ROUND - 1) {
      await expect
        .poll(async () => page.getByTestId('question-progress').textContent(), {
          timeout: 8000,
        })
        .toContain(`Question ${index + 2} / ${QUESTIONS_PER_ROUND}`)
    }
  }

  await expect(page.getByText('New high score')).toBeVisible({ timeout: 10000 })
  await expect(page.getByTestId('confetti-layer')).toHaveAttribute(
    'data-active',
    'true',
  )
})

test('wrong free-text answer reveals the correct country name', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await page.goto('/games/flag-quiz')
  await page.getByTestId('difficulty-level-3').click()
  await page.getByTestId('start-round').click()

  const correctAnswer = await page.locator('#country-answer').getAttribute('data-answer')
  await page.locator('#country-answer').fill('Definitely not the correct country')
  await page.getByRole('button', { name: 'Lock answer' }).click()

  await expect(page.getByTestId('revealed-correct-answer')).toContainText(
    `Correct answer: ${correctAnswer}`,
  )
})
