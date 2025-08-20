/**
 * Service Worker registration and management utilities
 * Handles caching strategies for document processing libraries
 */

export interface ServiceWorkerConfig {
  enableCaching: boolean;
  maxCacheSize: number; // in bytes
  processorCacheDuration: number; // in milliseconds
  uiCacheDuration: number; // in milliseconds
}

const DEFAULT_CONFIG: ServiceWorkerConfig = {
  enableCaching: true,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  processorCacheDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  uiCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
};

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig;
  private isSupported: boolean;

  constructor(config: Partial<ServiceWorkerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'caches' in window &&
           process.env.NODE_ENV === 'production'; // Only in production
  }

  /**
   * Register the service worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported || !this.config.enableCaching) {
      console.log('Service Worker not supported or disabled');
      return false;
    }

    try {
      console.log('Registering Service Worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available, consider refreshing');
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for controller changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service worker controller changed');
        // Optionally reload the page to ensure consistency
        if (this.shouldAutoReload()) {
          window.location.reload();
        }
      });

      console.log('Service Worker registered successfully');
      
      // Setup periodic cache cleanup
      this.setupCacheCleanup();
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Check if service worker is active
   */
  isActive(): boolean {
    return !!(this.registration?.active);
  }

  /**
   * Send message to service worker
   */
  async sendMessage(type: string, data: Record<string, unknown> = {}): Promise<void> {
    if (!this.registration?.active) {
      console.warn('Service worker not active, cannot send message');
      return;
    }

    try {
      this.registration.active.postMessage({ type, data });
    } catch (error) {
      console.error('Failed to send message to service worker:', error);
    }
  }

  /**
   * Preload processors for specific formats
   */
  async preloadProcessors(formats: string[]): Promise<void> {
    await this.sendMessage('PRELOAD_PROCESSORS', { formats });
  }

  /**
   * Trigger cache cleanup
   */
  async cleanupCache(): Promise<void> {
    await this.sendMessage('CACHE_CLEANUP', {
      maxSize: this.config.maxCacheSize
    });
  }

  /**
   * Get cache usage statistics
   */
  async getCacheStats(): Promise<{ size: number; keys: number } | null> {
    if (!this.isSupported) return null;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let totalKeys = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalKeys += keys.length;

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              totalSize += parseInt(contentLength, 10);
            } else {
              // Estimate size if content-length not available
              const blob = await response.blob();
              totalSize += blob.size;
            }
          }
        }
      }

      return { size: totalSize, keys: totalKeys };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      const cacheNames = await caches.keys();
      const deletePromises = cacheNames.map(cacheName => caches.delete(cacheName));
      await Promise.all(deletePromises);
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  private notifyUpdate(): void {
    // You could show a toast notification or banner here
    console.log('A new version is available. Please refresh the page.');
    
    // Optionally dispatch a custom event
    window.dispatchEvent(new CustomEvent('swUpdate', {
      detail: { registration: this.registration }
    }));
  }

  private shouldAutoReload(): boolean {
    // Only auto-reload if no user data would be lost
    // You might want to check if there are unsaved documents, etc.
    return false; // Conservative default
  }

  private setupCacheCleanup(): void {
    // Cleanup cache every hour
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000);

    // Cleanup on page visibility change (when user returns to tab)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.cleanupCache();
      }
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, unknown> | null {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return null;
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));

    return {
      pageLoad: {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
      },
      resources: {
        totalJS: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        totalCSS: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
        jsCount: jsResources.length,
        cssCount: cssResources.length,
      },
      memory: (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory ? {
        used: (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize,
        total: (performance as unknown as { memory: { totalJSHeapSize: number } }).memory.totalJSHeapSize,
        limit: (performance as unknown as { memory: { jsHeapSizeLimit: number } }).memory.jsHeapSizeLimit,
      } : null,
    };
  }
}

// Global instance
let swManager: ServiceWorkerManager | null = null;

/**
 * Get or create the service worker manager instance
 */
export function getServiceWorkerManager(config?: Partial<ServiceWorkerConfig>): ServiceWorkerManager {
  if (!swManager) {
    swManager = new ServiceWorkerManager(config);
  }
  return swManager;
}

/**
 * Initialize service worker with default configuration
 */
export async function initServiceWorker(config?: Partial<ServiceWorkerConfig>): Promise<boolean> {
  const manager = getServiceWorkerManager(config);
  return await manager.register();
}

/**
 * Hook for React components to use service worker functionality
 */
export function useServiceWorker(config?: Partial<ServiceWorkerConfig>) {
  const manager = getServiceWorkerManager(config);

  const [isRegistered, setIsRegistered] = React.useState(false);
  const [cacheStats, setCacheStats] = React.useState<{ size: number; keys: number } | null>(null);

  React.useEffect(() => {
    // Register service worker on mount
    manager.register().then(setIsRegistered);

    // Update cache stats periodically
    const updateStats = async () => {
      const stats = await manager.getCacheStats();
      setCacheStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Every 30 seconds

    // Listen for service worker updates
    const handleSWUpdate = () => {
      console.log('Service worker updated');
      updateStats();
    };

    window.addEventListener('swUpdate', handleSWUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('swUpdate', handleSWUpdate);
    };
  }, [manager]);

  return {
    isRegistered,
    cacheStats,
    manager,
    preloadProcessors: manager.preloadProcessors.bind(manager),
    cleanupCache: manager.cleanupCache.bind(manager),
    clearAllCaches: manager.clearAllCaches.bind(manager),
    checkForUpdates: manager.checkForUpdates.bind(manager),
  };
}

// Import React for hooks
import React from 'react';

// Performance monitoring utilities
export function logPerformanceMetrics(): void {
  const manager = getServiceWorkerManager();
  const metrics = manager.getPerformanceMetrics();
  
  if (metrics) {
    console.group('🚀 Performance Metrics');
    console.log('Page Load:', metrics.pageLoad);
    console.log('Resources:', metrics.resources);
    if (metrics.memory) {
      console.log('Memory:', {
        used: `${(metrics.memory.used / 1024 / 1024).toFixed(2)} MB`,
        total: `${(metrics.memory.total / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(metrics.memory.limit / 1024 / 1024).toFixed(2)} MB`,
      });
    }
    console.groupEnd();
  }
}