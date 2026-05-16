import { afterEach, describe, expect, it } from 'vitest'
import {
  isNetworkAvailable,
  reportNetworkOffline,
  resetConnectivityForTests,
  subscribeToConnectivity,
} from '@/lib/connectivity'

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value,
  })
}

describe('connectivity store', () => {
  afterEach(() => {
    setNavigatorOnline(true)
    resetConnectivityForTests()
  })

  it('tracks browser offline and online events', () => {
    setNavigatorOnline(true)
    expect(isNetworkAvailable()).toBe(true)

    setNavigatorOnline(false)
    window.dispatchEvent(new Event('offline'))
    expect(isNetworkAvailable()).toBe(false)

    setNavigatorOnline(true)
    window.dispatchEvent(new Event('online'))
    expect(isNetworkAvailable()).toBe(true)
  })

  it('stays offline after a network failure until the browser comes back online', () => {
    setNavigatorOnline(true)
    reportNetworkOffline()
    expect(isNetworkAvailable()).toBe(false)

    setNavigatorOnline(false)
    window.dispatchEvent(new Event('offline'))
    expect(isNetworkAvailable()).toBe(false)

    setNavigatorOnline(true)
    window.dispatchEvent(new Event('online'))
    expect(isNetworkAvailable()).toBe(true)
  })

  it('notifies subscribers when connectivity changes', () => {
    let changeCount = 0
    const unsubscribe = subscribeToConnectivity(() => {
      changeCount += 1
    })

    reportNetworkOffline()
    setNavigatorOnline(true)
    window.dispatchEvent(new Event('online'))

    unsubscribe()

    expect(changeCount).toBe(2)
  })
})
