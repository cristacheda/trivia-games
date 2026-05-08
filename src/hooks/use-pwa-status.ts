import { useRegisterSW } from 'virtual:pwa-register/react'

export function usePwaStatus() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  })

  return {
    offlineReady,
    needRefresh,
    refreshApp: () => void updateServiceWorker(true),
  }
}
