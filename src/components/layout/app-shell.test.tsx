import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import { createLocalConsentProvider } from '@/integrations/local-consent-provider'
import { setTrackingConsent } from '@/lib/storage'
import { AppServicesContextForTests } from '@/test/test-app-services'

const { mockIsOnline } = vi.hoisted(() => ({
  mockIsOnline: vi.fn(() => true),
}))

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline(),
}))

vi.mock('@/hooks/use-pwa-status', () => ({
  usePwaStatus: () => ({
    offlineReady: false,
    needRefresh: false,
    refreshApp: vi.fn(),
  }),
}))

function renderAppShell() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppServicesContextForTests consent={createLocalConsentProvider()}>
        <AppShell>
          <div>Home content</div>
        </AppShell>
      </AppServicesContextForTests>
    </MemoryRouter>,
  )
}

describe('AppShell privacy prompt', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockIsOnline.mockReturnValue(true)
  })

  it('opens the privacy selector on first visit', () => {
    renderAppShell()

    expect(
      screen.getByRole('heading', {
        name: 'Play anonymously and choose whether optional tracking is allowed.',
      }),
    ).toBeInTheDocument()
  })

  it('does not auto-open the privacy selector after consent was already chosen', () => {
    setTrackingConsent('denied')

    renderAppShell()

    expect(
      screen.queryByRole('heading', {
        name: 'Play anonymously and choose whether optional tracking is allowed.',
      }),
    ).not.toBeInTheDocument()
  })

  it('renders footer links to the public legal pages', () => {
    setTrackingConsent('denied')

    renderAppShell()

    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      '/terms',
    )
  })

  it('shows Offline in the header status menu when connectivity is down', async () => {
    const user = userEvent.setup()
    setTrackingConsent('denied')
    mockIsOnline.mockReturnValue(false)

    renderAppShell()

    await user.click(screen.getByRole('button', { name: 'Menu' }))

    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.queryByText('Online')).not.toBeInTheDocument()
  })
})
