import { useSyncExternalStore } from 'react'

type ConnectivityListener = () => void

let browserListenersAttached = false
const listeners = new Set<ConnectivityListener>()
let forcedOffline = false

function isBrowser() {
  return typeof window !== 'undefined'
}

function getBrowserOnlineValue() {
  if (!isBrowser()) {
    return true
  }

  return window.navigator.onLine
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

function setForcedOffline(nextValue: boolean) {
  if (forcedOffline === nextValue) {
    return
  }

  forcedOffline = nextValue
  emitChange()
}

function handleBrowserOnline() {
  forcedOffline = false
  emitChange()
}

function handleBrowserOffline() {
  forcedOffline = false
  emitChange()
}

function ensureBrowserListeners() {
  if (!isBrowser() || browserListenersAttached) {
    return
  }

  window.addEventListener('online', handleBrowserOnline)
  window.addEventListener('offline', handleBrowserOffline)
  browserListenersAttached = true
}

export function isNetworkAvailable() {
  return getBrowserOnlineValue() && !forcedOffline
}

export function reportNetworkOffline() {
  if (!isBrowser()) {
    return
  }

  ensureBrowserListeners()
  setForcedOffline(true)
}

export function subscribeToConnectivity(listener: ConnectivityListener) {
  ensureBrowserListeners()
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function useOnlineStatus() {
  ensureBrowserListeners()

  return useSyncExternalStore(
    subscribeToConnectivity,
    isNetworkAvailable,
    () => true,
  )
}

export function resetConnectivityForTests() {
  forcedOffline = false
  listeners.clear()
}
