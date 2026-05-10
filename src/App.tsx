import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from '@/app/app-providers'
import { AppShell } from '@/components/layout/app-shell'
import { RouteSeo } from '@/components/seo/route-seo'

const HomePage = lazy(async () => {
  const module = await import('@/pages/home-page')
  return { default: module.HomePage }
})

const FlagQuizPage = lazy(async () => {
  const module = await import('@/pages/flag-quiz-page')
  return { default: module.FlagQuizPage }
})

const GuessTheCapitalPage = lazy(async () => {
  const module = await import('@/pages/guess-the-capital-page')
  return { default: module.GuessTheCapitalPage }
})

const OutlineQuizPage = lazy(async () => {
  const module = await import('@/pages/outline-quiz-page')
  return { default: module.OutlineQuizPage }
})
const GuessTheArtistPage = lazy(async () => {
  const module = await import('@/pages/guess-the-artist-page')
  return { default: module.GuessTheArtistPage }
})

const GuessTheCurrencyPage = lazy(async () => {
  const module = await import('@/pages/guess-the-currency-page')
  return { default: module.GuessTheCurrencyPage }
})

const GuessTheCocktailPage = lazy(async () => {
  const module = await import('@/pages/guess-the-cocktail-page')
  return { default: module.GuessTheCocktailPage }
})

const NotFoundPage = lazy(async () => {
  const module = await import('@/pages/not-found-page')
  return { default: module.NotFoundPage }
})

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
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
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </AppProviders>
  )
}
