import '@testing-library/jest-dom/vitest'

const store = new Map<string, string>()

const localStorageMock = {
  getItem(key: string) {
    return store.has(key) ? store.get(key) ?? null : null
  },
  setItem(key: string, value: string) {
    store.set(key, value)
  },
  removeItem(key: string) {
    store.delete(key)
  },
  clear() {
    store.clear()
  },
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
