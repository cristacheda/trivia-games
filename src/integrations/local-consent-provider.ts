import {
  getTrackingConsent,
  setTrackingConsent,
} from '@/lib/storage'
import type { ConsentProvider } from '@/integrations/contracts'

export function createLocalConsentProvider(): ConsentProvider {
  return {
    canTrackAnalytics() {
      return getTrackingConsent() === 'granted'
    },
    getTrackingConsent,
    setTrackingConsent,
  }
}
