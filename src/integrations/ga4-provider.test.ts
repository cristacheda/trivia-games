import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createGa4AnalyticsProvider } from '@/integrations/ga4-provider'

describe('createGa4AnalyticsProvider', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.title = 'Atlas of Answers'
    window.localStorage.clear()
    window.dataLayer = []
    window.gtag = vi.fn()
    vi.restoreAllMocks()
  })

  it('does not initialize or send events without a measurement id', () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild')
    const analytics = createGa4AnalyticsProvider({ measurementId: '' })

    analytics.trackPageView('/games/flag-quiz')
    analytics.trackEvent('round_started', { game_id: 'flag-quiz' })

    expect(appendChildSpy).not.toHaveBeenCalled()
    expect(window.gtag).not.toHaveBeenCalled()
  })

  it('loads gtag and configures ga4 when enabled', () => {
    const analytics = createGa4AnalyticsProvider({
      canTrack: () => true,
      measurementId: 'G-XST9JEW1Y2',
    })

    analytics.trackPageView('/games/flag-quiz')

    const script = document.querySelector(
      'script[data-ga4-measurement-id="G-XST9JEW1Y2"]',
    )

    expect(script).not.toBeNull()
    expect(window.gtag).toHaveBeenNthCalledWith(1, 'js', expect.any(Date))
    expect(window.gtag).toHaveBeenNthCalledWith(2, 'config', 'G-XST9JEW1Y2', {
      send_page_view: false,
    })
    expect(window.gtag).toHaveBeenNthCalledWith(3, 'event', 'page_view', {
      page_location: 'http://localhost:3000/',
      page_path: '/games/flag-quiz',
      page_title: 'Atlas of Answers',
    })
  })

  it('passes custom event payloads through unchanged', () => {
    const analytics = createGa4AnalyticsProvider({
      canTrack: () => true,
      measurementId: 'G-XST9JEW1Y2',
    })

    analytics.trackEvent('round_completed', {
      answer_mode: 'multiple-choice',
      game_id: 'flag-quiz',
      is_correct: false,
      resolution: 'timeout',
    })

    expect(window.gtag).toHaveBeenLastCalledWith('event', 'round_completed', {
      answer_mode: 'multiple-choice',
      game_id: 'flag-quiz',
      is_correct: false,
      resolution: 'timeout',
    })
  })

  it('does not initialize analytics before consent is granted', () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild')
    const analytics = createGa4AnalyticsProvider({
      canTrack: () => false,
      measurementId: 'G-XST9JEW1Y2',
    })

    analytics.trackPageView('/games/flag-quiz')
    analytics.trackEvent('round_started', { game_id: 'flag-quiz' })

    expect(appendChildSpy).not.toHaveBeenCalled()
    expect(window.gtag).not.toHaveBeenCalled()
  })
})
