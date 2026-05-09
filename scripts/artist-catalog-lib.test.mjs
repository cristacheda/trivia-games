import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  appendSongSeedEntry,
  buildSongSeedFromBulkResolvedEntry,
  buildQueryCandidates,
  buildSongSeedFromResolvedCandidate,
  chooseBestItunesMatch,
  chooseResolvedCandidate,
  deriveEraFromYear,
  derivePopularityTier,
  deriveRegionFromMusicBrainzArtist,
  detectCatalogDuplicate,
  parseBulkSongLine,
  parseCatalogEntries,
  resolveSongQuery,
  shouldRetryHttpStatus,
  slugifySongId,
} from './artist-catalog-lib.mjs'

const songsCatalogPath = path.resolve(
  process.cwd(),
  'src/features/guess-the-artist/data/songs.ts',
)
const songsCatalogSource = fs.readFileSync(songsCatalogPath, 'utf8')

describe('artist catalog helpers', () => {
  it('slugifies song ids with ascii normalization', () => {
    expect(slugifySongId('Și cu asta basta')).toBe('si-cu-asta-basta')
    expect(slugifySongId("Ain't No Rest for the Wicked")).toBe('ain-t-no-rest-for-the-wicked')
  })

  it('parses bulk song lines as free-form queries', () => {
    expect(parseBulkSongLine('Imagine Dragons Believer')).toBe('Imagine Dragons Believer')
    expect(parseBulkSongLine('# comment')).toBeNull()
  })

  it('builds candidate splits from free-form query text', () => {
    expect(buildQueryCandidates('Imagine Dragons Believer')).toEqual([
      { artistName: 'Imagine Dragons', songTitle: 'Believer', orientation: 'artist-first' },
      { artistName: 'Imagine', songTitle: 'Dragons Believer', orientation: 'artist-first' },
      { artistName: 'Dragons Believer', songTitle: 'Imagine', orientation: 'song-first' },
      { artistName: 'Believer', songTitle: 'Imagine Dragons', orientation: 'song-first' },
    ])
  })

  it('detects duplicate ids and duplicate song artist pairs', () => {
    const entries = parseCatalogEntries(songsCatalogSource)

    expect(detectCatalogDuplicate(entries, 'believer', 'Believer', 'Imagine Dragons')).toEqual({
      type: 'id',
      entry: expect.objectContaining({ id: 'believer' }),
    })

    expect(
      detectCatalogDuplicate(entries, 'brand-new-id', 'Believer', 'Imagine Dragons'),
    ).toEqual({
      type: 'song',
      entry: expect.objectContaining({
        id: 'believer',
        songTitle: 'Believer',
        artistName: 'Imagine Dragons',
      }),
    })
  })

  it('formats appended catalog entries without mutating existing content', () => {
    const nextSource = appendSongSeedEntry(songsCatalogSource, {
      id: 'test-entry',
      songTitle: 'Test Song',
      artistName: 'Test Artist',
      aliases: ['Test Artist'],
      era: '2020s',
      region: 'Europe',
      popularityTier: 'global',
    })

    expect(nextSource).toContain(
      "  { id: 'test-entry', songTitle: 'Test Song', artistName: 'Test Artist', aliases: ['Test Artist'], era: '2020s', region: 'Europe', popularityTier: 'global' },",
    )
    expect(songsCatalogSource).not.toContain('test-entry')
  })

  it('prefers the exact artist and track match from iTunes results', () => {
    const result = chooseBestItunesMatch(
      [
        {
          artistName: 'Cover Band',
          trackName: 'Believer',
          previewUrl: 'https://audio-ssl.itunes.apple.com/cover.m4a',
        },
        {
          artistName: 'Imagine Dragons',
          trackName: 'Believer',
          collectionName: 'Evolve',
          previewUrl: 'https://audio-ssl.itunes.apple.com/believer.m4a',
          artworkUrl100: 'http://example.com/cover.jpg',
        },
      ],
      'Imagine Dragons',
      'Believer',
    )

    expect(result).toEqual({
      status: 'available',
      reason: null,
      match: expect.objectContaining({
        artistName: 'Imagine Dragons',
        trackName: 'Believer',
        previewUrl: 'https://audio-ssl.itunes.apple.com/believer.m4a',
        artworkUrl: 'https://example.com/cover.jpg',
      }),
    })
  })

  it('surfaces ambiguous iTunes matches', () => {
    const result = chooseBestItunesMatch(
      [
        {
          artistName: 'Phoenix',
          trackName: '1901',
          previewUrl: 'https://audio-ssl.itunes.apple.com/phoenix.m4a',
        },
        {
          artistName: 'Phoenix Orchestra',
          trackName: '1901',
          previewUrl: 'https://audio-ssl.itunes.apple.com/orchestra.m4a',
        },
      ],
      'Phoenix O',
      '1901',
    )

    expect(result.status).toBe('ambiguous')
    expect(result.reason).toBe('Multiple iTunes matches scored equally well.')
  })

  it('treats missing preview urls as unavailable', () => {
    const result = chooseBestItunesMatch(
      [
        {
          artistName: 'Imagine Dragons',
          trackName: 'Believer',
        },
      ],
      'Imagine Dragons',
      'Believer',
    )

    expect(result).toEqual({
      status: 'unavailable',
      reason: 'Best iTunes match has no preview URL.',
      match: null,
    })
  })

  it('retries only retryable upstream statuses', () => {
    expect(shouldRetryHttpStatus('musicbrainz', 503)).toBe(true)
    expect(shouldRetryHttpStatus('lastfm', 429)).toBe(true)
    expect(shouldRetryHttpStatus('itunes', 504)).toBe(true)
    expect(shouldRetryHttpStatus('musicbrainz', 404)).toBe(false)
  })

  it('derives era from release year', () => {
    expect(deriveEraFromYear('2017-02-01')).toBe('2010s')
    expect(deriveEraFromYear('1982')).toBe('1980s')
    expect(deriveEraFromYear(null)).toBeNull()
  })

  it('maps artist geography into app regions', () => {
    expect(deriveRegionFromMusicBrainzArtist({ countryCode: 'GB', areaName: 'United Kingdom' })).toBe(
      'Europe',
    )
    expect(deriveRegionFromMusicBrainzArtist({ countryCode: 'AU', areaName: 'Australia' })).toBe(
      'Oceania',
    )
    expect(deriveRegionFromMusicBrainzArtist({ countryCode: null, areaName: 'Atlantis' })).toBeNull()
  })

  it('derives popularity tiers from track stats and artist fallback', () => {
    expect(
      derivePopularityTier({
        trackListeners: 600000,
        trackPlaycount: 50000,
        artistListeners: null,
      }),
    ).toBe('popular')

    expect(
      derivePopularityTier({
        trackListeners: null,
        trackPlaycount: null,
        artistListeners: 400000,
      }),
    ).toBe('global')

    expect(
      derivePopularityTier({
        trackListeners: null,
        trackPlaycount: null,
        artistListeners: null,
      }),
    ).toBeNull()
  })

  it('chooses the highest-confidence resolved candidate', () => {
    const result = chooseResolvedCandidate([
      {
        input: { artistName: 'Imagine Dragons', songTitle: 'Believer', orientation: 'artist-first' },
        lastFmTrack: {
          canonicalArtist: 'Imagine Dragons',
          canonicalSongTitle: 'Believer',
          listeners: 1,
          playcount: 1,
        },
        lastFmArtist: { canonicalArtist: 'Imagine Dragons', listeners: 1 },
        musicBrainzRecording: { title: 'Believer', artistName: 'Imagine Dragons' },
        musicBrainzArtist: { countryCode: 'US', areaName: 'United States' },
        iTunesLookup: {
          status: 'available',
          match: {
            artistName: 'Imagine Dragons',
            trackName: 'Believer',
            previewUrl: 'https://audio-ssl.itunes.apple.com/believer.m4a',
          },
        },
        era: '2010s',
        region: 'Americas',
        popularityTier: 'popular',
      },
      {
        input: { artistName: 'Imagine', songTitle: 'Dragons Believer', orientation: 'artist-first' },
        lastFmTrack: {
          canonicalArtist: 'Imagine',
          canonicalSongTitle: 'Dragons Believer',
          listeners: 1,
          playcount: 1,
        },
        lastFmArtist: { canonicalArtist: 'Imagine', listeners: 1 },
        musicBrainzRecording: null,
        musicBrainzArtist: null,
        iTunesLookup: { status: 'unavailable', match: null },
        era: null,
        region: null,
        popularityTier: null,
      },
    ])

    expect(result.status).toBe('resolved')
    expect(result.candidate.lastFmTrack.canonicalArtist).toBe('Imagine Dragons')
  })

  it('surfaces ambiguous resolved candidates when scores are too close', () => {
    const result = chooseResolvedCandidate([
      {
        input: { artistName: 'Phoenix', songTitle: '1901', orientation: 'artist-first' },
        lastFmTrack: {
          canonicalArtist: 'Phoenix',
          canonicalSongTitle: '1901',
          listeners: 100000,
          playcount: 1000000,
        },
        lastFmArtist: { canonicalArtist: 'Phoenix', listeners: 100000 },
        musicBrainzRecording: { title: '1901', artistName: 'Phoenix' },
        musicBrainzArtist: { countryCode: 'FR', areaName: 'France' },
        iTunesLookup: {
          status: 'available',
          match: {
            artistName: 'Phoenix',
            trackName: '1901',
            previewUrl: 'https://audio-ssl.itunes.apple.com/a.m4a',
          },
        },
        era: '2000s',
        region: 'Europe',
        popularityTier: 'global',
      },
      {
        input: { artistName: 'Phoenix Orchestra', songTitle: '1901', orientation: 'artist-first' },
        lastFmTrack: {
          canonicalArtist: 'Phoenix Orchestra',
          canonicalSongTitle: '1901',
          listeners: 100000,
          playcount: 1000000,
        },
        lastFmArtist: { canonicalArtist: 'Phoenix Orchestra', listeners: 100000 },
        musicBrainzRecording: { title: '1901', artistName: 'Phoenix Orchestra' },
        musicBrainzArtist: { countryCode: 'FR', areaName: 'France' },
        iTunesLookup: {
          status: 'available',
          match: {
            artistName: 'Phoenix Orchestra',
            trackName: '1901',
            previewUrl: 'https://audio-ssl.itunes.apple.com/b.m4a',
          },
        },
        era: '2000s',
        region: 'Europe',
        popularityTier: 'global',
      },
    ])

    expect(result.status).toBe('ambiguous')
  })

  it('builds a song seed from a resolved candidate', () => {
    const seed = buildSongSeedFromResolvedCandidate({
      input: {
        artistName: 'Imagine Dragons',
        songTitle: 'Believer',
        orientation: 'artist-first',
      },
      lastFmTrack: {
        canonicalArtist: 'Imagine Dragons',
        canonicalSongTitle: 'Believer',
      },
      iTunesLookup: {
        status: 'available',
        match: {
          artistName: 'Imagine Dragons',
          trackName: 'Believer',
          previewUrl: 'https://audio-ssl.itunes.apple.com/believer.m4a',
        },
      },
      era: '2010s',
      region: 'Americas',
      popularityTier: 'popular',
    })

    expect(seed).toEqual({
      id: 'believer',
      songTitle: 'Believer',
      artistName: 'Imagine Dragons',
      aliases: ['Imagine Dragons'],
      era: '2010s',
      region: 'Americas',
      popularityTier: 'popular',
    })
  })

  it('builds a song seed from a resolved bulk report entry', () => {
    const seed = buildSongSeedFromBulkResolvedEntry({
      songTitle: 'Bad Romance',
      artistName: 'Lady Gaga',
      era: '2000s',
      region: 'Americas',
      popularityTier: 'popular',
      previewAvailable: true,
    })

    expect(seed).toEqual({
      id: 'bad-romance',
      songTitle: 'Bad Romance',
      artistName: 'Lady Gaga',
      aliases: ['Lady Gaga'],
      era: '2000s',
      region: 'Americas',
      popularityTier: 'popular',
    })
  })

  it('rejects unresolved bulk report entries without verified preview', () => {
    expect(() =>
      buildSongSeedFromBulkResolvedEntry({
        songTitle: 'Bad Romance',
        artistName: 'Lady Gaga',
        era: '2000s',
        region: 'Americas',
        popularityTier: 'popular',
        previewAvailable: false,
      }),
    ).toThrow('Bulk report entry does not have a verified preview.')
  })

  it('resolves a query through mocked external services', async () => {
    const result = await resolveSongQuery('Imagine Dragons Believer', {
      lastFmApiKey: 'test-key',
      fetchLastFmTrackInfoImpl: async (artistName, songTitle) =>
        artistName === 'Imagine Dragons' && songTitle === 'Believer'
          ? {
              canonicalArtist: 'Imagine Dragons',
              canonicalSongTitle: 'Believer',
              listeners: 650000,
              playcount: 7000000,
            }
          : null,
      fetchLastFmArtistInfoImpl: async () => ({
        canonicalArtist: 'Imagine Dragons',
        listeners: 2500000,
      }),
      fetchMusicBrainzRecordingImpl: async () => ({
        title: 'Believer',
        artistName: 'Imagine Dragons',
        artistId: 'artist-1',
        firstReleaseDate: '2017-02-01',
      }),
      fetchMusicBrainzArtistImpl: async () => ({
        countryCode: 'US',
        areaName: 'United States',
      }),
      fetchItunesLookupImpl: async () => ({
        status: 'available',
        reason: null,
        match: {
          artistName: 'Imagine Dragons',
          trackName: 'Believer',
          previewUrl: 'https://audio-ssl.itunes.apple.com/believer.m4a',
          artworkUrl: 'https://example.com/cover.jpg',
          collectionName: 'Evolve',
        },
      }),
    })

    expect(result.status).toBe('resolved')
    expect(result.candidate.lastFmTrack.canonicalSongTitle).toBe('Believer')
    expect(result.candidate.region).toBe('Americas')
    expect(result.candidate.popularityTier).toBe('popular')
  })
})
