import '@fontsource/fraunces/latin-400.css'
import '@fontsource/fraunces/latin-600.css'
import '@fontsource/source-sans-3/latin-400.css'
import '@fontsource/source-sans-3/latin-600.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import '@/index.css'

async function clearLocalPreviewCaches() {
  if (import.meta.env.VITE_LOCAL_PREVIEW_FRESH !== '1' || typeof window === 'undefined') {
    return
  }

  const unregisterTasks =
    'serviceWorker' in navigator
      ? navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(registrations.map((registration) => registration.unregister())),
          )
      : Promise.resolve([])

  const clearCacheTasks =
    'caches' in window
      ? caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      : Promise.resolve([])

  await Promise.all([unregisterTasks, clearCacheTasks])
}

void clearLocalPreviewCaches().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
