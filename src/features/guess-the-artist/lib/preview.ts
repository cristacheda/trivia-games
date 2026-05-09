export interface SongPreviewMetadata {
  artworkUrl: string | null
  previewUrl: string | null
  collectionName: string | null
  source: 'itunes'
}

const previewCache = new Map<string, SongPreviewMetadata>()
let previewRequestSequence = 0

interface ItunesSearchResult {
  artistName?: unknown
  artworkUrl100?: unknown
  artworkUrl600?: unknown
  collectionName?: unknown
  previewUrl?: unknown
}

interface ItunesSearchPayload {
  results?: unknown
}

function toHttpsArtwork(url: unknown): string | null {
  if (typeof url !== 'string' || !url.length) {
    return null
  }

  return url.replace(/^http:\/\//i, 'https://')
}

function createAbortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function getPreviewCallbackRegistry() {
  return window as unknown as Record<string, unknown>
}

function loadItunesSearchJsonp(
  url: string,
  signal?: AbortSignal,
): Promise<ItunesSearchPayload> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('Preview lookup is only available in the browser'))
  }

  return new Promise<ItunesSearchPayload>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError())
      return
    }

    const callbackName = `__itunesSearchPreviewCb${previewRequestSequence++}`
    const previewCallbackRegistry = getPreviewCallbackRegistry()
    const script = document.createElement('script')
    let settled = false

    const cleanup = () => {
      settled = true
      delete previewCallbackRegistry[callbackName]
      script.remove()
      signal?.removeEventListener('abort', handleAbort)
    }

    const handleAbort = () => {
      if (settled) {
        return
      }

      cleanup()
      reject(createAbortError())
    }

    previewCallbackRegistry[callbackName] = (payload: ItunesSearchPayload) => {
      if (settled) {
        return
      }

      cleanup()
      resolve(payload)
    }

    script.async = true
    script.src = `${url}&callback=${encodeURIComponent(callbackName)}`
    script.onerror = () => {
      if (settled) {
        return
      }

      cleanup()
      reject(new Error('Preview lookup failed to load'))
    }

    signal?.addEventListener('abort', handleAbort, { once: true })
    document.head.append(script)
  })
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
  const url =
    `https://itunes.apple.com/search?term=${term}` +
    '&country=us&media=music&entity=song&limit=5'
  const payload = await loadItunesSearchJsonp(url, signal)
  const results = Array.isArray(payload.results) ? payload.results : []

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
    source: 'itunes',
  }

  previewCache.set(cacheKey, metadata)
  return metadata
}
