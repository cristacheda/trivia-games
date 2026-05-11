import { describe, expect, it } from 'vitest'
import { noopScoreSyncProvider } from '@/integrations/noop-providers'

describe('noopScoreSyncProvider', () => {
  it('returns a coming-soon site high score placeholder', async () => {
    await expect(
      noopScoreSyncProvider.getSiteHighScore('flag-quiz'),
    ).resolves.toEqual({
      status: 'coming-soon',
      record: null,
    })
  })
})
