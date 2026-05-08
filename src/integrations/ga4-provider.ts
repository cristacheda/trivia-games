import type { AnalyticsProvider } from '@/integrations/contracts'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

interface Ga4AnalyticsProviderOptions {
  measurementId: string
  canTrack?: () => boolean
}

let activeMeasurementId: string | null = null
let isGa4Initialized = false

function initializeGa4(measurementId: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  if (activeMeasurementId === measurementId && isGa4Initialized && window.gtag) {
    return
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-ga4-measurement-id="${measurementId}"]`,
  )

  if (!existingScript) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.dataset.ga4MeasurementId = measurementId
    document.head.appendChild(script)
  }

  window.dataLayer = window.dataLayer || []
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }

  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    send_page_view: false,
  })

  activeMeasurementId = measurementId
  isGa4Initialized = true
}

export function createGa4AnalyticsProvider({
  measurementId,
  canTrack = () => true,
}: Ga4AnalyticsProviderOptions): AnalyticsProvider {
  const trimmedMeasurementId = measurementId.trim()
  const canSend = () => trimmedMeasurementId.length > 0 && canTrack()

  return {
    trackPageView(path) {
      if (!canSend()) {
        return
      }

      initializeGa4(trimmedMeasurementId)

      if (!window.gtag) {
        return
      }

      window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_path: path,
        page_title: document.title,
      })
    },
    trackEvent(name, payload = {}) {
      if (!canSend()) {
        return
      }

      initializeGa4(trimmedMeasurementId)

      if (!window.gtag) {
        return
      }

      window.gtag('event', name, payload)
    },
  }
}
