import { expect, test } from '@playwright/test'
import {
  QUESTIONS_PER_ROUND,
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  startRound,
  useMobileViewport,
} from './helpers'

test('each flag-quiz difficulty can start a round', async ({ page }) => {
  await enableDebugMode(page)

  for (const difficultyId of ['level-1', 'level-2', 'level-3']) {
    await page.goto('/games/flag-quiz')
    await dismissPrivacyPromptIfVisible(page)
    await startRound(page, difficultyId)
  }
})

test('wrong multiple-choice answer marks wrong and correct options before advancing', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 1, revealAnswers: true })
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

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
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  const correctAnswer = page.locator('[data-correct="true"]').first()
  await correctAnswer.click()

  await expect(correctAnswer).toHaveAttribute('data-feedback', 'correct')
  await expect(page.getByTestId('resolution-message')).toContainText('Correct.')
  await expect
    .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
      timeout: 5000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('starting new rounds advances the shared country deck across reloads and difficulty changes', async ({
  page,
}) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  const firstDeck = await page.evaluate(() => {
    const state = JSON.parse(
      window.localStorage.getItem('atlas-of-answers:app-state') ?? '{}',
    )

    return state.games?.['flag-quiz']?.countryDeck
  })

  await page.reload()
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

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
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  for (let index = 0; index < QUESTIONS_PER_ROUND; index += 1) {
    await page.locator('[data-correct="true"]').first().click()
    if (index < QUESTIONS_PER_ROUND - 1) {
      await expect
        .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
          timeout: 12000,
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
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-3')

  const correctAnswer = await page.locator('#country-answer').getAttribute('data-answer')
  await page.locator('#country-answer').fill('Definitely not the correct country')
  await page.getByRole('button', { name: 'Lock answer' }).click()

  await expect(page.getByTestId('revealed-correct-answer')).toContainText(
    `Correct answer: ${correctAnswer}`,
  )
})
