import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProviders } from '@/app/app-providers'
import { AppShell } from '@/components/layout/app-shell'
import { FlagQuizPage } from '@/pages/flag-quiz-page'
import { HomePage } from '@/pages/home-page'

export default function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games/flag-quiz" element={<FlagQuizPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </AppProviders>
  )
}
