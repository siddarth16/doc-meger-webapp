'use client';

import { lazy, Suspense, ReactNode } from 'react';
import { DocumentFormat } from '@/app/types';

// Lazy load heavy document processing components
const LazyPDFProcessor = lazy(() => 
  import('@/app/lib/document-processors/pdf-processor').then(() => ({
    default: () => <div>PDF Processor Loaded</div>
  }))
);

const LazyWordProcessor = lazy(() => 
  import('@/app/lib/document-processors/word-processor').then(() => ({
    default: () => <div>Word Processor Loaded</div>
  }))
);

const LazyExcelProcessor = lazy(() => 
  import('@/app/lib/document-processors/excel-processor').then(() => ({
    default: () => <div>Excel Processor Loaded</div>
  }))
);

const LazyPowerPointProcessor = lazy(() => 
  import('@/app/lib/document-processors/powerpoint-processor').then(() => ({
    default: () => <div>PowerPoint Processor Loaded</div>
  }))
);

interface LazyProcessorProps {
  format: DocumentFormat;
  children: ReactNode;
  fallback?: ReactNode;
}

const ProcessorFallback = ({ format }: { format: DocumentFormat }) => (
  <div className="flex items-center justify-center p-4">
    <div className="flex items-center space-x-2">
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent" />
      <span className="text-sm text-gray-400">
        Loading {format.toUpperCase()} processor...
      </span>
    </div>
  </div>
);

export function LazyDocumentProcessor({ children }: LazyProcessorProps) {
  // For now, just return children as the processors are loaded on-demand
  return <div>{children}</div>;
}

// Hook for lazy loading document processors
export function useLazyProcessor() {
  const loadProcessor = async (format: DocumentFormat) => {
    switch (format) {
      case 'pdf':
        return await import('@/app/lib/document-processors/pdf-processor');
      case 'docx':
        return await import('@/app/lib/document-processors/word-processor');
      case 'xlsx':
        return await import('@/app/lib/document-processors/excel-processor');
      case 'pptx':
        return await import('@/app/lib/document-processors/powerpoint-processor');
      case 'txt':
      case 'csv':
        return await import('@/app/lib/document-processors/text-processor');
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  };

  return { loadProcessor };
}

// Performance monitoring component
export function ProcessorPerformanceMonitor({ children }: { children: ReactNode }) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.debug('Page load performance:', {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstByte: navEntry.responseStart - navEntry.requestStart,
          });
        }
        
        if (entry.entryType === 'resource' && entry.name.includes('doc-processors')) {
          console.debug('Processor chunk loaded:', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }

  return <>{children}</>;
}

// Component for preloading processors based on detected file types
export function ProcessorPreloader({ formats }: { formats: DocumentFormat[] }) {
  const { loadProcessor } = useLazyProcessor();
  
  // Preload processors for detected formats
  React.useEffect(() => {
    const preloadProcessors = async () => {
      // Only preload if we have formats and not too many to avoid overloading
      if (formats.length > 0 && formats.length <= 3) {
        const uniqueFormats = [...new Set(formats)];
        
        // Preload with a small delay to not interfere with initial page load
        setTimeout(() => {
          uniqueFormats.forEach(async (format) => {
            try {
              await loadProcessor(format);
              console.debug(`Preloaded processor for ${format}`);
            } catch (error) {
              console.warn(`Failed to preload processor for ${format}:`, error);
            }
          });
        }, 1000);
      }
    };

    if (formats.length > 0) {
      preloadProcessors();
    }
  }, [formats, loadProcessor]);

  return null; // This component doesn't render anything
}

// Bundle size analyzer (development only)
export function BundleAnalyzer() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const analyzeBundle = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(r => r.name.endsWith('.js'));
        
        const bundleInfo = {
          totalJS: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          chunks: jsResources.map(r => ({
            name: r.name.split('/').pop(),
            size: r.transferSize,
            duration: r.duration
          })).sort((a, b) => (b.size || 0) - (a.size || 0))
        };
        
        console.table(bundleInfo.chunks);
        console.log(`Total JS bundle size: ${(bundleInfo.totalJS / 1024).toFixed(2)} KB`);
      }
    };

    // Analyze after page load
    const timer = setTimeout(analyzeBundle, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}

// Import React for hooks
import React from 'react';