import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn<typeof fetch>()

vi.stubGlobal('fetch', fetchMock)

describe('fetchSongPreviewMetadata', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns successful local API metadata', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          artworkUrl: 'https://is1-ssl.mzstatic.com/image.jpg',
          previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
          collectionName: 'Rumours',
          source: 'itunes',
        }),
      ),
    )

    const { fetchSongPreviewMetadata } = await import('./preview')
    const metadata = await fetchSongPreviewMetadata({
      songTitle: 'Go Your Own Way',
      artistName: 'Fleetwood Mac',
    })

    expect(metadata).toEqual({
      artworkUrl: 'https://is1-ssl.mzstatic.com/image.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a',
      collectionName: 'Rumours',
      source: 'itunes',
    })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining('/api/artist-preview?'),
      }),
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
        },
      }),
    )
  })

  it('returns unavailable metadata when the API marks it unavailable', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          artworkUrl: null,
          previewUrl: null,
          collectionName: null,
          source: 'unavailable',
        }),
      ),
    )

    const { fetchSongPreviewMetadata } = await import('./preview')
    const metadata = await fetchSongPreviewMetadata({
      songTitle: 'Believer',
      artistName: 'Imagine Dragons',
    })

    expect(metadata).toEqual({
      artworkUrl: null,
      previewUrl: null,
      collectionName: null,
      source: 'unavailable',
    })
  })

  it('throws an AbortError when aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    const { fetchSongPreviewMetadata } = await import('./preview')

    await expect(
      fetchSongPreviewMetadata({
        songTitle: 'Believer',
        artistName: 'Imagine Dragons',
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('falls back to unavailable metadata for malformed responses', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ nope: true })))

    const { fetchSongPreviewMetadata } = await import('./preview')
    const metadata = await fetchSongPreviewMetadata({
      songTitle: 'September',
      artistName: 'Earth, Wind & Fire',
    })

    expect(metadata).toEqual({
      artworkUrl: null,
      previewUrl: null,
      collectionName: null,
      source: 'unavailable',
    })
  })
})
