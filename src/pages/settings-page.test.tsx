import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SettingsPage } from '@/pages/settings-page'
import { AppServicesContextForTests } from '@/test/test-app-services'

const { mockIsOnline } = vi.hoisted(() => ({
  mockIsOnline: vi.fn(() => true),
}))

vi.mock('@/hooks/use-online-status', () => ({
  useOnlineStatus: () => mockIsOnline(),
}))

describe('SettingsPage offline account state', () => {
  beforeEach(() => {
    window.localStorage.clear()
    mockIsOnline.mockReturnValue(true)
  })

  it('keeps the account panel local-only while offline', () => {
    mockIsOnline.mockReturnValue(false)

    render(
      <MemoryRouter>
        <AppServicesContextForTests>
          <SettingsPage />
        </AppServicesContextForTests>
      </MemoryRouter>,
    )

    expect(screen.getByText('Local only')).toBeInTheDocument()
  })
})
