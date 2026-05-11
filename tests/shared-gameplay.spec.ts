import { expect, test } from '@playwright/test'
import {
  QUESTIONS_PER_ROUND,
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  seedAppState,
  startRound,
} from './helpers'

test('untimed level 1 shows learning mode without a countdown', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  await expect(page.getByText('Learning mode')).toBeVisible()
  await expect(page.getByText('No time limit')).toBeVisible()
  await expect(page.getByText(/s left/)).toHaveCount(0)
})

test('flag-quiz timer expiry advances to the next question on timed difficulties', async ({
  page,
}) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect
    .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
      timeout: 7000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('capital game timer expiry advances to the next question', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/guess-the-capital')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect
    .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
      timeout: 7000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('outline game timer expiry advances to the next question', async ({ page }) => {
  await enableDebugMode(page, { timerScale: 0.01, revealAnswers: false })
  await page.goto('/games/outline-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect
    .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
      timeout: 7000,
    })
    .not.toContain(`Question 1 / ${QUESTIONS_PER_ROUND}`)
})

test('flag-quiz replaying shows the previous high score', async ({ page }) => {
  test.setTimeout(150000)

  await seedAppState(page, {
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
  })
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'atlas-of-answers:debug',
      JSON.stringify({ timerScale: 0.01, revealAnswers: false }),
    )
  })
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect(page.getByTestId('result-score')).toContainText('0 points', {
    timeout: 130000,
  })
  await expect(page.getByText('Previous best')).toBeVisible()
  await expect(page.getByText('10', { exact: true })).toBeVisible()
  await expect(page.getByTestId('confetti-layer')).toHaveAttribute(
    'data-active',
    'false',
  )
})
