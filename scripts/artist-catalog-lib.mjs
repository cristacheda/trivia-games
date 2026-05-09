import fs from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import countries from 'world-countries'

const catalogStartMarker = 'const songSeeds: SongSeed[] = [\n'
const catalogEndMarker = '\n]\n\nfunction computeSongSelectionWeight'
const reportDirectoryName = 'artist-catalog-reports'
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(
  readFileSync(path.resolve(currentDirectory, '../package.json'), 'utf8'),
)
const packageName = packageJson.name
const packageVersion = packageJson.version
const repositoryUrl = 'https://github.com/cristacheda/trivia-games'
const serviceRequestPolicies = {
  musicbrainz: {
    minIntervalMs: 1100,
    retryStatuses: new Set([429, 500, 502, 503, 504]),
    maxAttempts: 3,
    backoffMs: 1500,
  },
  lastfm: {
    minIntervalMs: 250,
    retryStatuses: new Set([429, 500, 502, 503, 504]),
    maxAttempts: 3,
    backoffMs: 1000,
  },
  itunes: {
    minIntervalMs: 250,
    retryStatuses: new Set([429, 500, 502, 503, 504]),
    maxAttempts: 3,
    backoffMs: 1000,
  },
}
const nextServiceRequestAt = new Map()

const countryRegionByCode = new Map(
  countries
    .filter((country) => typeof country.cca2 === 'string' && typeof country.region === 'string')
    .map((country) => [country.cca2.toUpperCase(), country.region]),
)

const countryRegionByName = new Map(
  countries.flatMap((country) => {
    const names = [
      country.name?.common,
      country.name?.official,
      ...(Array.isArray(country.altSpellings) ? country.altSpellings : []),
    ].filter((value) => typeof value === 'string')

    return names.map((name) => [normalizeForComparison(name), country.region])
  }),
)

export const songsCatalogPath = path.resolve(
  process.cwd(),
  'src/features/guess-the-artist/data/songs.ts',
)

function buildUserAgent() {
  return `${packageName}/${packageVersion} (${repositoryUrl})`
}

function getDefaultHeaders(extraHeaders = {}) {
  return {
    'User-Agent': buildUserAgent(),
    ...extraHeaders,
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function shouldRetryHttpStatus(serviceName, status) {
  const policy = serviceRequestPolicies[serviceName]
  return Boolean(policy?.retryStatuses.has(status))
}

async function waitForServiceWindow(serviceName, now = Date.now()) {
  const policy = serviceRequestPolicies[serviceName]

  if (!policy) {
    return
  }

  const earliestRequestAt = nextServiceRequestAt.get(serviceName) ?? 0

  if (earliestRequestAt > now) {
    await sleep(earliestRequestAt - now)
  }

  nextServiceRequestAt.set(serviceName, Math.max(earliestRequestAt, now) + policy.minIntervalMs)
}

async function fetchWithPolicy(serviceName, url, options = {}, fetchImpl = fetch) {
  const policy = serviceRequestPolicies[serviceName]

  if (!policy) {
    return fetchImpl(url, options)
  }

  let lastError = null

  for (let attempt = 1; attempt <= policy.maxAttempts; attempt += 1) {
    await waitForServiceWindow(serviceName)

    try {
      const response = await fetchImpl(url, options)

      if (!shouldRetryHttpStatus(serviceName, response.status) || attempt === policy.maxAttempts) {
        return response
      }

      const retryAfterHeader = response.headers.get('retry-after')
      const retryAfterSeconds = Number.parseInt(retryAfterHeader ?? '', 10)
      const retryDelay = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : policy.backoffMs * attempt

      await sleep(retryDelay)
    } catch (error) {
      lastError = error

      if (attempt === policy.maxAttempts) {
        throw error
      }

      await sleep(policy.backoffMs * attempt)
    }
  }

  throw lastError ?? new Error(`Request to ${serviceName} failed unexpectedly.`)
}

function encodeLuceneTerm(value) {
  return `"${value.replace(/([+\-!(){}\[\]^"~*?:\\/]|&&|\|\|)/g, '\\$1')}"`
}

function parseNumericString(value) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function scoreExactOrNearMatch(input, canonical) {
  const normalizedInput = normalizeForComparison(input)
  const normalizedCanonical = normalizeForComparison(canonical)

  if (!normalizedInput || !normalizedCanonical) {
    return 0
  }

  if (normalizedInput === normalizedCanonical) {
    return 4
  }

  if (
    normalizedCanonical.includes(normalizedInput) ||
    normalizedInput.includes(normalizedCanonical)
  ) {
    return 2
  }

  return 0
}

export function normalizeForComparison(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

export function slugifySongId(songTitle) {
  return normalizeForComparison(songTitle).replace(/\s+/g, '-')
}

export function parseAliases(value) {
  if (!value) {
    return []
  }

  return Array.from(
    new Set(
      String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  )
}

export function parseBulkSongLine(line) {
  const trimmed = line.trim()

  if (!trimmed || trimmed.startsWith('#')) {
    return null
  }

  return trimmed
}

function normalizeTrackName(value) {
  return normalizeForComparison(value)
}

function isPreviewUrl(value) {
  return typeof value === 'string' && value.startsWith('https://audio-ssl.itunes.apple.com/')
}

function normalizeItunesResult(result) {
  if (!result || typeof result !== 'object') {
    return null
  }

  const artistName = typeof result.artistName === 'string' ? result.artistName.trim() : ''
  const trackName = typeof result.trackName === 'string' ? result.trackName.trim() : ''
  const collectionName =
    typeof result.collectionName === 'string' ? result.collectionName.trim() : null
  const previewUrl = typeof result.previewUrl === 'string' ? result.previewUrl : null
  const artworkUrl =
    typeof result.artworkUrl600 === 'string'
      ? result.artworkUrl600.replace(/^http:\/\//i, 'https://')
      : typeof result.artworkUrl100 === 'string'
        ? result.artworkUrl100.replace(/^http:\/\//i, 'https://')
        : null

  if (!artistName || !trackName) {
    return null
  }

  return {
    artistName,
    trackName,
    collectionName,
    previewUrl,
    artworkUrl,
    raw: result,
  }
}

function buildMatchScore(candidate, artistName, songTitle) {
  const normalizedArtist = normalizeForComparison(artistName)
  const normalizedSongTitle = normalizeTrackName(songTitle)
  const candidateArtist = normalizeForComparison(candidate.artistName)
  const candidateTrack = normalizeTrackName(candidate.trackName)
  const exactArtist = candidateArtist === normalizedArtist
  const exactTrack = candidateTrack === normalizedSongTitle
  const nearArtist =
    exactArtist ||
    candidateArtist.includes(normalizedArtist) ||
    normalizedArtist.includes(candidateArtist)
  const nearTrack =
    exactTrack ||
    candidateTrack.includes(normalizedSongTitle) ||
    normalizedSongTitle.includes(candidateTrack)

  let score = 0

  if (exactArtist) {
    score += 5
  } else if (nearArtist) {
    score += 3
  }

  if (exactTrack) {
    score += 5
  } else if (nearTrack) {
    score += 3
  }

  if (isPreviewUrl(candidate.previewUrl)) {
    score += 1
  }

  return {
    candidate,
    score,
    exactArtist,
    exactTrack,
    nearArtist,
    nearTrack,
  }
}

export function chooseBestItunesMatch(results, artistName, songTitle) {
  const candidates = results
    .map((result) => normalizeItunesResult(result))
    .filter(Boolean)
    .map((candidate) => buildMatchScore(candidate, artistName, songTitle))
    .filter((candidate) => candidate.nearArtist || candidate.nearTrack)

  if (!candidates.length) {
    return {
      status: 'unavailable',
      reason: 'No near artist or track match found in iTunes results.',
      match: null,
    }
  }

  candidates.sort((left, right) => right.score - left.score)
  const best = candidates[0]
  const tiedCandidates = candidates.filter((candidate) => candidate.score === best.score)
  const distinctIdentities = new Set(
    tiedCandidates.map(
      (candidate) =>
        `${normalizeTrackName(candidate.candidate.trackName)}::${normalizeForComparison(candidate.candidate.artistName)}`,
    ),
  )

  if (distinctIdentities.size > 1) {
    return {
      status: 'ambiguous',
      reason: 'Multiple iTunes matches scored equally well.',
      match: null,
      candidates: tiedCandidates.map((candidate) => candidate.candidate),
    }
  }

  if (!isPreviewUrl(best.candidate.previewUrl)) {
    return {
      status: 'unavailable',
      reason: 'Best iTunes match has no preview URL.',
      match: null,
    }
  }

  return {
    status: 'available',
    reason: null,
    match: best.candidate,
  }
}

export async function fetchItunesLookup(songTitle, artistName, fetchImpl = fetch) {
  const term = encodeURIComponent(`${songTitle} ${artistName}`)
  const url =
    `https://itunes.apple.com/search?term=${term}` +
    '&country=us&media=music&entity=song&limit=5'

  const response = await fetchWithPolicy('itunes', url, {
    headers: getDefaultHeaders({
      Accept: 'application/json',
    }),
  }, fetchImpl)

  if (!response.ok) {
    throw new Error(`iTunes lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  const results =
    payload && typeof payload === 'object' && Array.isArray(payload.results) ? payload.results : []

  return chooseBestItunesMatch(results, artistName, songTitle)
}

function extractLastFmArtistName(trackArtist) {
  if (typeof trackArtist === 'string') {
    return trackArtist
  }

  if (trackArtist && typeof trackArtist === 'object') {
    if (typeof trackArtist.name === 'string') {
      return trackArtist.name
    }

    if (typeof trackArtist['#text'] === 'string') {
      return trackArtist['#text']
    }
  }

  return ''
}

export async function fetchLastFmTrackInfo(
  artistName,
  songTitle,
  apiKey,
  fetchImpl = fetch,
) {
  if (!apiKey) {
    throw new Error('LASTFM_API_KEY is required for artist catalog resolution.')
  }

  const params = new URLSearchParams({
    method: 'track.getInfo',
    api_key: apiKey,
    artist: artistName,
    track: songTitle,
    autocorrect: '1',
    format: 'json',
  })

  const response = await fetchWithPolicy(
    'lastfm',
    `https://ws.audioscrobbler.com/2.0/?${params.toString()}`,
    {
      headers: getDefaultHeaders({
        Accept: 'application/json',
      }),
    },
    fetchImpl,
  )

  if (!response.ok) {
    throw new Error(`Last.fm track lookup failed with status ${response.status}`)
  }

  const payload = await response.json()

  if (payload?.error || !payload?.track) {
    return null
  }

  const track = payload.track
  const canonicalArtist = extractLastFmArtistName(track.artist).trim()
  const canonicalSongTitle = typeof track.name === 'string' ? track.name.trim() : ''

  if (!canonicalArtist || !canonicalSongTitle) {
    return null
  }

  return {
    canonicalArtist,
    canonicalSongTitle,
    listeners: parseNumericString(track.listeners),
    playcount: parseNumericString(track.playcount),
  }
}

export async function fetchLastFmArtistInfo(artistName, apiKey, fetchImpl = fetch) {
  if (!apiKey) {
    throw new Error('LASTFM_API_KEY is required for artist catalog resolution.')
  }

  const params = new URLSearchParams({
    method: 'artist.getInfo',
    api_key: apiKey,
    artist: artistName,
    autocorrect: '1',
    format: 'json',
  })

  const response = await fetchWithPolicy(
    'lastfm',
    `https://ws.audioscrobbler.com/2.0/?${params.toString()}`,
    {
      headers: getDefaultHeaders({
        Accept: 'application/json',
      }),
    },
    fetchImpl,
  )

  if (!response.ok) {
    throw new Error(`Last.fm artist lookup failed with status ${response.status}`)
  }

  const payload = await response.json()

  if (payload?.error || !payload?.artist) {
    return null
  }

  const artist = payload.artist
  const canonicalArtist = typeof artist.name === 'string' ? artist.name.trim() : ''

  if (!canonicalArtist) {
    return null
  }

  return {
    canonicalArtist,
    listeners: parseNumericString(artist.stats?.listeners),
  }
}

function normalizeMusicBrainzRecording(recording) {
  if (!recording || typeof recording !== 'object') {
    return null
  }

  const title = typeof recording.title === 'string' ? recording.title.trim() : ''
  const firstReleaseDate =
    typeof recording['first-release-date'] === 'string'
      ? recording['first-release-date']
      : null
  const artistCredit = Array.isArray(recording['artist-credit']) ? recording['artist-credit'] : []
  const primaryArtistCredit = artistCredit.find(
    (credit) => credit && typeof credit === 'object' && credit.artist && typeof credit.artist === 'object',
  )
  const artist = primaryArtistCredit?.artist
  const artistName = typeof artist?.name === 'string' ? artist.name.trim() : ''
  const artistId = typeof artist?.id === 'string' ? artist.id : null

  if (!title || !artistName || !artistId) {
    return null
  }

  return {
    title,
    artistName,
    artistId,
    firstReleaseDate,
  }
}

export function chooseBestMusicBrainzRecording(recordings, artistName, songTitle) {
  const candidates = recordings
    .map((recording) => normalizeMusicBrainzRecording(recording))
    .filter(Boolean)
    .map((recording) => ({
      recording,
      score:
        scoreExactOrNearMatch(artistName, recording.artistName) +
        scoreExactOrNearMatch(songTitle, recording.title),
    }))
    .filter((candidate) => candidate.score > 0)

  if (!candidates.length) {
    return null
  }

  candidates.sort((left, right) => right.score - left.score)
  return candidates[0].recording
}

export async function fetchMusicBrainzRecording(
  artistName,
  songTitle,
  fetchImpl = fetch,
) {
  const query = `recording:${encodeLuceneTerm(songTitle)} AND artist:${encodeLuceneTerm(artistName)}`
  const params = new URLSearchParams({
    query,
    fmt: 'json',
    limit: '5',
  })

  const response = await fetchWithPolicy(
    'musicbrainz',
    `https://musicbrainz.org/ws/2/recording/?${params.toString()}`,
    {
      headers: getDefaultHeaders({
        Accept: 'application/json',
      }),
    },
    fetchImpl,
  )

  if (!response.ok) {
    throw new Error(`MusicBrainz recording lookup failed with status ${response.status}`)
  }

  const payload = await response.json()
  const recordings = Array.isArray(payload?.recordings) ? payload.recordings : []
  return chooseBestMusicBrainzRecording(recordings, artistName, songTitle)
}

export async function fetchMusicBrainzArtist(artistId, fetchImpl = fetch) {
  const params = new URLSearchParams({
    fmt: 'json',
  })

  const response = await fetchWithPolicy(
    'musicbrainz',
    `https://musicbrainz.org/ws/2/artist/${artistId}?${params.toString()}`,
    {
      headers: getDefaultHeaders({
        Accept: 'application/json',
      }),
    },
    fetchImpl,
  )

  if (!response.ok) {
    throw new Error(`MusicBrainz artist lookup failed with status ${response.status}`)
  }

  const payload = await response.json()

  return {
    countryCode: typeof payload?.country === 'string' ? payload.country.toUpperCase() : null,
    areaName: typeof payload?.area?.name === 'string' ? payload.area.name : null,
  }
}

export function buildQueryCandidates(query) {
  const trimmed = query.trim()

  if (!trimmed) {
    throw new Error('A song query is required.')
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean)

  if (tokens.length < 2) {
    throw new Error('A song query must include at least an artist and a song fragment.')
  }

  const candidates = []
  const seen = new Set()

  for (let splitIndex = tokens.length - 1; splitIndex >= 1; splitIndex -= 1) {
    const artistName = tokens.slice(0, splitIndex).join(' ')
    const songTitle = tokens.slice(splitIndex).join(' ')
    const key = `artist-first:${normalizeForComparison(artistName)}::${normalizeForComparison(songTitle)}`

    if (!seen.has(key)) {
      seen.add(key)
      candidates.push({
        artistName,
        songTitle,
        orientation: 'artist-first',
      })
    }
  }

  for (let splitIndex = 1; splitIndex < tokens.length; splitIndex += 1) {
    const songTitle = tokens.slice(0, splitIndex).join(' ')
    const artistName = tokens.slice(splitIndex).join(' ')
    const key = `song-first:${normalizeForComparison(artistName)}::${normalizeForComparison(songTitle)}`

    if (!seen.has(key)) {
      seen.add(key)
      candidates.push({
        artistName,
        songTitle,
        orientation: 'song-first',
      })
    }
  }

  return candidates
}

export function deriveEraFromYear(year) {
  const numericYear = Number.parseInt(String(year ?? '').slice(0, 4), 10)

  if (!Number.isFinite(numericYear) || numericYear < 1900) {
    return null
  }

  const decade = Math.floor(numericYear / 10) * 10
  return `${decade}s`
}

export function deriveRegionFromMusicBrainzArtist(artistMetadata) {
  const countryCode = artistMetadata?.countryCode?.toUpperCase?.()
  const areaName = artistMetadata?.areaName ? normalizeForComparison(artistMetadata.areaName) : null
  const worldRegion =
    (countryCode ? countryRegionByCode.get(countryCode) : null) ??
    (areaName ? countryRegionByName.get(areaName) : null)

  if (!worldRegion) {
    return null
  }

  switch (worldRegion) {
    case 'Europe':
    case 'Africa':
    case 'Asia':
    case 'Oceania':
      return worldRegion
    case 'Americas':
      return 'Americas'
    default:
      return null
  }
}

export function derivePopularityTier({ trackListeners, trackPlaycount, artistListeners }) {
  if (trackListeners !== null || trackPlaycount !== null) {
    if ((trackListeners ?? 0) >= 500000 || (trackPlaycount ?? 0) >= 5000000) {
      return 'popular'
    }

    if ((trackListeners ?? 0) >= 100000 || (trackPlaycount ?? 0) >= 1000000) {
      return 'global'
    }

    return 'obscure'
  }

  if (artistListeners !== null) {
    if (artistListeners >= 2000000) {
      return 'popular'
    }

    if (artistListeners >= 300000) {
      return 'global'
    }

    return 'obscure'
  }

  return null
}

export function buildAliases(canonicalArtistName, originalArtistFragment) {
  const aliases = [canonicalArtistName]
  const normalizedCanonical = normalizeForComparison(canonicalArtistName)
  const normalizedOriginal = normalizeForComparison(originalArtistFragment)

  if (
    normalizedOriginal &&
    normalizedOriginal !== normalizedCanonical &&
    (normalizedCanonical.includes(normalizedOriginal) ||
      normalizedOriginal.includes(normalizedCanonical))
  ) {
    aliases.push(originalArtistFragment)
  }

  return Array.from(new Set(aliases))
}

export function validateResolvedSongSeed(seed) {
  const missingFields = ['songTitle', 'artistName', 'era', 'region', 'popularityTier'].filter(
    (key) => !seed[key]?.trim(),
  )

  if (missingFields.length) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }

  if (!['popular', 'global', 'obscure'].includes(seed.popularityTier)) {
    throw new Error('popularityTier must be one of: popular, global, obscure')
  }
}

export function scoreResolvedCandidate(candidate) {
  let score = 0

  score += scoreExactOrNearMatch(candidate.input.artistName, candidate.lastFmTrack.canonicalArtist)
  score += scoreExactOrNearMatch(candidate.input.songTitle, candidate.lastFmTrack.canonicalSongTitle)

  if (candidate.input.orientation === 'artist-first') {
    score += 1
  }

  if (candidate.musicBrainzRecording) {
    score += 2
  }

  if (candidate.iTunesLookup.status === 'available') {
    score += 3
  }

  if (candidate.region) {
    score += 1
  }

  if (candidate.era) {
    score += 1
  }

  if (candidate.popularityTier) {
    score += 1
  }

  return score
}

function canonicalIdentity(candidate) {
  return `${normalizeForComparison(candidate.lastFmTrack.canonicalArtist)}::${normalizeForComparison(candidate.lastFmTrack.canonicalSongTitle)}`
}

export function chooseResolvedCandidate(candidates) {
  const validCandidates = candidates.filter((candidate) => candidate && !candidate.error)

  if (!validCandidates.length) {
    return {
      status: 'unavailable',
      reason: 'No candidate query could be resolved through Last.fm.',
      candidate: null,
      candidates: [],
    }
  }

  const scoredCandidates = validCandidates
    .map((candidate) => ({
      ...candidate,
      score: scoreResolvedCandidate(candidate),
    }))
    .sort((left, right) => right.score - left.score)

  const bestCandidate = scoredCandidates[0]
  const runnerUp = scoredCandidates[1] ?? null

  if (bestCandidate.score < 10) {
    return {
      status: 'ambiguous',
      reason: 'No candidate query resolved with high enough confidence.',
      candidate: null,
      candidates: scoredCandidates.slice(0, 3),
    }
  }

  if (
    runnerUp &&
    bestCandidate.score - runnerUp.score < 2 &&
    canonicalIdentity(bestCandidate) !== canonicalIdentity(runnerUp)
  ) {
    return {
      status: 'ambiguous',
      reason: 'Multiple candidate splits resolved with similar confidence.',
      candidate: null,
      candidates: scoredCandidates.slice(0, 3),
    }
  }

  return {
    status: 'resolved',
    reason: null,
    candidate: bestCandidate,
    candidates: scoredCandidates,
  }
}

export async function resolveSongQuery(
  query,
  {
    lastFmApiKey,
    fetchLastFmTrackInfoImpl = fetchLastFmTrackInfo,
    fetchLastFmArtistInfoImpl = fetchLastFmArtistInfo,
    fetchMusicBrainzRecordingImpl = fetchMusicBrainzRecording,
    fetchMusicBrainzArtistImpl = fetchMusicBrainzArtist,
    fetchItunesLookupImpl = fetchItunesLookup,
  } = {},
) {
  const queryCandidates = buildQueryCandidates(query)
  const resolvedCandidates = []

  for (const candidate of queryCandidates) {
    try {
      const lastFmTrack = await fetchLastFmTrackInfoImpl(
        candidate.artistName,
        candidate.songTitle,
        lastFmApiKey,
      )

      if (!lastFmTrack) {
        continue
      }

      const musicBrainzRecording = await fetchMusicBrainzRecordingImpl(
        lastFmTrack.canonicalArtist,
        lastFmTrack.canonicalSongTitle,
      )
      const musicBrainzArtist = musicBrainzRecording
        ? await fetchMusicBrainzArtistImpl(musicBrainzRecording.artistId)
        : null
      const lastFmArtist = await fetchLastFmArtistInfoImpl(
        lastFmTrack.canonicalArtist,
        lastFmApiKey,
      )
      const iTunesLookup = await fetchItunesLookupImpl(
        lastFmTrack.canonicalSongTitle,
        lastFmTrack.canonicalArtist,
      )
      const era = deriveEraFromYear(musicBrainzRecording?.firstReleaseDate)
      const region = deriveRegionFromMusicBrainzArtist(musicBrainzArtist)
      const popularityTier = derivePopularityTier({
        trackListeners: lastFmTrack.listeners,
        trackPlaycount: lastFmTrack.playcount,
        artistListeners: lastFmArtist?.listeners ?? null,
      })

      resolvedCandidates.push({
        input: candidate,
        lastFmTrack,
        lastFmArtist,
        musicBrainzRecording,
        musicBrainzArtist,
        iTunesLookup,
        era,
        region,
        popularityTier,
      })
    } catch (error) {
      resolvedCandidates.push({
        input: candidate,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return chooseResolvedCandidate(resolvedCandidates)
}

export function buildSongSeedFromResolvedCandidate(candidate) {
  if (candidate.iTunesLookup.status !== 'available') {
    throw new Error('Resolved song does not have an available iTunes preview.')
  }

  if (!candidate.region) {
    throw new Error('Could not derive artist region from MusicBrainz metadata.')
  }

  if (!candidate.era) {
    throw new Error('Could not derive song era from MusicBrainz metadata.')
  }

  if (!candidate.popularityTier) {
    throw new Error('Could not derive popularity tier from Last.fm metadata.')
  }

  const seed = {
    id: slugifySongId(candidate.lastFmTrack.canonicalSongTitle),
    songTitle: candidate.lastFmTrack.canonicalSongTitle,
    artistName: candidate.lastFmTrack.canonicalArtist,
    aliases: buildAliases(
      candidate.lastFmTrack.canonicalArtist,
      candidate.input.artistName,
    ),
    era: candidate.era,
    region: candidate.region,
    popularityTier: candidate.popularityTier,
  }

  validateResolvedSongSeed(seed)
  return seed
}

export function buildSongSeedFromBulkResolvedEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Bulk report entry is missing resolved song data.')
  }

  const songTitle =
    typeof entry.songTitle === 'string' ? entry.songTitle.trim() : ''
  const artistName =
    typeof entry.artistName === 'string' ? entry.artistName.trim() : ''
  const era = typeof entry.era === 'string' ? entry.era.trim() : ''
  const region = typeof entry.region === 'string' ? entry.region.trim() : ''
  const popularityTier =
    typeof entry.popularityTier === 'string' ? entry.popularityTier.trim() : ''

  if (entry.previewAvailable !== true) {
    throw new Error('Bulk report entry does not have a verified preview.')
  }

  const seed = {
    id: slugifySongId(songTitle),
    songTitle,
    artistName,
    aliases: [artistName],
    era,
    region,
    popularityTier,
  }

  validateResolvedSongSeed(seed)
  return seed
}

function readQuotedValue(line, key) {
  const keyIndex = line.indexOf(`${key}: `)

  if (keyIndex === -1) {
    throw new Error(`Missing ${key} in catalog entry.`)
  }

  const valueStart = keyIndex + key.length + 2
  const quote = line[valueStart]

  if (quote !== "'" && quote !== '"') {
    throw new Error(`Unsupported ${key} quote style.`)
  }

  let cursor = valueStart + 1
  let value = ''

  while (cursor < line.length) {
    const character = line[cursor]

    if (character === '\\') {
      value += line[cursor + 1] ?? ''
      cursor += 2
      continue
    }

    if (character === quote) {
      return value
    }

    value += character
    cursor += 1
  }

  throw new Error(`Unterminated ${key} value.`)
}

export function parseCatalogEntries(source) {
  const startIndex = source.indexOf(catalogStartMarker)
  const endIndex = source.indexOf(catalogEndMarker)

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Could not locate song catalog boundaries.')
  }

  const entriesBlock = source.slice(startIndex + catalogStartMarker.length, endIndex)

  return entriesBlock
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('{ id: '))
    .map((line) => ({
      id: readQuotedValue(line, 'id'),
      songTitle: readQuotedValue(line, 'songTitle'),
      artistName: readQuotedValue(line, 'artistName'),
    }))
}

export function detectCatalogDuplicate(entries, candidateId, songTitle, artistName) {
  const normalizedSongTitle = normalizeForComparison(songTitle)
  const normalizedArtistName = normalizeForComparison(artistName)

  const duplicateId = entries.find((entry) => entry.id === candidateId)

  if (duplicateId) {
    return {
      type: 'id',
      entry: duplicateId,
    }
  }

  const duplicateSong = entries.find(
    (entry) =>
      normalizeForComparison(entry.songTitle) === normalizedSongTitle &&
      normalizeForComparison(entry.artistName) === normalizedArtistName,
  )

  if (duplicateSong) {
    return {
      type: 'song',
      entry: duplicateSong,
    }
  }

  return null
}

function formatJsString(value) {
  const escaped = value.replace(/\\/g, '\\\\')

  if (!escaped.includes("'")) {
    return `'${escaped}'`
  }

  if (!escaped.includes('"')) {
    return `"${escaped}"`
  }

  return `'${escaped.replace(/'/g, "\\'")}'`
}

export function formatSongSeedEntry(seed) {
  return (
    `  { id: ${formatJsString(seed.id)}, ` +
    `songTitle: ${formatJsString(seed.songTitle)}, ` +
    `artistName: ${formatJsString(seed.artistName)}, ` +
    `aliases: [${seed.aliases.map((alias) => formatJsString(alias)).join(', ')}], ` +
    `era: ${formatJsString(seed.era)}, ` +
    `region: ${formatJsString(seed.region)}, ` +
    `popularityTier: ${formatJsString(seed.popularityTier)} },`
  )
}

export function appendSongSeedEntry(source, seed) {
  const endIndex = source.indexOf(catalogEndMarker)

  if (endIndex === -1) {
    throw new Error('Could not locate catalog insertion point.')
  }

  return `${source.slice(0, endIndex)}${formatSongSeedEntry(seed)}\n${source.slice(endIndex)}`
}

export async function readSongsCatalog() {
  return fs.readFile(songsCatalogPath, 'utf8')
}

export async function writeSongsCatalog(source) {
  await fs.writeFile(songsCatalogPath, source, 'utf8')
}

function parseEnvFileContent(source) {
  const values = new Map()

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }

    const separatorIndex = trimmed.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    const value = trimmed.slice(separatorIndex + 1).trim()
    values.set(key, value)
  }

  return values
}

export async function readLocalEnvValue(key) {
  if (process.env[key]) {
    return process.env[key]
  }

  for (const filename of ['.env.local', '.env']) {
    const filePath = path.resolve(process.cwd(), filename)

    try {
      const source = await fs.readFile(filePath, 'utf8')
      const values = parseEnvFileContent(source)

      if (values.has(key)) {
        return values.get(key)
      }
    } catch {
      continue
    }
  }

  return null
}

export async function writeBulkReport(results, directoryRoot = path.resolve(process.cwd(), 'private')) {
  const directoryPath = path.join(directoryRoot, reportDirectoryName)
  await fs.mkdir(directoryPath, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const reportPath = path.join(directoryPath, `bulk-report-${timestamp}.json`)
  const body = {
    generatedAt: new Date().toISOString(),
    results,
  }

  await fs.writeFile(reportPath, `${JSON.stringify(body, null, 2)}\n`, 'utf8')
  return reportPath
}
