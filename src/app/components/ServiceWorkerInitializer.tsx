'use client';

import { useEffect } from 'react';
import { initServiceWorker, logPerformanceMetrics } from '@/app/lib/utils/service-worker';

export function ServiceWorkerInitializer() {
  useEffect(() => {
    // Initialize service worker
    const initSW = async () => {
      try {
        const registered = await initServiceWorker({
          enableCaching: true,
          maxCacheSize: 150 * 1024 * 1024, // 150MB for document processing
          processorCacheDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
          uiCacheDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        
        if (registered) {
          console.log('✅ Service Worker initialized for document processing optimization');
        }
      } catch (error) {
        console.error('❌ Service Worker initialization failed:', error);
      }
    };

    // Run after initial render
    const timer = setTimeout(initSW, 1000);

    // Log performance metrics after page load
    const metricsTimer = setTimeout(logPerformanceMetrics, 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(metricsTimer);
    };
  }, []);

  // This component doesn't render anything
  return null;
}