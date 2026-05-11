import { useEffect, useState } from 'react'
import { useAppServices } from '@/app/app-providers'
import type { GameId, SiteHighScoreLookup } from '@/types/game'

const comingSoonSiteHighScore: SiteHighScoreLookup = {
  status: 'coming-soon',
  record: null,
}

export function useSiteHighScore(gameId: GameId) {
  const { scoreSync } = useAppServices()
  const [siteHighScore, setSiteHighScore] =
    useState<SiteHighScoreLookup>(comingSoonSiteHighScore)

  useEffect(() => {
    let cancelled = false

    void scoreSync
      .getSiteHighScore(gameId)
      .then((nextSiteHighScore) => {
        if (!cancelled) {
          setSiteHighScore(nextSiteHighScore)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSiteHighScore(comingSoonSiteHighScore)
        }
      })

    return () => {
      cancelled = true
    }
  }, [gameId, scoreSync])

  return siteHighScore
}
