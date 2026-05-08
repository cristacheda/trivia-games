const DEBUG_STORAGE_KEY = 'atlas-of-answers:debug'

export interface DebugSettings {
  timerScale: number
  revealAnswers: boolean
}

export function getDebugSettings(): DebugSettings {
  if (typeof window === 'undefined') {
    return { timerScale: 1, revealAnswers: false }
  }

  try {
    const raw = window.localStorage.getItem(DEBUG_STORAGE_KEY)
    if (!raw) {
      return { timerScale: 1, revealAnswers: false }
    }

    const parsed = JSON.parse(raw) as Partial<DebugSettings>

    return {
      timerScale:
        typeof parsed.timerScale === 'number' && parsed.timerScale > 0
          ? parsed.timerScale
          : 1,
      revealAnswers: parsed.revealAnswers === true,
    }
  } catch {
    return { timerScale: 1, revealAnswers: false }
  }
}
