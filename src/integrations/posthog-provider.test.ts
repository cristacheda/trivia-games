import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPostHogAnalyticsProvider } from '@/integrations/posthog-provider'

function createClientStub() {
  return {
    capture: vi.fn(),
    init: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  }
}

describe('createPostHogAnalyticsProvider', () => {
  beforeEach(() => {
    document.title = 'Atlas of Answers'
    vi.restoreAllMocks()
  })

  it('does not initialize or send events without a token', () => {
    const client = createClientStub()
    const analytics = createPostHogAnalyticsProvider({
      client,
      token: '',
    })

    analytics.trackPageView('/games/flag-quiz')
    analytics.trackEvent('round_started', { game_id: 'flag-quiz' })

    expect(client.init).not.toHaveBeenCalled()
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('initializes posthog and captures pageviews manually', () => {
    const client = createClientStub()
    const analytics = createPostHogAnalyticsProvider({
      apiHost: 'https://us.i.posthog.com',
      canTrack: () => true,
      client,
      token: 'phc_test_token',
    })

    analytics.trackPageView('/games/flag-quiz')

    expect(client.init).toHaveBeenCalledWith('phc_test_token', {
      api_host: 'https://us.i.posthog.com',
      autocapture: false,
      capture_pageleave: false,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    })
    expect(client.opt_in_capturing).toHaveBeenCalledWith({
      captureEventName: false,
    })
    expect(client.capture).toHaveBeenCalledWith('$pageview', {
      $current_url: 'http://localhost:3000/',
      path: '/games/flag-quiz',
      title: 'Atlas of Answers',
    })
  })

  it('passes custom event payloads through unchanged', () => {
    const client = createClientStub()
    const analytics = createPostHogAnalyticsProvider({
      canTrack: () => true,
      client,
      token: 'phc_test_token',
    })

    analytics.trackEvent('round_completed', {
      answer_mode: 'multiple-choice',
      game_id: 'flag-quiz',
      resolution: 'timeout',
    })

    expect(client.capture).toHaveBeenLastCalledWith('round_completed', {
      answer_mode: 'multiple-choice',
      game_id: 'flag-quiz',
      resolution: 'timeout',
    })
  })

  it('does not initialize analytics before consent is granted', () => {
    const client = createClientStub()
    const analytics = createPostHogAnalyticsProvider({
      canTrack: () => false,
      client,
      token: 'phc_test_token',
    })

    analytics.trackPageView('/games/flag-quiz')
    analytics.trackEvent('round_started', { game_id: 'flag-quiz' })

    expect(client.init).not.toHaveBeenCalled()
    expect(client.capture).not.toHaveBeenCalled()
  })

  it('opts out after consent is revoked', () => {
    const client = createClientStub()
    let allowed = true
    const analytics = createPostHogAnalyticsProvider({
      canTrack: () => allowed,
      client,
      token: 'phc_test_token',
    })

    analytics.trackPageView('/games/flag-quiz')
    allowed = false
    analytics.trackPageView('/games/outline-quiz')

    expect(client.opt_out_capturing).toHaveBeenCalledTimes(1)
    expect(client.capture).toHaveBeenCalledTimes(1)
  })
})
