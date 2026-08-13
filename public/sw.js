const LEGACY_CACHE = 'breadfile-shell-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    const needsRecovery = cacheNames.includes(LEGACY_CACHE);
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    await self.clients.claim();

    // The old worker may already have served HTML that points at assets removed
    // by a newer deployment. Reload controlled tabs once after deleting that
    // stale cache so affected devices repair themselves automatically.
    if (needsRecovery) {
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map((client) => client.navigate(client.url)));
    }
  })());
});

// Build assets are fingerprinted by Vite and cached correctly by the browser and
// Cloudflare. The service worker deliberately does not intercept requests.
