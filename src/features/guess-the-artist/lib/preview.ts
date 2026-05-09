export interface SongPreviewMetadata {
  artworkUrl: string | null
  previewUrl: string | null
  collectionName: string | null
  source: 'unavailable'
}

const previewCache = new Map<string, SongPreviewMetadata>()

function createUnavailableMetadata(): SongPreviewMetadata {
  return {
    artworkUrl: null,
    previewUrl: null,
    collectionName: null,
    source: 'unavailable',
  }
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
    throw new DOMException('The operation was aborted.', 'AbortError')
  }

  const cacheKey = `${songTitle}::${artistName}`.toLowerCase()
  const cached = previewCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const metadata = createUnavailableMetadata()
  previewCache.set(cacheKey, metadata)
  return metadata
}
