import {
  createUnavailableMetadata,
  type SongPreviewMetadata,
} from '@/features/guess-the-artist/lib/preview-shared'

export type { SongPreviewMetadata } from '@/features/guess-the-artist/lib/preview-shared'

const previewCache = new Map<string, SongPreviewMetadata>()

function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
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
  if (signal?.aborted) {
    throw createAbortError()
  }

  const cacheKey = `${songTitle}::${artistName}`.toLowerCase()
  const cached = previewCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const url = new URL('/api/artist-preview', window.location.origin)
  url.searchParams.set('songTitle', songTitle)
  url.searchParams.set('artistName', artistName)

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
    signal,
  })

  if (!response.ok) {
    if (response.status === 400) {
      return createUnavailableMetadata()
    }

    throw new Error(`Preview lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  const metadata: SongPreviewMetadata =
    payload &&
    typeof payload === 'object' &&
    ('source' in payload || 'previewUrl' in payload || 'artworkUrl' in payload)
      ? {
          artworkUrl: typeof payload.artworkUrl === 'string' ? payload.artworkUrl : null,
          previewUrl: typeof payload.previewUrl === 'string' ? payload.previewUrl : null,
          collectionName:
            typeof payload.collectionName === 'string' ? payload.collectionName : null,
          source:
            payload.source === 'itunes'
              ? ('itunes' as const)
              : ('unavailable' as const),
        }
      : createUnavailableMetadata()

  previewCache.set(cacheKey, metadata)
  return metadata
}
