export const correctAdvanceDelayMs = 900
export const incorrectAdvanceDelayMs = 5000

export function getAnswerAdvanceDelayMs(isCorrect: boolean) {
  return isCorrect ? correctAdvanceDelayMs : incorrectAdvanceDelayMs
}
