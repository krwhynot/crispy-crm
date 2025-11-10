# Service Worker Strategy Spike

**Date:** November 3, 2024
**Spike ID:** P6-E2-S0-T1
**Confidence Before:** 60%
**Confidence After:** 80%
**Time Spent:** 3 hours
**Current Status:** NO OFFLINE SUPPORT IMPLEMENTED

## Executive Summary

After analyzing the codebase and researching best practices, we recommend implementing a **Progressive Offline Strategy** starting with critical trade show functionality. The application currently has ZERO offline capability, which is a critical gap for the primary use case of capturing leads at trade shows with spotty connectivity.

## Current Implementation Status

### ❌ What's Missing (Everything)
- No service worker file
- No PWA manifest
- No IndexedDB setup
- No cache strategy
- No offline fallback
- No background sync
- No Vite PWA plugin

### 🎯 Critical Gap
Trade show salespeople CANNOT capture leads without internet. This defeats the primary purpose of a mobile-first CRM.

## Recommended Implementation Strategy

### Phase 1: Critical Path (2 days) - Trade Show MVP

Focus ONLY on lead capture offline capability:

```javascript
// sw.js - Minimal trade show functionality
const CACHE_NAME = 'crm-v1';
const OFFLINE_API = 'offline-queue-v1';

// Critical assets for lead capture
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/opportunities/create',  // Lead capture form
  '/contacts/create',       // Contact form
  // Include bundled JS/CSS (from Vite manifest)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CRITICAL_ASSETS);
    })
  );
  self.skipWaiting(); // Activate immediately
});

self.addEventListener('fetch', (event) => {
  // For API POST requests (creating leads/contacts)
  if (event.request.method === 'POST' &&
      (event.request.url.includes('/opportunities') ||
       event.request.url.includes('/contacts'))) {

    event.respondWith(
      fetch(event.request.clone())
        .catch(async () => {
          // Queue for later sync
          await queueOfflineRequest(event.request);

          // Return success response to app
          return new Response(
            JSON.stringify({
              id: `offline-${Date.now()}`,
              queued: true,
              message: 'Saved offline. Will sync when connected.'
            }),
            {
              status: 202, // Accepted
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
  }
  // ... handle other requests
});
```

### Phase 2: Full Offline Support (3 days)

#### Caching Strategy by Resource Type

```javascript
// Cache strategies configuration
const CACHE_STRATEGIES = {
  // Static assets - Cache First
  static: {
    pattern: /\.(js|css|woff2|png|jpg|svg)$/,
    cache: 'static-v1',
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // API GET requests - Network First with Cache Fallback
  api: {
    pattern: /\/rest\/v1\//,
    cache: 'api-v1',
    strategy: 'NetworkFirst',
    networkTimeout: 5000,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Images from Supabase Storage - Stale While Revalidate
  images: {
    pattern: /storage\.supabase/,
    cache: 'images-v1',
    strategy: 'StaleWhileRevalidate',
    maxEntries: 50,
  }
};

// Implement strategy handlers
const strategies = {
  CacheFirst: async (request, cache) => {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cache);
      cache.put(request, response.clone());
    }
    return response;
  },

  NetworkFirst: async (request, cacheName, timeout = 5000) => {
    try {
      const response = await Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeout)
        )
      ]);

      if (response.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return caches.match(request) || offlineFallback(request);
    }
  },

  StaleWhileRevalidate: async (request, cacheName) => {
    const cached = await caches.match(request);

    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(cacheName);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    });

    return cached || fetchPromise;
  }
};
```

### Phase 3: IndexedDB for Offline Data (2 days)

```javascript
// db.js - IndexedDB schema for offline storage
const DB_NAME = 'AtomicCRM';
const DB_VERSION = 1;

const STORES = {
  contacts: { keyPath: 'id', indexes: ['organization_id', 'email'] },
  organizations: { keyPath: 'id', indexes: ['name'] },
  opportunities: { keyPath: 'id', indexes: ['stage', 'customer_organization_id'] },
  offlineQueue: { keyPath: 'id', autoIncrement: true },
  syncConflicts: { keyPath: 'id', autoIncrement: true }
};

class OfflineDB {
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        for (const [storeName, config] of Object.entries(STORES)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement
            });

            // Create indexes
            if (config.indexes) {
              config.indexes.forEach(index => {
                store.createIndex(index, index, { unique: false });
              });
            }
          }
        }
      };
    });
  }

  async saveForOffline(storeName, data) {
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    return store.put(data);
  }

  async queueOperation(operation) {
    const transaction = this.db.transaction(['offlineQueue'], 'readwrite');
    const store = transaction.objectStore('offlineQueue');

    return store.add({
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    });
  }
}
```

### Phase 4: Background Sync (1 day)

```javascript
// Background sync for offline queue
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  const db = new OfflineDB();
  await db.init();

  const queue = await db.getAllPending('offlineQueue');

  for (const operation of queue) {
    try {
      // Reconstruct the request
      const request = new Request(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: JSON.stringify(operation.body)
      });

      const response = await fetch(request);

      if (response.ok) {
        // Success - remove from queue
        await db.delete('offlineQueue', operation.id);

        // Update local cache with server response
        const data = await response.json();
        if (operation.storeName) {
          await db.saveForOffline(operation.storeName, data);
        }
      } else if (response.status === 409) {
        // Conflict - save for user resolution
        await db.saveConflict(operation, await response.json());
        await db.delete('offlineQueue', operation.id);
      } else {
        // Retry later
        await db.incrementRetry('offlineQueue', operation.id);
      }
    } catch (error) {
      // Network still unavailable - keep in queue
      console.log('Sync failed, will retry:', error);
    }
  }
}
```

### Phase 5: Conflict Resolution UI (1 day)

```typescript
// React component for conflict resolution
function ConflictResolver() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useEffect(() => {
    loadConflicts();

    // Listen for new conflicts from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'conflict-detected') {
        setConflicts(prev => [...prev, event.data.conflict]);
      }
    });
  }, []);

  const resolveConflict = async (conflictId: string, resolution: 'local' | 'server' | 'merge') => {
    const conflict = conflicts.find(c => c.id === conflictId);

    switch (resolution) {
      case 'local':
        // Overwrite server with local changes
        await forceUpdate(conflict.localData);
        break;

      case 'server':
        // Discard local changes
        await discardLocal(conflict);
        break;

      case 'merge':
        // Show merge UI
        openMergeDialog(conflict);
        break;
    }
  };

  if (conflicts.length === 0) return null;

  return (
    <div className="conflict-banner">
      <AlertCircle className="text-yellow-500" />
      <span>{conflicts.length} sync conflicts need your attention</span>
      <Button onClick={() => setShowConflicts(true)}>
        Review
      </Button>
    </div>
  );
}
```

## Vite Configuration

Install Vite PWA plugin:

```bash
npm install -D vite-plugin-pwa
```

Update `vite.config.ts`:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    // ... existing plugins
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Atomic CRM',
        short_name: 'AtomicCRM',
        description: 'Offline-capable CRM for trade shows',
        theme_color: '#84cc16', // Lime green brand color
        background_color: '#fefef9', // Warm cream background
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
```

## Testing Strategy

### Unit Tests
```javascript
// sw.test.js
describe('Service Worker', () => {
  test('caches critical assets on install', async () => {
    const cache = await caches.open('crm-v1');
    const keys = await cache.keys();
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.some(k => k.url.includes('/opportunities/create'))).toBe(true);
  });

  test('queues POST requests when offline', async () => {
    // Simulate offline
    const request = new Request('/rest/v1/opportunities', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Lead' })
    });

    const response = await handleOfflinePost(request);
    expect(response.status).toBe(202);

    const queue = await getOfflineQueue();
    expect(queue.length).toBe(1);
  });
});
```

### Integration Tests
```typescript
// offline.spec.ts
test('can capture leads offline at trade show', async ({ page, context }) => {
  // Go offline
  await context.setOffline(true);

  // Navigate to create opportunity
  await page.goto('/opportunities/create');

  // Fill form
  await page.fill('[name="name"]', 'Trade Show Lead');
  await page.selectOption('[name="stage"]', 'new_lead');

  // Submit
  await page.click('button[type="submit"]');

  // Should show offline notification
  await expect(page.locator('.offline-notice')).toBeVisible();

  // Go online
  await context.setOffline(false);

  // Wait for sync
  await page.waitForTimeout(2000);

  // Verify synced
  await page.goto('/opportunities');
  await expect(page.locator('text=Trade Show Lead')).toBeVisible();
});
```

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First offline load | < 2s | After initial cache |
| Form submission offline | < 100ms | Queue response time |
| Sync on reconnect | < 5s | For 50 queued items |
| Cache size | < 50MB | Monitor with quota API |
| Battery impact | < 5% | Background sync frequency |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS Safari limitations | No background sync | Manual sync button |
| Storage quota exceeded | Offline fails | Monitor and clean old data |
| Sync conflicts | Data loss | Three-way merge UI |
| Stale data | Wrong decisions | Clear cache indicators |

## Implementation Checklist

### Week 1: Foundation
- [ ] Install vite-plugin-pwa
- [ ] Create basic service worker
- [ ] Implement critical asset caching
- [ ] Add offline queue for POST requests
- [ ] Deploy to staging for testing

### Week 2: Enhancement
- [ ] Add IndexedDB storage layer
- [ ] Implement background sync
- [ ] Build conflict resolution UI
- [ ] Add offline indicators
- [ ] Performance optimization

## Recommendations

1. **Start with Trade Show MVP** - Just offline lead capture
2. **Use Workbox** - Don't reinvent caching strategies
3. **Test on Real Devices** - Especially iOS Safari
4. **Monitor Storage** - Set quotas and cleanup policies
5. **Clear UX** - Always show online/offline status

## Conclusion

**Confidence increases from 60% to 80%** because:
- ✅ Clear implementation path defined
- ✅ Critical trade show use case prioritized
- ✅ Proven patterns (Workbox) selected
- ✅ Incremental rollout strategy
- ✅ Conflict resolution addressed

The remaining 20% uncertainty:
- iOS Safari background sync limitations
- Real-world sync conflict complexity
- Storage quota management at scale

## Next Steps

1. **Immediate (Day 1):** Install vite-plugin-pwa and create basic worker
2. **Priority (Week 1):** Offline lead capture at trade shows
3. **Enhancement (Week 2):** Full offline support with IndexedDB
4. **Polish (Week 3):** Conflict resolution and UX indicators