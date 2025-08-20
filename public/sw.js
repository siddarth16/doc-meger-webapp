// Service Worker for Document Merger App
// Optimized for document processing libraries and UI caching

const CACHE_NAME = 'doc-merger-v1.0';
const PROCESSOR_CACHE = 'doc-processors-v1.0';
const UI_CACHE = 'ui-cache-v1.0';

// Critical files to cache immediately
const CORE_FILES = [
  '/',
  '/manifest.json',
  '/favicon.ico'
];

// Document processing libraries (cache with longer expiration)
const PROCESSOR_PATTERNS = [
  /doc-processors/,
  /pdf-lib/,
  /docx/,
  /mammoth/,
  /xlsx/,
  /pptx/
];

// UI libraries (cache with medium expiration)
const UI_PATTERNS = [
  /ui-libs/,
  /headlessui/,
  /heroicons/,
  /framer-motion/
];

// Install event - cache core files
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching core files...');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        // Skip waiting to activate immediately
        self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache core files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME && 
                cacheName !== PROCESSOR_CACHE && 
                cacheName !== UI_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Claim control of all clients
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Strategy 1: Document processors - Cache first, network fallback
    if (PROCESSOR_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await cacheFirst(request, PROCESSOR_CACHE, 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    
    // Strategy 2: UI libraries - Stale while revalidate
    if (UI_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await staleWhileRevalidate(request, UI_CACHE, 7 * 24 * 60 * 60 * 1000); // 7 days
    }
    
    // Strategy 3: Static assets - Cache first
    if (pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|ico|woff2?|eot|ttf|otf)$/)) {
      return await cacheFirst(request, CACHE_NAME, 24 * 60 * 60 * 1000); // 1 day
    }
    
    // Strategy 4: HTML pages - Network first
    if (pathname === '/' || pathname.endsWith('.html') || !pathname.includes('.')) {
      return await networkFirst(request, CACHE_NAME, 5 * 60 * 1000); // 5 minutes
    }
    
    // Default: Network first
    return await networkFirst(request, CACHE_NAME);
    
  } catch (error) {
    console.error('Fetch handler error:', error);
    return fetch(request);
  }
}

// Cache-first strategy (good for immutable assets)
async function cacheFirst(request, cacheName, maxAge = 24 * 60 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Check if cache is still fresh
    const dateHeader = cached.headers.get('date');
    if (dateHeader) {
      const cachedTime = new Date(dateHeader).getTime();
      const now = Date.now();
      if (now - cachedTime < maxAge) {
        return cached;
      }
    } else {
      // No date header, assume it's still fresh for half the maxAge
      return cached;
    }
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone response before caching
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // Network failed, return stale cache if available
    if (cached) {
      console.warn('Network failed, serving stale cache:', request.url);
      return cached;
    }
    throw error;
  }
}

// Network-first strategy (good for dynamic content)
async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    // Try network with timeout
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), timeout)
    );
    
    const response = await Promise.race([networkPromise, timeoutPromise]);
    
    if (response.ok) {
      // Cache successful response
      const responseToCache = response.clone();
      await cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    console.warn('Network failed, trying cache:', error.message);
    
    // Network failed, try cache
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    throw error;
  }
}

// Stale-while-revalidate strategy (good for assets that change occasionally)
async function staleWhileRevalidate(request, cacheName, maxAge = 7 * 24 * 60 * 60 * 1000) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  // Always try to fetch in background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) {
        const responseToCache = response.clone();
        cache.put(request, responseToCache);
      }
      return response;
    })
    .catch(error => {
      console.warn('Background fetch failed:', error.message);
    });
  
  // Return cached version immediately if available and fresh
  if (cached) {
    const dateHeader = cached.headers.get('date');
    if (dateHeader) {
      const cachedTime = new Date(dateHeader).getTime();
      const now = Date.now();
      if (now - cachedTime < maxAge) {
        // Fresh cache, return immediately and update in background
        fetchPromise.catch(() => {}); // Don't let background fetch errors bubble up
        return cached;
      }
    }
    
    // Stale cache, but still return it while fetching fresh version
    try {
      const fresh = await Promise.race([
        fetchPromise,
        new Promise((resolve) => setTimeout(() => resolve(cached), 1000)) // Fallback to cache after 1s
      ]);
      return fresh;
    } catch {
      return cached;
    }
  }
  
  // No cache, wait for network
  try {
    return await fetchPromise;
  } catch (error) {
    throw error;
  }
}

// Handle cache cleanup messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_CLEANUP':
      handleCacheCleanup(data);
      break;
      
    case 'PRELOAD_PROCESSORS':
      handlePreloadProcessors(data);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

async function handleCacheCleanup(data) {
  const { maxSize = 50 * 1024 * 1024 } = data; // Default 50MB
  
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            totalSize += parseInt(contentLength, 10);
          }
        }
      }
    }
    
    console.log(`Total cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (totalSize > maxSize) {
      console.log('Cache size exceeded, cleaning up...');
      // Clean up oldest entries first
      // This is a simplified cleanup - in production you'd want more sophisticated LRU
      const oldestCache = cacheNames.sort().slice(0, Math.floor(cacheNames.length / 3));
      for (const cacheName of oldestCache) {
        await caches.delete(cacheName);
      }
    }
  } catch (error) {
    console.error('Cache cleanup failed:', error);
  }
}

async function handlePreloadProcessors(data) {
  const { formats = [] } = data;
  
  console.log('Preloading processors for formats:', formats);
  
  // This would preload specific processor chunks based on detected formats
  // Implementation depends on your chunk naming strategy
  const processorUrls = formats.map(format => `/_next/static/chunks/processors-${format}.js`);
  
  try {
    const cache = await caches.open(PROCESSOR_CACHE);
    const requests = processorUrls.map(url => new Request(url));
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response);
        }
      } catch (error) {
        console.warn(`Failed to preload processor: ${request.url}`, error);
      }
    }
  } catch (error) {
    console.error('Processor preloading failed:', error);
  }
}