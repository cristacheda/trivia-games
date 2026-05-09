type SoundCue =
  | 'correct'
  | 'wrong'
  | 'finish'
  | 'high-score'
  | 'time-warning'

let audioContext: AudioContext | null = null

function canUseAudio() {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined'
}

function getAudioContext() {
  if (!canUseAudio()) {
    return null
  }

  audioContext ??= new window.AudioContext()
  return audioContext
}

function applyEnvelope(
  gainNode: GainNode,
  startTime: number,
  duration: number,
  peakGain: number,
) {
  gainNode.gain.setValueAtTime(0.0001, startTime)
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
}

function playTone(
  context: AudioContext,
  {
    startTime,
    frequency,
    duration,
    type,
    peakGain,
  }: {
    startTime: number
    frequency: number
    duration: number
    type: OscillatorType
    peakGain: number
  },
) {
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startTime)
  applyEnvelope(gainNode, startTime, duration, peakGain)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.03)
}

function playCue(context: AudioContext, cue: SoundCue) {
  const startTime = context.currentTime + 0.01

  if (cue === 'correct') {
    playTone(context, {
      startTime,
      frequency: 740,
      duration: 0.12,
      type: 'sine',
      peakGain: 0.05,
    })
    playTone(context, {
      startTime: startTime + 0.08,
      frequency: 988,
      duration: 0.16,
      type: 'triangle',
      peakGain: 0.045,
    })
    return
  }

  if (cue === 'wrong') {
    playTone(context, {
      startTime,
      frequency: 320,
      duration: 0.16,
      type: 'triangle',
      peakGain: 0.04,
    })
    playTone(context, {
      startTime: startTime + 0.06,
      frequency: 220,
      duration: 0.2,
      type: 'sine',
      peakGain: 0.035,
    })
    return
  }

  if (cue === 'finish') {
    playTone(context, {
      startTime,
      frequency: 523.25,
      duration: 0.14,
      type: 'triangle',
      peakGain: 0.04,
    })
    playTone(context, {
      startTime: startTime + 0.1,
      frequency: 659.25,
      duration: 0.16,
      type: 'triangle',
      peakGain: 0.04,
    })
    playTone(context, {
      startTime: startTime + 0.2,
      frequency: 783.99,
      duration: 0.24,
      type: 'sine',
      peakGain: 0.045,
    })
    return
  }

  if (cue === 'time-warning') {
    playTone(context, {
      startTime,
      frequency: 622.25,
      duration: 0.08,
      type: 'sine',
      peakGain: 0.02,
    })
    return
  }

  playTone(context, {
    startTime,
    frequency: 659.25,
    duration: 0.12,
    type: 'triangle',
    peakGain: 0.05,
  })
  playTone(context, {
    startTime: startTime + 0.08,
    frequency: 880,
    duration: 0.14,
    type: 'triangle',
    peakGain: 0.05,
  })
  playTone(context, {
    startTime: startTime + 0.16,
    frequency: 1174.66,
    duration: 0.2,
    type: 'sine',
    peakGain: 0.055,
  })
  playTone(context, {
    startTime: startTime + 0.28,
    frequency: 1567.98,
    duration: 0.32,
    type: 'sine',
    peakGain: 0.05,
  })
}

export async function primeSound() {
  const context = getAudioContext()
  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    await context.resume()
  }
}

export async function playSoundCue(cue: SoundCue) {
  const context = getAudioContext()
  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    await context.resume()
  }

  playCue(context, cue)
}
