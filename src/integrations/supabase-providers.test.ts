import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSupabaseAuthProvider,
  createSupabaseScoreSyncProvider,
} from '@/integrations/supabase-providers'

const { mockIsNetworkAvailable, mockReportNetworkOffline } = vi.hoisted(() => ({
  mockIsNetworkAvailable: vi.fn(() => true),
  mockReportNetworkOffline: vi.fn(),
}))

vi.mock('@/lib/connectivity', () => ({
  isNetworkAvailable: () => mockIsNetworkAvailable(),
  reportNetworkOffline: () => mockReportNetworkOffline(),
}))

type ScoreSyncClient = Parameters<typeof createSupabaseScoreSyncProvider>[0]
type AuthClient = Parameters<typeof createSupabaseAuthProvider>[0]

function createSessionMissingError() {
  return {
    name: 'AuthSessionMissingError',
    message: 'Auth session missing!',
    status: 400,
  }
}

describe('supabase providers', () => {
  beforeEach(() => {
    mockIsNetworkAvailable.mockReset()
    mockIsNetworkAvailable.mockReturnValue(true)
    mockReportNetworkOffline.mockReset()
  })

  it('returns a local-only session summary while offline', async () => {
    mockIsNetworkAvailable.mockReturnValue(false)

    const auth = createSupabaseAuthProvider({
      auth: {
        getUser: vi.fn(),
      },
    } as unknown as AuthClient)

    await expect(auth.getSession()).resolves.toEqual({
      userId: null,
      isAnonymous: false,
    })
  })

  it('skips leaderboard requests while offline', async () => {
    mockIsNetworkAvailable.mockReturnValue(false)
    const rpc = vi.fn()

    const scoreSync = createSupabaseScoreSyncProvider({
      auth: {
        getUser: vi.fn(),
      },
      rpc,
    } as unknown as ScoreSyncClient)

    await expect(scoreSync.getSiteLeaderboard('flag-quiz')).resolves.toEqual({
      status: 'coming-soon',
      entries: [],
      playerRank: null,
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('skips round sync when no Supabase session exists yet', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: createSessionMissingError(),
    })
    const upsert = vi.fn().mockResolvedValue({ error: null })

    const client = {
      auth: {
        getUser,
      },
      from: vi.fn().mockReturnValue({
        upsert,
      }),
    } as unknown as ScoreSyncClient

    const scoreSync = createSupabaseScoreSyncProvider(client)

    await expect(
      scoreSync.syncRoundResult({
        result: {
          roundId: 'round-1',
          gameId: 'flag-quiz',
          difficultyId: 'level-1',
          totalScore: 10,
          correctAnswers: 10,
          totalQuestions: 20,
          completedAt: '2026-05-13T10:00:00.000Z',
          previousBestScore: null,
          beatHighScore: false,
        },
        roundDurationSeconds: 42,
        timeoutsCount: 0,
      }),
    ).resolves.toBeUndefined()

    expect(upsert).not.toHaveBeenCalled()
  })

  it('allows Google sign-in to start without an existing session', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: createSessionMissingError(),
    })
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { provider: 'google', url: 'https://example.com' },
      error: null,
    })

    const client = {
      auth: {
        getUser,
        signInWithOAuth,
        linkIdentity: vi.fn(),
      },
    } as unknown as AuthClient

    const auth = createSupabaseAuthProvider(client)

    await expect(auth.signInWithGoogle()).resolves.toBeUndefined()
    expect(signInWithOAuth).toHaveBeenCalledTimes(1)
  })

  it('maps leaderboard entries and current-player rank from the Supabase RPC', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'player-1', is_anonymous: true } },
      error: null,
    })
    const rpc = vi.fn().mockResolvedValue({
      data: [
        {
          entry_kind: 'leaderboard',
          game_id: 'flag-quiz',
          rank: 1,
          score: 40,
          achieved_at: '2026-05-13T10:00:00.000Z',
          player_label: 'Top Player',
          is_current_player: false,
        },
        {
          entry_kind: 'leaderboard',
          game_id: 'flag-quiz',
          rank: 2,
          score: 39,
          achieved_at: '2026-05-13T11:00:00.000Z',
          player_label: 'Second Place',
          is_current_player: false,
        },
        {
          entry_kind: 'player-rank',
          game_id: 'flag-quiz',
          rank: 7,
          score: 18,
          achieved_at: '2026-05-13T12:00:00.000Z',
          player_label: 'You',
          is_current_player: true,
        },
      ],
      error: null,
    })

    const client = {
      auth: {
        getUser,
      },
      rpc,
    } as unknown as ScoreSyncClient

    const scoreSync = createSupabaseScoreSyncProvider(client)

    await expect(scoreSync.getSiteLeaderboard('flag-quiz')).resolves.toEqual({
      status: 'ready',
      entries: [
        {
          achievedAt: '2026-05-13T10:00:00.000Z',
          gameId: 'flag-quiz',
          isCurrentPlayer: false,
          playerLabel: 'Top Player',
          rank: 1,
          score: 40,
        },
        {
          achievedAt: '2026-05-13T11:00:00.000Z',
          gameId: 'flag-quiz',
          isCurrentPlayer: false,
          playerLabel: 'Second Place',
          rank: 2,
          score: 39,
        },
      ],
      playerRank: {
        achievedAt: '2026-05-13T12:00:00.000Z',
        gameId: 'flag-quiz',
        isCurrentPlayer: true,
        playerLabel: 'You',
        rank: 7,
        score: 18,
      },
    })
    expect(rpc).toHaveBeenCalledWith('get_site_leaderboard', {
      target_game_id: 'flag-quiz',
    })
  })

  it('returns an empty ready leaderboard when no synced scores exist yet', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'player-1', is_anonymous: true } },
      error: null,
    })
    const rpc = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const client = {
      auth: {
        getUser,
      },
      rpc,
    } as unknown as ScoreSyncClient

    const scoreSync = createSupabaseScoreSyncProvider(client)

    await expect(scoreSync.getSiteLeaderboard('flag-quiz')).resolves.toEqual({
      status: 'ready',
      entries: [],
      playerRank: null,
    })
  })

  it('falls back to a coming-soon leaderboard when the RPC is not deployed yet', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'player-1', is_anonymous: true } },
      error: null,
    })
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST202',
        message: 'Could not find the function public.get_site_leaderboard(target_game_id)',
        status: 404,
      },
    })

    const client = {
      auth: {
        getUser,
      },
      rpc,
    } as unknown as ScoreSyncClient

    const scoreSync = createSupabaseScoreSyncProvider(client)

    await expect(scoreSync.getSiteLeaderboard('flag-quiz')).resolves.toEqual({
      status: 'coming-soon',
      entries: [],
      playerRank: null,
    })
  })

  it('marks connectivity offline after a transport failure', async () => {
    mockIsNetworkAvailable.mockReturnValue(true)
    const getUser = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    const auth = createSupabaseAuthProvider({
      auth: {
        getUser,
      },
    } as unknown as AuthClient)

    await expect(auth.getSession()).resolves.toEqual({
      userId: null,
      isAnonymous: false,
    })
    expect(mockReportNetworkOffline).toHaveBeenCalled()
  })
})
