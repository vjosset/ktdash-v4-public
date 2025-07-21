const VERSION = '1.0.5'
const CACHE_NAME = `cache-v${VERSION}`
const STATIC_ASSETS = [
  '/fonts/',
]

// Cache times in milliseconds
const CACHE_TIMES = {
  // Cache these endpoints for 6 hours
  LONG: 6 * 60 * 60 * 1000,
  // Cache these endpoints for 1 hour
  HOUR: 60 * 60 * 1000,
  // Cache these endpoints for 5 minutes
  SHORT: 5 * 60 * 1000
}

// Cache configuration with patterns
const CACHE_CONFIG = {
  // Regex matches
  patterns: [
    {
      // Match API killteam detail (with ID)
      match: /^\/api\/killteams\/[^\/]+$/,
      maxAge: CACHE_TIMES.SHORT,
      description: 'API killteam detail'
    },
    {
      // Match killteam detail page (with ID)
      match: /^\/killteams\/[^\/]+$/,
      maxAge: CACHE_TIMES.SHORT,
      description: 'Killteam detail page'
    },
    {
      // Match images
      match: /^\/img\/[^\/]+$/,
      maxAge: CACHE_TIMES.LONG,
      description: 'Images'
    },
    {
      // Match icons
      match: /^\/icons\/[^\/]+$/,
      maxAge: CACHE_TIMES.LONG,
      description: 'Images'
    }
  ],
  // Exact matches
  exact: {
    '/manifest.json': CACHE_TIMES.HOUR,
    '/api/specials': CACHE_TIMES.HOUR,
    '/api/killteams': CACHE_TIMES.HOUR,
    '/api/missions': CACHE_TIMES.HOUR,
    '/api/battlefields': CACHE_TIMES.HOUR,
    '/api/medals': CACHE_TIMES.HOUR,
    '/killteams': CACHE_TIMES.HOUR,
    '/auth/login': CACHE_TIMES.HOUR,
    '/auth/signup': CACHE_TIMES.HOUR,
    '/': CACHE_TIMES.HOUR,
    '/rules': CACHE_TIMES.HOUR,
  }
}

// Install event: cache core assets
self.addEventListener('install', (event) => {
  self.skipWaiting()
  console.log('Service Worker version', VERSION, 'installing')
})

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((keyList) =>
        Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('Removing old cache', key)
              return caches.delete(key)
            }
          })
        )
      ),
      // Take control immediately
      self.clients.claim()
    ])
  )
  console.log('Service Worker version', VERSION, 'activated')
})

// Helper to check if URL matches any static asset patterns
const isStaticAsset = (url) => {
  return STATIC_ASSETS.some(pattern => url.includes(pattern))
}

// Helper to check if a cached response is still valid
const isCacheValid = (cachedResponse, maxAge) => {
  if (!cachedResponse) return false
  
  const cachedAt = new Date(cachedResponse.headers.get('sw-cache-timestamp'))
  const now = new Date()
  return (now.getTime() - cachedAt.getTime()) < maxAge
}

// Helper to get cache config for an API endpoint
const getCacheConfig = (url) => {
  // First check exact matches
  if (CACHE_CONFIG.exact[url.pathname]) {
    return CACHE_CONFIG.exact[url.pathname]
  }
  
  // Then check patterns
  const matchingPattern = CACHE_CONFIG.patterns.find(
    pattern => pattern.match.test(url.pathname)
  )
  
  return matchingPattern?.maxAge || null
}

// Helper to cache a response with timestamp
const cacheResponse = async (request, response, cacheTime) => {
  const cache = await caches.open(CACHE_NAME)
  const headers = new Headers(response.headers)
  headers.append('sw-cache-timestamp', new Date().toISOString())
  
  const responseToCache = new Response(await response.clone().blob(), {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
  
  await cache.put(request, responseToCache)
}

// Fetch event: use different strategies based on request type
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  //console.log("[SW] fetch", event.request.url)

  // For navigation requests (HTML pages), use network-first
  if (event.request.mode === 'navigate') {
    //console.log("[SW] navigating")
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request)
        })
    )
    return
  }

  // For static assets, use cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    )
    return
  }

  // For configured endpoints, use time-based caching
  const cacheTime = getCacheConfig(url)
  //console.log("[SW] CacheTime:", cacheTime)
  if (cacheTime && event.request.method === 'GET') {
    //console.log("  [SW] Request is cacheable")
    event.respondWith(
      caches.match(event.request).then(async (cachedResponse) => {
        // Return cached response if it's still valid
        if (isCacheValid(cachedResponse, cacheTime)) {
          //console.log('  [SW] Returning cached response for', event.request.url)
          return cachedResponse
        }

        // Otherwise fetch new response
        try {
          const response = await fetch(event.request)
          const responseClone = response.clone()
          
          // Cache the new response with timestamp
          cacheResponse(event.request, responseClone, cacheTime)
          
          return response
        } catch (error) {
          // If network fails, return cached response even if expired
          return cachedResponse
        }
      })
    )
    return
  }

  // For everything else (other API requests, etc), go network-only
  event.respondWith(fetch(event.request))
})

self.addEventListener('message', async (event) => {
  console.log("Received message", event.data)
  if (event.data === 'CLEAR_CACHE') {
    console.log("Received CLEAR_CACHE message...")
    const keys = await caches.keys()
    await Promise.all(keys.map(key => {
      if (key.startsWith('cache-')) {
        console.log('[SW] Clearing cache:', key)
        return caches.delete(key)
      }
    }))
    event.ports[0]?.postMessage({ success: true })
  }
})
