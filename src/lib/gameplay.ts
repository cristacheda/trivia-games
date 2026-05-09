export const correctAdvanceDelayMs = 1000
export const incorrectAdvanceDelayMs = 3000
export const lowTimeWarningThresholdMs = 5000

export function getAnswerAdvanceDelayMs(isCorrect: boolean) {
  return isCorrect ? correctAdvanceDelayMs : incorrectAdvanceDelayMs
}

export function getNextTimeWarningSecond({
  hasTimeLimit,
  soundEnabled,
  resolution,
  remainingMs,
  lastWarningSecond,
}: {
  hasTimeLimit: boolean
  soundEnabled: boolean
  resolution: 'idle' | 'correct' | 'wrong' | 'timeout'
  remainingMs: number
  lastWarningSecond: number | null
}) {
  if (!hasTimeLimit || !soundEnabled || resolution !== 'idle') {
    return null
  }

  if (remainingMs >= lowTimeWarningThresholdMs) {
    return null
  }

  const remainingSecond = Math.ceil(remainingMs / 1000)
  if (remainingSecond < 1 || remainingSecond > 4) {
    return null
  }

  if (lastWarningSecond === remainingSecond) {
    return null
  }

  return remainingSecond
}
