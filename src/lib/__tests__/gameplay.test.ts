import { describe, expect, it } from 'vitest'
import { getNextTimeWarningSecond } from '@/lib/gameplay'

describe('getNextTimeWarningSecond', () => {
  it('does not trigger at or above 5 seconds', () => {
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 5000,
        lastWarningSecond: null,
      }),
    ).toBeNull()
  })

  it('triggers at 4, 3, 2, and 1 seconds', () => {
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 4000,
        lastWarningSecond: null,
      }),
    ).toBe(4)
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 3000,
        lastWarningSecond: null,
      }),
    ).toBe(3)
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 1999,
        lastWarningSecond: null,
      }),
    ).toBe(2)
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 1000,
        lastWarningSecond: null,
      }),
    ).toBe(1)
  })

  it('does not retrigger in the same second window', () => {
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 3700,
        lastWarningSecond: null,
      }),
    ).toBe(4)
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'idle',
        remainingMs: 3100,
        lastWarningSecond: 4,
      }),
    ).toBeNull()
  })

  it('does not trigger when resolution is locked or sound is off', () => {
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'wrong',
        remainingMs: 4200,
        lastWarningSecond: null,
      }),
    ).toBeNull()
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: false,
        resolution: 'idle',
        remainingMs: 4200,
        lastWarningSecond: null,
      }),
    ).toBeNull()
    expect(
      getNextTimeWarningSecond({
        hasTimeLimit: true,
        soundEnabled: true,
        resolution: 'timeout',
        remainingMs: 900,
        lastWarningSecond: null,
      }),
    ).toBeNull()
  })
})
