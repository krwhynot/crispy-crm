# Offline Mode Implementation Plan

> **⏸️ STATUS: DEFERRED TO POST-MVP**
>
> **Reason:** Trade show use case is not critical for Excel replacement goal (30 days). Online-only sufficient for small team MVP.
>
> **Rationale:** Per principal-centric redesign v2.0, offline mode is nice-to-have for field sales. Office-based Account Managers (primary users) have reliable internet.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement read-only offline mode with Service Worker for trade show use case

**Architecture:** Service Worker caches static assets + IndexedDB stores last 100 viewed records. Background sync when online. Based on 527-line spike document (docs/spikes/2024-11-03-service-worker-strategy.md).

**Tech Stack:** Service Worker API, Cache API, IndexedDB, Workbox (optional)
**Effort:** 5-7 days | **Priority:** ⏸️ DEFERRED | **Status:** 0% code, 100% planned

**Reference:** All design decisions in spike document

---

## Task 1: Create Service Worker (Day 1-2)

### Step 1-3: Create Service Worker File

**File:** `public/sw.js`

```javascript
const CACHE_NAME = 'atomic-crm-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  // Add other static assets
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new
      return response || fetch(event.request)
    })
  )
})

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
})
```

### Step 4-5: Register Service Worker

**File:** `src/main.tsx`

```typescript
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('[SW] Registered', reg))
      .catch(err => console.error('[SW] Failed:', err))
  })
}
```

---

## Task 2: IndexedDB for Data Caching (Day 2-3)

### Step 6-8: Create IndexedDB Wrapper

**File:** `src/lib/offline/db.ts`

```typescript
import { openDB, DBSchema } from 'idb'

interface OfflineDB extends DBSchema {
  contacts: { key: string; value: any }
  organizations: { key: string; value: any }
  opportunities: { key: string; value: any }
}

export const db = await openDB<OfflineDB>('offline-crm', 1, {
  upgrade(db) {
    db.createObjectStore('contacts')
    db.createObjectStore('organizations')
    db.createObjectStore('opportunities')
  },
})

export async function cacheRecord(store: string, id: string, data: any) {
  await db.put(store, data, id)
}

export async function getCachedRecord(store: string, id: string) {
  return await db.get(store, id)
}

export async function getAllCached(store: string) {
  return await db.getAll(store)
}
```

### Step 9-10: Integrate with Data Provider

**File:** `src/atomic-crm/providers/supabase/unifiedDataProvider.ts`

```typescript
import { cacheRecord, getCachedRecord } from '../../../lib/offline/db'

// In getOne method:
getOne: async (resource, params) => {
  try {
    const { data } = await supabase.from(resource).select('*').eq('id', params.id).single()
    
    // Cache for offline
    await cacheRecord(resource, params.id, data)
    
    return { data }
  } catch (error) {
    // Try offline cache
    const cached = await getCachedRecord(resource, params.id)
    if (cached) return { data: cached }
    throw error
  }
}
```

---

## Task 3: Offline UI Indicators (Day 3-4)

### Step 11-13: Create Offline Banner

**File:** `src/components/OfflineBanner.tsx`

```typescript
import { Alert } from '@mui/material'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

export function OfflineBanner() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      You are offline. Viewing cached data. Changes cannot be saved.
    </Alert>
  )
}
```

**Hook:** `src/hooks/useOnlineStatus.ts`

```typescript
import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### Step 14: Disable Actions When Offline

```typescript
// In components, check online status:
const isOnline = useOnlineStatus()

<Button disabled={!isOnline}>Create</Button>
<Button disabled={!isOnline}>Edit</Button>
```

---

## Task 4: Background Sync (Day 4-5)

### Step 15-17: Implement Sync

**In Service Worker:**

```javascript
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  // Sync queued operations when back online
  const queue = await getQueuedOperations()
  for (const op of queue) {
    await fetch(op.url, { method: op.method, body: op.data })
  }
}
```

### Step 18-20: Test & Commit

```bash
# Test offline mode:
npm run build
npm run preview
# Open DevTools → Network → Throttling → Offline
# Verify cached content loads
# Verify offline banner appears

git add public/sw.js src/lib/offline/ src/components/OfflineBanner.tsx
git commit -m "feat: implement read-only offline mode

- Add Service Worker for static asset caching
- Implement IndexedDB for last 100 viewed records
- Create offline UI banner and disabled actions
- Add background sync for when back online
- Based on spike: docs/spikes/2024-11-03-service-worker-strategy.md

Trade show use case: View cached data without internet

🤖 Generated with Claude Code"
```

---

**Plan Status:** ✅ Ready | **Time:** 3-5 days | **Impact:** HIGH (Trade show feature)
