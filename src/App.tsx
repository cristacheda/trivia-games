import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from '@/app/app-providers'
import { AppShell } from '@/components/layout/app-shell'
import { RouteSeo } from '@/components/seo/route-seo'

const loadHomePage = () => import('@/pages/home-page')
const loadFlagQuizPage = () => import('@/pages/flag-quiz-page')
const loadGuessTheCapitalPage = () => import('@/pages/guess-the-capital-page')
const loadOutlineQuizPage = () => import('@/pages/outline-quiz-page')
const loadGuessTheArtistPage = () => import('@/pages/guess-the-artist-page')
const loadGuessTheCurrencyPage = () => import('@/pages/guess-the-currency-page')
const loadGuessTheCocktailPage = () => import('@/pages/guess-the-cocktail-page')
const loadSettingsPage = () => import('@/pages/settings-page')
const loadTermsPage = () => import('@/pages/terms-page')
const loadPrivacyPolicyPage = () => import('@/pages/privacy-policy-page')
const loadNotFoundPage = () => import('@/pages/not-found-page')

const offlineCapablePageLoaders = [
  loadHomePage,
  loadFlagQuizPage,
  loadGuessTheCapitalPage,
  loadOutlineQuizPage,
  loadGuessTheArtistPage,
  loadGuessTheCurrencyPage,
  loadGuessTheCocktailPage,
]

const HomePage = lazy(async () => {
  const module = await loadHomePage()
  return { default: module.HomePage }
})

const FlagQuizPage = lazy(async () => {
  const module = await loadFlagQuizPage()
  return { default: module.FlagQuizPage }
})

const GuessTheCapitalPage = lazy(async () => {
  const module = await loadGuessTheCapitalPage()
  return { default: module.GuessTheCapitalPage }
})

const OutlineQuizPage = lazy(async () => {
  const module = await loadOutlineQuizPage()
  return { default: module.OutlineQuizPage }
})
const GuessTheArtistPage = lazy(async () => {
  const module = await loadGuessTheArtistPage()
  return { default: module.GuessTheArtistPage }
})

const GuessTheCurrencyPage = lazy(async () => {
  const module = await loadGuessTheCurrencyPage()
  return { default: module.GuessTheCurrencyPage }
})

const GuessTheCocktailPage = lazy(async () => {
  const module = await loadGuessTheCocktailPage()
  return { default: module.GuessTheCocktailPage }
})

const SettingsPage = lazy(async () => {
  const module = await loadSettingsPage()
  return { default: module.SettingsPage }
})

const TermsPage = lazy(async () => {
  const module = await loadTermsPage()
  return { default: module.TermsPage }
})

const PrivacyPolicyPage = lazy(async () => {
  const module = await loadPrivacyPolicyPage()
  return { default: module.PrivacyPolicyPage }
})

const NotFoundPage = lazy(async () => {
  const module = await loadNotFoundPage()
  return { default: module.NotFoundPage }
})

function RouteChunkWarmup() {
  useEffect(() => {
    let cancelled = false

    const warmRoutes = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return
      }

      await navigator.serviceWorker.ready

      if (cancelled) {
        return
      }

      // Warm all offline-capable route modules only after the service worker is
      // active so startup does not race route preloads against SW registration.
      await Promise.all(offlineCapablePageLoaders.map((load) => load().catch(() => null)))
    }

    void warmRoutes()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <RouteChunkWarmup />
        <RouteSeo />
        <AppShell>
          <Suspense fallback={<div className="min-h-[40vh]" />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/games/flag-quiz" element={<FlagQuizPage />} />
              <Route
                path="/games/guess-the-capital"
                element={<GuessTheCapitalPage />}
              />
              <Route path="/games/outline-quiz" element={<OutlineQuizPage />} />
              <Route
                path="/games/guess-the-artist"
                element={<GuessTheArtistPage />}
              />
              <Route
                path="/games/guess-the-currency"
                element={<GuessTheCurrencyPage />}
              />
              <Route
                path="/games/guess-the-cocktail"
                element={<GuessTheCocktailPage />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </AppProviders>
  )
}
