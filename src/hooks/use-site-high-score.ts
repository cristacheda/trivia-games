import { useEffect, useState } from 'react'
import { useAppServices } from '@/app/app-providers'
import type { GameId, SiteLeaderboardLookup } from '@/types/game'

const comingSoonSiteLeaderboard: SiteLeaderboardLookup = {
  status: 'coming-soon',
  entries: [],
  playerRank: null,
}

export function useSiteLeaderboard(gameId: GameId) {
  const { scoreSync } = useAppServices()
  const [siteLeaderboard, setSiteLeaderboard] =
    useState<SiteLeaderboardLookup>(comingSoonSiteLeaderboard)

  useEffect(() => {
    let cancelled = false

    void scoreSync
      .getSiteLeaderboard(gameId)
      .then((nextSiteLeaderboard) => {
        if (!cancelled) {
          setSiteLeaderboard(nextSiteLeaderboard)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSiteLeaderboard(comingSoonSiteLeaderboard)
        }
      })

    return () => {
      cancelled = true
    }
  }, [gameId, scoreSync])

  return siteLeaderboard
}
