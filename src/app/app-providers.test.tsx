import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/app-providers'
import { resetConnectivityForTests } from '@/lib/connectivity'

const getSession = vi.fn()
const syncLocalSnapshot = vi.fn()
const unsubscribe = vi.fn()

vi.mock('@/integrations/supabase-providers', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe,
          },
        },
      }),
    },
  }),
  createSupabaseAuthProvider: () => ({
    signInWithGoogle: vi.fn(),
    signInWithGitHub: vi.fn(),
    signOut: vi.fn(),
    getSession,
  }),
  createSupabaseScoreSyncProvider: () => ({
    syncRoundResult: vi.fn(),
    syncLocalSnapshot,
    getSiteLeaderboard: vi.fn(),
  }),
}))

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

describe('AppProviders offline sync gating', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getSession.mockReset()
    syncLocalSnapshot.mockReset()
    unsubscribe.mockReset()
    resetConnectivityForTests()
    setNavigatorOnline(true)
  })

  afterEach(() => {
    vi.useRealTimers()
    resetConnectivityForTests()
    setNavigatorOnline(true)
  })

  it('waits until reconnect before resuming snapshot sync bootstrap', async () => {
    getSession.mockResolvedValue({
      userId: 'player-1',
      isAnonymous: true,
    })

    setNavigatorOnline(false)

    render(
      <AppProviders>
        <div>child</div>
      </AppProviders>,
    )

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(getSession).not.toHaveBeenCalled()
    expect(syncLocalSnapshot).not.toHaveBeenCalled()

    setNavigatorOnline(true)

    await act(async () => {
      window.dispatchEvent(new Event('online'))
      await vi.advanceTimersByTimeAsync(200)
    })

    expect(getSession).toHaveBeenCalledTimes(1)
    expect(syncLocalSnapshot).toHaveBeenCalledTimes(1)
  })
})
