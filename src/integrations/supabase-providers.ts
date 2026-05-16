import {
  createClient,
  type SupabaseClient,
  type User,
} from '@supabase/supabase-js'
import { env } from '@/config/env'
import type {
  AuthProvider,
  AuthSessionSummary,
  ScoreSyncProvider,
} from '@/integrations/contracts'
import { isNetworkAvailable, reportNetworkOffline } from '@/lib/connectivity'
import { readAppState } from '@/lib/storage'
import type {
  GameId,
  GameLocalStats,
  PersistedAppState,
  RoundSyncPayload,
  SiteLeaderboardEntry,
  SiteLeaderboardLookup,
} from '@/types/game'

let browserClient: SupabaseClient | null | undefined
const OFFLINE_AUTH_MESSAGE = 'You are offline. Reconnect and try again.'
const OFFLINE_SIGN_OUT_MESSAGE = 'You are offline. Reconnect before signing out of cloud sync.'

function isBrowser() {
  return typeof window !== 'undefined'
}

function buildRedirectTo() {
  if (!isBrowser()) {
    return env.appBaseUrl
  }

  return window.location.href
}

function logAuthLaunch(details: Record<string, unknown>) {
  if (!isBrowser()) {
    return
  }

  console.info('[atlas-auth]', details)
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message?: unknown }

    if (typeof message === 'string') {
      return message
    }
  }

  return 'Unknown authentication error.'
}

function isConnectivityError(error: unknown) {
  if (!error) {
    return false
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const { status } = error as { status?: unknown }

    if (status === 0) {
      return true
    }
  }

  const message = getErrorMessage(error).toLowerCase()

  return [
    'failed to fetch',
    'fetch failed',
    'networkerror',
    'network request failed',
    'load failed',
    'offline',
  ].some((fragment) => message.includes(fragment))
}

function markOfflineFromError(error: unknown) {
  if (isConnectivityError(error)) {
    reportNetworkOffline()
    return true
  }

  return false
}

function isMissingLeaderboardRpcError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as {
    code?: unknown
    message?: unknown
    status?: unknown
  }

  return (
    maybeError.status === 404 ||
    maybeError.code === 'PGRST202' ||
    (typeof maybeError.message === 'string' &&
      maybeError.message.includes('get_site_leaderboard'))
  )
}

function isAuthSessionMissingError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const maybeError = error as {
    code?: unknown
    message?: unknown
    name?: unknown
    status?: unknown
  }

  return (
    maybeError.name === 'AuthSessionMissingError' ||
    maybeError.code === 'session_missing' ||
    maybeError.message === 'Auth session missing!' ||
    maybeError.status === 400
  )
}

function getProviderDisplayName(user: User) {
  const metadata = user.user_metadata ?? {}

  if (typeof metadata.full_name === 'string' && metadata.full_name.length > 0) {
    return metadata.full_name
  }

  if (typeof metadata.name === 'string' && metadata.name.length > 0) {
    return metadata.name
  }

  if (typeof user.email === 'string' && user.email.length > 0) {
    return user.email
  }

  return null
}

function toAuthSessionSummary(user: User | null): AuthSessionSummary {
  return {
    userId: user?.id ?? null,
    isAnonymous: user?.is_anonymous ?? false,
  }
}

async function ensureSupabaseUser(client: SupabaseClient) {
  const {
    data: { user: existingUser },
    error: getUserError,
  } = await client.auth.getUser().catch((error: unknown) => {
    if (markOfflineFromError(error)) {
      return {
        data: { user: null },
        error,
      }
    }

    throw error
  })

  if (getUserError && !isAuthSessionMissingError(getUserError)) {
    throw getUserError
  }

  if (existingUser) {
    return existingUser
  }

  const { error: signInError } = await client.auth.signInAnonymously().catch((error: unknown) => {
    if (markOfflineFromError(error)) {
      return { error }
    }

    throw error
  })

  if (signInError) {
    throw signInError
  }

  const {
    data: { user: anonymousUser },
    error: anonymousUserError,
  } = await client.auth.getUser().catch((error: unknown) => {
    if (markOfflineFromError(error)) {
      return {
        data: { user: null },
        error,
      }
    }

    throw error
  })

  if (anonymousUserError) {
    throw anonymousUserError
  }

  if (!anonymousUser) {
    throw new Error('Supabase anonymous sign-in did not return a user.')
  }

  return anonymousUser
}

function buildPlayerGameStatsRow(
  playerId: string,
  gameId: GameId,
  stats: GameLocalStats,
) {
  if (!stats.highScore && !stats.recentResult && !stats.lastDifficulty) {
    return null
  }

  return {
    player_id: playerId,
    game_id: gameId,
    last_difficulty: stats.lastDifficulty,
    high_score: stats.highScore?.score ?? null,
    high_score_achieved_at: stats.highScore?.achievedAt ?? null,
    high_score_difficulty_id: stats.highScore?.difficultyId ?? null,
    recent_total_score: stats.recentResult?.totalScore ?? null,
    recent_correct_answers: stats.recentResult?.correctAnswers ?? null,
    recent_total_questions: stats.recentResult?.totalQuestions ?? null,
    recent_completed_at: stats.recentResult?.completedAt ?? null,
    recent_difficulty_id: stats.recentResult?.difficultyId ?? null,
    updated_at: new Date().toISOString(),
  }
}

async function syncLocalSnapshotForUser(
  client: SupabaseClient,
  user: User,
  state: PersistedAppState,
) {
  const { error: profileError } = await client.from('player_profiles').upsert(
    {
      id: user.id,
      local_player_id: state.playerId,
      display_name: state.profile.displayName ?? getProviderDisplayName(user),
      sound_enabled: state.preferences.soundEnabled,
      tracking_consent: state.preferences.trackingConsent,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: 'id',
    },
  )

  if (profileError) {
    throw profileError
  }

  const statsRows = Object.entries(state.games)
    .map(([gameId, stats]) =>
      buildPlayerGameStatsRow(user.id, gameId as GameId, stats as GameLocalStats),
    )
    .filter((row): row is NonNullable<typeof row> => row !== null)

  if (statsRows.length === 0) {
    return
  }

  const { error: statsError } = await client.from('player_game_stats').upsert(statsRows, {
    onConflict: 'player_id,game_id',
  })

  if (statsError) {
    throw statsError
  }
}

function buildRoundResultRow(
  playerId: string,
  payload: RoundSyncPayload,
) {
  return {
    id: payload.result.roundId,
    player_id: playerId,
    game_id: payload.result.gameId,
    difficulty_id: payload.result.difficultyId,
    total_score: payload.result.totalScore,
    correct_answers: payload.result.correctAnswers,
    total_questions: payload.result.totalQuestions,
    completed_at: payload.result.completedAt,
    previous_best_score: payload.result.previousBestScore,
    beat_high_score: payload.result.beatHighScore,
    round_duration_seconds: payload.roundDurationSeconds,
    timeouts_count: payload.timeoutsCount,
  }
}

async function syncRoundPayloadForUser(
  client: SupabaseClient,
  user: User,
  payload: RoundSyncPayload,
) {
  const { error: roundError } = await client
    .from('round_results')
    .upsert(buildRoundResultRow(user.id, payload), {
      onConflict: 'id',
    })

  if (roundError) {
    throw roundError
  }
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) {
    return browserClient
  }

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    browserClient = null
    return browserClient
  }

  browserClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  })

  return browserClient
}

export function createSupabaseAuthProvider(client: SupabaseClient): AuthProvider {
  return {
    async signInWithGoogle() {
      if (!isNetworkAvailable()) {
        throw new Error(OFFLINE_AUTH_MESSAGE)
      }

      const {
        data: { user },
        error: getUserError,
      } = await client.auth.getUser().catch((error: unknown) => {
        if (markOfflineFromError(error)) {
          throw new Error(OFFLINE_AUTH_MESSAGE)
        }

        throw error
      })

      if (getUserError && !isAuthSessionMissingError(getUserError)) {
        throw getUserError
      }

      const redirectTo = buildRedirectTo()

      const credentials = {
        provider: 'google' as const,
        options: {
          redirectTo,
        },
      }

      logAuthLaunch({
        action: user?.is_anonymous ? 'link-google' : 'sign-in-google',
        currentUrl: isBrowser() ? window.location.href : env.appBaseUrl,
        redirectTo,
        supabaseUrl: env.supabaseUrl,
        userId: user?.id ?? null,
        isAnonymous: user?.is_anonymous ?? false,
      })

      const response = user?.is_anonymous
        ? await client.auth.linkIdentity(credentials).catch((error: unknown) => ({
            data: { provider: 'google', url: null },
            error,
          }))
        : await client.auth.signInWithOAuth(credentials).catch((error: unknown) => ({
            data: { provider: 'google', url: null },
            error,
          }))

      if (response.error) {
        if (markOfflineFromError(response.error)) {
          throw new Error(OFFLINE_AUTH_MESSAGE)
        }

        if (user?.is_anonymous) {
          throw new Error(
            `Google linking failed. Enable manual identity linking in Supabase Auth settings, then try again. ${getErrorMessage(response.error)}`,
          )
        }

        throw response.error
      }
    },
    async signInWithGitHub() {},
    async signOut() {
      if (!isNetworkAvailable()) {
        throw new Error(OFFLINE_SIGN_OUT_MESSAGE)
      }

      const { error } = await client.auth.signOut().catch((caughtError: unknown) => ({
        error: caughtError,
      }))

      if (error) {
        if (markOfflineFromError(error)) {
          throw new Error(OFFLINE_SIGN_OUT_MESSAGE)
        }

        throw error
      }
    },
    async getSession() {
      if (!isNetworkAvailable()) {
        return toAuthSessionSummary(null)
      }

      try {
        const user = await ensureSupabaseUser(client)
        return toAuthSessionSummary(user)
      } catch (error) {
        if (markOfflineFromError(error)) {
          return toAuthSessionSummary(null)
        }

        throw error
      }
    },
  }
}

export function createSupabaseScoreSyncProvider(
  client: SupabaseClient,
): ScoreSyncProvider {
  function createComingSoonLeaderboard(): SiteLeaderboardLookup {
    return {
      status: 'coming-soon',
      entries: [],
      playerRank: null,
    }
  }

  function toLeaderboardEntry(
    gameId: GameId,
    record: {
      rank: number | string
      score: number
      achieved_at: string
      player_label: string | null
      is_current_player: boolean
    },
  ): SiteLeaderboardEntry {
    return {
      gameId,
      rank: Number(record.rank),
      score: record.score,
      achievedAt: record.achieved_at,
      playerLabel: record.player_label,
      isCurrentPlayer: record.is_current_player,
    }
  }

  return {
    async syncRoundResult(payload) {
      if (!isNetworkAvailable()) {
        return
      }

      try {
        const user = await ensureSupabaseUser(client)
        const state = readAppState()
        await syncLocalSnapshotForUser(client, user, state)
        await syncRoundPayloadForUser(client, user, payload)
      } catch (error) {
        if (markOfflineFromError(error)) {
          return
        }

        throw error
      }
    },
    async syncLocalSnapshot(playerId) {
      if (!isNetworkAvailable()) {
        return
      }

      try {
        const user = await ensureSupabaseUser(client)
        const state = readAppState()

        if (state.playerId !== playerId) {
          await syncLocalSnapshotForUser(client, user, {
            ...state,
            playerId,
          })
          return
        }

        await syncLocalSnapshotForUser(client, user, state)
      } catch (error) {
        if (markOfflineFromError(error)) {
          return
        }

        throw error
      }
    },
    async getSiteLeaderboard(gameId) {
      if (!isNetworkAvailable()) {
        return createComingSoonLeaderboard()
      }

      try {
        await ensureSupabaseUser(client)

        const { data, error } = await client.rpc('get_site_leaderboard', {
          target_game_id: gameId,
        })

        if (error) {
          if (markOfflineFromError(error) || isMissingLeaderboardRpcError(error)) {
            return createComingSoonLeaderboard()
          }

          throw error
        }

        const rows = Array.isArray(data) ? data : data ? [data] : []

        if (rows.length === 0) {
          return {
            status: 'ready',
            entries: [],
            playerRank: null,
          }
        }

        const leaderboardRows = rows.filter(
          (row) => row.entry_kind === 'leaderboard',
        )
        const playerRankRow = rows.find((row) => row.entry_kind === 'player-rank')
        const entries = leaderboardRows.map((row) => toLeaderboardEntry(gameId, row))
        const topFivePlayerRow = entries.find((entry) => entry.isCurrentPlayer) ?? null
        const playerRank = topFivePlayerRow
          ? topFivePlayerRow
          : playerRankRow
            ? toLeaderboardEntry(gameId, playerRankRow)
            : null

        return {
          status: 'ready',
          entries,
          playerRank,
        } satisfies SiteLeaderboardLookup
      } catch (error) {
        if (markOfflineFromError(error)) {
          return createComingSoonLeaderboard()
        }

        throw error
      }
    },
  }
}
