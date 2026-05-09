export const correctAdvanceDelayMs = 1000
export const incorrectAdvanceDelayMs = 3000

export function getAnswerAdvanceDelayMs(isCorrect: boolean) {
  return isCorrect ? correctAdvanceDelayMs : incorrectAdvanceDelayMs
}
