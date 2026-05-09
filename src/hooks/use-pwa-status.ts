import { useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePwaStatus() {
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW: (_swScriptUrl, registration) => {
      registrationRef.current = registration ?? null
    },
  })

  useEffect(() => {
    const updateRegistration = () => {
      void registrationRef.current?.update()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateRegistration()
      }
    }

    window.addEventListener('focus', updateRegistration)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', updateRegistration)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return {
    offlineReady,
    needRefresh,
    refreshApp: () => void updateServiceWorker(true),
  }
}
