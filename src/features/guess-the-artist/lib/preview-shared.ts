export interface SongPreviewMetadata {
  artworkUrl: string | null
  previewUrl: string | null
  collectionName: string | null
  source: 'itunes' | 'unavailable'
}

export interface ItunesSearchResult {
  artistName?: unknown
  artworkUrl100?: unknown
  artworkUrl600?: unknown
  collectionName?: unknown
  previewUrl?: unknown
}

export interface ItunesSearchPayload {
  results?: unknown
}

export function createUnavailableMetadata(): SongPreviewMetadata {
  return {
    artworkUrl: null,
    previewUrl: null,
    collectionName: null,
    source: 'unavailable',
  }
}

export function toHttpsArtwork(url: unknown): string | null {
  if (typeof url !== 'string' || !url.length) {
    return null
  }

  return url.replace(/^http:\/\//i, 'https://')
}

export function normalizeItunesSearchPayload(
  payload: unknown,
  artistName: string,
): SongPreviewMetadata {
  if (!payload || typeof payload !== 'object') {
    return createUnavailableMetadata()
  }

  const rawResults = (payload as ItunesSearchPayload).results
  const results: unknown[] = Array.isArray(rawResults) ? (rawResults as unknown[]) : []
  const normalizedArtist = artistName.toLowerCase()
  const bestMatch =
    results.find((item: unknown) => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const candidate = item as ItunesSearchResult
      const candidateArtist =
        typeof candidate.artistName === 'string' ? candidate.artistName.toLowerCase() : ''

      return candidateArtist.includes(normalizedArtist)
    }) ?? results[0]

  const bestMatchResult =
    bestMatch && typeof bestMatch === 'object'
      ? (bestMatch as ItunesSearchResult)
      : undefined

  const metadata: SongPreviewMetadata = {
    artworkUrl:
      toHttpsArtwork(bestMatchResult?.artworkUrl600) ??
      toHttpsArtwork(bestMatchResult?.artworkUrl100),
    previewUrl:
      typeof bestMatchResult?.previewUrl === 'string' ? bestMatchResult.previewUrl : null,
    collectionName:
      typeof bestMatchResult?.collectionName === 'string'
        ? bestMatchResult.collectionName
        : null,
    source: bestMatchResult ? 'itunes' : 'unavailable',
  }

  if (!metadata.artworkUrl && !metadata.previewUrl && !metadata.collectionName) {
    return createUnavailableMetadata()
  }

  return metadata
}
