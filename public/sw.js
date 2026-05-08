self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheKeys = await caches.keys()
    await Promise.all(
      cacheKeys
        .filter((cacheKey) => cacheKey.startsWith('atlas-of-answers-'))
        .map((cacheKey) => caches.delete(cacheKey)),
    )

    await self.registration.unregister()

    const windowClients = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    })

    await Promise.all(windowClients.map((client) => client.navigate(client.url)))
  })())
})
