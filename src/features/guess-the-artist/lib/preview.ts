export interface SongPreviewMetadata {
  artworkUrl: string | null
  previewUrl: string | null
  collectionName: string | null
  source: 'itunes'
}

const previewCache = new Map<string, SongPreviewMetadata>()

function toHttpsArtwork(url: unknown): string | null {
  if (typeof url !== 'string' || !url.length) {
    return null
  }

  return url.replace(/^http:\/\//i, 'https://')
}

export async function fetchSongPreviewMetadata({
  songTitle,
  artistName,
  signal,
}: {
  songTitle: string
  artistName: string
  signal?: AbortSignal
}): Promise<SongPreviewMetadata> {
  const cacheKey = `${songTitle}::${artistName}`.toLowerCase()
  const cached = previewCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const term = encodeURIComponent(`${songTitle} ${artistName}`)
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=5`
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Preview lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  const results = Array.isArray(payload.results) ? payload.results : []

  const normalizedArtist = artistName.toLowerCase()
  const bestMatch =
    results.find((item: unknown) => {
      if (!item || typeof item !== 'object') {
        return false
      }

      const candidateArtist =
        typeof (item as { artistName?: unknown }).artistName === 'string'
          ? (item as { artistName: string }).artistName.toLowerCase()
          : ''

      return candidateArtist.includes(normalizedArtist)
    }) ?? results[0]

  const metadata: SongPreviewMetadata = {
    artworkUrl:
      toHttpsArtwork(bestMatch?.artworkUrl600) ??
      toHttpsArtwork(bestMatch?.artworkUrl100),
    previewUrl:
      typeof bestMatch?.previewUrl === 'string' ? bestMatch.previewUrl : null,
    collectionName:
      typeof bestMatch?.collectionName === 'string'
        ? bestMatch.collectionName
        : null,
    source: 'itunes',
  }

  previewCache.set(cacheKey, metadata)
  return metadata
}
