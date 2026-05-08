import { createContext, useContext } from 'react'

interface AppChromeContextValue {
  chromeHidden: boolean
  setChromeHidden: (hidden: boolean) => void
}

export const AppChromeContext = createContext<AppChromeContextValue | null>(null)

export function useAppChrome() {
  const value = useContext(AppChromeContext)

  if (!value) {
    throw new Error('useAppChrome must be used within AppShell')
  }

  return value
}
