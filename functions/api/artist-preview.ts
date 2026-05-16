import {
  createUnavailableMetadata,
  normalizeItunesSearchPayload,
  type SongPreviewMetadata,
} from '../../src/features/guess-the-artist/lib/preview-shared'

interface PagesFunctionContextLike {
  request: Request
  waitUntil?: (promise: Promise<unknown>) => void
}

const itunesSuccessCacheSeconds = 60 * 60 * 24
const itunesUnavailableCacheSeconds = 60 * 60

function buildJsonResponse(body: SongPreviewMetadata, maxAge: number) {
  return new Response(JSON.stringify(body), {
    headers: {
      'Cache-Control': `public, max-age=${maxAge}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function isLocalPreviewHost(hostname: string) {
  return (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

function getCacheStorage() {
  if (typeof caches === 'undefined') {
    return null
  }

  const globalCaches = caches as CacheStorage & { default?: Cache }
  return globalCaches.default ?? null
}

async function fetchItunesPreviewMetadata(
  songTitle: string,
  artistName: string,
): Promise<SongPreviewMetadata> {
  const term = encodeURIComponent(`${songTitle} ${artistName}`)
  const url =
    `https://itunes.apple.com/search?term=${term}` +
    '&country=us&media=music&entity=song&limit=5'

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Preview lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  return normalizeItunesSearchPayload(payload, artistName)
}

export async function onRequestGet(context: PagesFunctionContextLike) {
  const requestUrl = new URL(context.request.url)
  const songTitle = requestUrl.searchParams.get('songTitle')?.trim() ?? ''
  const artistName = requestUrl.searchParams.get('artistName')?.trim() ?? ''
  const shouldBypassCache = isLocalPreviewHost(requestUrl.hostname)

  if (!songTitle || !artistName) {
    return new Response(
      JSON.stringify({ error: 'songTitle and artistName are required.' }),
      {
        status: 400,
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8',
        },
      },
    )
  }

  const cache = shouldBypassCache ? null : getCacheStorage()
  const cacheKey = new Request(requestUrl.toString(), { method: 'GET' })

  if (cache) {
    const cached = await cache.match(cacheKey)

    if (cached) {
      return cached
    }
  }

  const metadata = await fetchItunesPreviewMetadata(songTitle, artistName).catch(() =>
    createUnavailableMetadata(),
  )

  const cacheSeconds =
    metadata.source === 'itunes' ? itunesSuccessCacheSeconds : itunesUnavailableCacheSeconds
  const response = shouldBypassCache
    ? new Response(JSON.stringify(metadata), {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'application/json; charset=utf-8',
        },
      })
    : buildJsonResponse(metadata, cacheSeconds)

  if (cache) {
    const cachePromise = cache.put(cacheKey, response.clone())

    if (context.waitUntil) {
      context.waitUntil(cachePromise)
    } else {
      await cachePromise
    }
  }

  return response
}
