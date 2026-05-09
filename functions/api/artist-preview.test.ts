import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onRequestGet } from './artist-preview'

const fetchMock = vi.fn<typeof fetch>()
const matchMock = vi.fn()
const putMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)
vi.stubGlobal('caches', {
  default: {
    match: matchMock,
    put: putMock,
  },
})

describe('artist preview function', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    matchMock.mockReset()
    putMock.mockReset()
    matchMock.mockResolvedValue(undefined)
    putMock.mockResolvedValue(undefined)
  })

  it('returns normalized metadata for a valid request', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              artistName: 'Queen',
              artworkUrl100: 'http://example.com/cover-100.jpg',
              collectionName: 'A Night at the Opera',
              previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
            },
          ],
        }),
      ),
    )

    const response = await onRequestGet({
      request: new Request(
        'https://triviagames.cristache.net/api/artist-preview?songTitle=Bohemian%20Rhapsody&artistName=Queen',
      ),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      artworkUrl: 'https://example.com/cover-100.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
      collectionName: 'A Night at the Opera',
      source: 'itunes',
    })
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400')
  })

  it('returns 400 for missing params', async () => {
    const response = await onRequestGet({
      request: new Request('https://triviagames.cristache.net/api/artist-preview?songTitle='),
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'songTitle and artistName are required.',
    })
  })

  it('returns unavailable metadata on upstream failure', async () => {
    fetchMock.mockRejectedValue(new Error('upstream failed'))

    const response = await onRequestGet({
      request: new Request(
        'https://triviagames.cristache.net/api/artist-preview?songTitle=Believer&artistName=Imagine%20Dragons',
      ),
    })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      artworkUrl: null,
      previewUrl: null,
      collectionName: null,
      source: 'unavailable',
    })
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600')
  })

  it('prefers an artist match over the first unrelated result', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            {
              artistName: 'Covers Artist',
              artworkUrl100: 'http://example.com/wrong.jpg',
              collectionName: 'Wrong Album',
              previewUrl: 'https://audio-ssl.itunes.apple.com/wrong.m4a',
            },
            {
              artistName: 'Fleetwood Mac',
              artworkUrl600: 'http://example.com/right.jpg',
              collectionName: 'Rumours',
              previewUrl: 'https://audio-ssl.itunes.apple.com/right.m4a',
            },
          ],
        }),
      ),
    )

    const response = await onRequestGet({
      request: new Request(
        'https://triviagames.cristache.net/api/artist-preview?songTitle=Go%20Your%20Own%20Way&artistName=Fleetwood%20Mac',
      ),
    })

    await expect(response.json()).resolves.toEqual({
      artworkUrl: 'https://example.com/right.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/right.m4a',
      collectionName: 'Rumours',
      source: 'itunes',
    })
  })
})
