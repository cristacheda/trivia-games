/// <reference types="vite/client" />

declare const __APP_VERSION__: string
declare const __APP_COMMIT_SHA__: string
declare const __APP_BUILD_ID__: string

declare module 'virtual:pwa-register/react' {
  export function useRegisterSW(options?: {
    immediate?: boolean
    onNeedReload?: () => void
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration?: ServiceWorkerRegistration) => void
    onRegisteredSW?: (
      swScriptUrl: string,
      registration?: ServiceWorkerRegistration,
    ) => void
    onRegisterError?: (error: Error) => void
  }): {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
