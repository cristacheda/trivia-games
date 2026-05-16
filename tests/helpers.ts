import { expect, type Page } from '@playwright/test'

export const QUESTIONS_PER_ROUND = 20

export async function enableDebugMode(
  page: Page,
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

export async function useMobileViewport(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 })
}

export async function dismissPrivacyPromptIfVisible(page: Page) {
  const denyButton = page.getByRole('button', {
    name: 'Use only essential storage',
  })

  if (await denyButton.isVisible()) {
    await denyButton.click()
  }
}

export async function startRound(
  page: Page,
  difficultyId: string,
  questionCount = QUESTIONS_PER_ROUND,
) {
  await page.getByTestId(`difficulty-${difficultyId}`).click()
  await page.getByTestId(`question-count-${questionCount}`).click()
  await page.getByTestId('start-round').click()
  await expect(page.getByTestId('question-progress-footer')).toContainText(
    `Question 1 / ${questionCount}`,
  )
}

export async function answerCorrectChoice(page: Page) {
  await page.locator('[data-correct="true"]').first().click()
}

export async function answerFirstChoice(page: Page) {
  await page.locator('[data-testid^="answer-"]').first().click()
}

export async function expectQuestionNumber(page: Page, questionNumber: number) {
  await expect
    .poll(async () => page.getByTestId('question-progress-footer').textContent(), {
      timeout: 7000,
    })
    .toContain(`Question ${questionNumber} / ${QUESTIONS_PER_ROUND}`)
}

export async function seedAppState(page: Page, state: unknown) {
  await page.addInitScript((appState) => {
    window.localStorage.setItem(
      'atlas-of-answers:app-state',
      JSON.stringify(appState),
    )
  }, state)
}
