import { describe, expect, it } from 'vitest'
import { noopScoreSyncProvider } from '@/integrations/noop-providers'

describe('noopScoreSyncProvider', () => {
  it('returns a coming-soon site leaderboard placeholder', async () => {
    await expect(
      noopScoreSyncProvider.getSiteLeaderboard('flag-quiz'),
    ).resolves.toEqual({
      status: 'coming-soon',
      entries: [],
      playerRank: null,
    })
  })
})
