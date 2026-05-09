import posthog from 'posthog-js'
import type { AnalyticsProvider } from '@/integrations/contracts'

interface PostHogAnalyticsClient {
  capture: (eventName: string, properties?: Record<string, unknown>) => void
  init: (
    token: string,
    config?: Record<string, unknown>,
    name?: string,
  ) => unknown
  opt_in_capturing: (options?: {
    captureEventName?: string | null | false
    captureProperties?: Record<string, unknown>
  }) => void
  opt_out_capturing: () => void
}

interface PostHogAnalyticsProviderOptions {
  apiHost?: string
  canTrack?: () => boolean
  client?: PostHogAnalyticsClient
  token: string
}

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com'

export function createPostHogAnalyticsProvider({
  apiHost = DEFAULT_POSTHOG_HOST,
  canTrack = () => true,
  client = posthog,
  token,
}: PostHogAnalyticsProviderOptions): AnalyticsProvider {
  const trimmedApiHost = apiHost.trim() || DEFAULT_POSTHOG_HOST
  const trimmedToken = token.trim()
  let activeClientToken: string | null = null
  let activeClientHost: string | null = null
  let isPostHogInitialized = false
  let isPostHogOptedIn = false

  function initializePostHog() {
    if (
      isPostHogInitialized &&
      activeClientToken === trimmedToken &&
      activeClientHost === trimmedApiHost
    ) {
      return
    }

    client.init(trimmedToken, {
      api_host: trimmedApiHost,
      autocapture: false,
      capture_pageleave: false,
      capture_pageview: false,
      persistence: 'localStorage+cookie',
    })

    activeClientToken = trimmedToken
    activeClientHost = trimmedApiHost
    isPostHogInitialized = true
  }

  function syncConsentState(trackingAllowed: boolean) {
    if (!isPostHogInitialized) {
      return
    }

    if (trackingAllowed && !isPostHogOptedIn) {
      client.opt_in_capturing({ captureEventName: false })
      isPostHogOptedIn = true
      return
    }

    if (!trackingAllowed && isPostHogOptedIn) {
      client.opt_out_capturing()
      isPostHogOptedIn = false
    }
  }

  function ensureReady() {
    const trackingAllowed = canTrack()

    if (!trackingAllowed) {
      syncConsentState(false)
      return false
    }

    if (!trimmedToken) {
      return false
    }

    initializePostHog()
    syncConsentState(true)
    return true
  }

  return {
    trackPageView(path) {
      if (!ensureReady()) {
        return
      }

      client.capture('$pageview', {
        $current_url: window.location.href,
        path,
        title: document.title,
      })
    },
    trackEvent(name, payload = {}) {
      if (!ensureReady()) {
        return
      }

      client.capture(name, payload)
    },
  }
}
