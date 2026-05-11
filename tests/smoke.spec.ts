import { expect, test } from '@playwright/test'
import {
  QUESTIONS_PER_ROUND,
  dismissPrivacyPromptIfVisible,
  enableDebugMode,
  startRound,
  useMobileViewport,
} from './helpers'

test('homepage renders the game shelf and offline badge on mobile', async ({ page }) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/')

  await expect(
    page.getByRole('heading', {
      name: 'Play anonymously and choose whether optional tracking is allowed.',
    }),
  ).toBeVisible()
  await dismissPrivacyPromptIfVisible(page)

  await expect(
    page.getByRole('heading', {
      name: 'Train like you are about to walk into the next quiz final.',
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Guess the Country by Its Flag', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Guess the Capital of the Country', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Guess the Country by Its Outline',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: 'Guess the Currency of the Country', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Guess the Official Language of the Country',
      exact: true,
    }),
  ).toBeVisible()
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

test('generic round start works on mobile', async ({ page }) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-1')

  await expect(page.getByTestId('question-progress')).toContainText(
    `Question 1 / ${QUESTIONS_PER_ROUND}`,
  )
})

test('active round hides extra chrome on mobile', async ({ page }) => {
  await enableDebugMode(page)
  await useMobileViewport(page)
  await page.goto('/games/flag-quiz')
  await dismissPrivacyPromptIfVisible(page)
  await startRound(page, 'level-2')

  await expect(page.getByText('Atlas of Answers')).toHaveCount(0)
  await expect(
    page.getByRole('heading', { name: 'Guess the Country by Its Flag' }),
  ).toHaveCount(0)
})
