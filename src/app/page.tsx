'use client';

import { Suspense, lazy } from 'react';
import { Navigation } from '@/app/components/layout/Navigation';
import { NotificationCenter } from '@/app/components/layout/NotificationCenter';
import { HelpModal } from '@/app/components/modals/HelpModal';
import { useUIStore } from '@/app/stores/ui-store';
import { useDocumentStore } from '@/app/stores/document-store';
import { ProcessorPerformanceMonitor, ProcessorPreloader, BundleAnalyzer } from '@/app/components/lazy/LazyDocumentProcessor';

// Lazy load heavy components
const FileUpload = lazy(() => import('@/app/components/upload/FileUpload').then(m => ({ default: m.FileUpload })));
const DocumentList = lazy(() => import('@/app/components/upload/DocumentList').then(m => ({ default: m.DocumentList })));
const MergeOptions = lazy(() => import('@/app/components/merge/MergeOptions').then(m => ({ default: m.MergeOptions })));
const DocumentPreview = lazy(() => import('@/app/components/preview/DocumentPreview').then(m => ({ default: m.DocumentPreview })));
const PreviewList = lazy(() => import('@/app/components/preview/DocumentPreview').then(m => ({ default: m.PreviewList })));
const ExportResults = lazy(() => import('@/app/components/export/ExportResults').then(m => ({ default: m.ExportResults })));

// Loading component
const ComponentLoader = ({ name }: { name: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
      <span className="text-gray-400">Loading {name}...</span>
    </div>
  </div>
);

export default function Home() {
  const { activeTab } = useUIStore();
  const documents = useDocumentStore(state => state.documents);
  
  // Get unique formats for preloading
  const formats = [...new Set(documents.map(doc => doc.format))];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="space-y-6">
            {/* Hero Section with Tagline */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">
                Upload Documents
              </h1>
              <p className="text-lg text-text-primary mb-2">
                Combine PDFs, Word docs and spreadsheets into a single file in seconds.
              </p>
              <p className="text-text-secondary">
                Add your documents to get started with merging – everything is processed locally for maximum privacy.
              </p>
            </div>
            
            <Suspense fallback={<ComponentLoader name="File Upload" />}>
              <FileUpload />
            </Suspense>
            <Suspense fallback={<ComponentLoader name="Document List" />}>
              <DocumentList />
            </Suspense>
          </div>
        );

      case 'merge':
        return (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">Merge Options</h1>
              <p className="text-lg text-text-secondary">
                Configure how you want to merge your documents
              </p>
            </div>
            
            <Suspense fallback={<ComponentLoader name="Merge Options" />}>
              <MergeOptions />
            </Suspense>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">Preview Documents</h1>
              <p className="text-lg text-text-secondary">
                Preview your documents before merging
              </p>
            </div>
            
            <Suspense fallback={<ComponentLoader name="Document Previews" />}>
              <PreviewList />
            </Suspense>
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl lg:text-4xl font-bold text-text-primary mb-3">Export & Download</h1>
              <p className="text-lg text-text-secondary">
                Download your merged documents
              </p>
            </div>
            
            <Suspense fallback={<ComponentLoader name="Export Results" />}>
              <ExportResults />
            </Suspense>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ProcessorPerformanceMonitor>
      <div className="min-h-screen bg-background text-text-primary flex flex-col lg:flex-row">
        {/* Processor Preloader - preload based on uploaded document types */}
        <ProcessorPreloader formats={formats} />
        
        {/* Bundle Analyzer for development */}
        <BundleAnalyzer />
        
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main 
          className="flex-1 p-4 lg:p-8 overflow-y-auto" 
          role="main"
          aria-live="polite"
          aria-label="Main application content"
        >
          <div className="max-w-5xl mx-auto">
            {renderContent()}
          </div>
        </main>

        {/* Modals and Overlays */}
        <HelpModal />
        <NotificationCenter />

        {/* Document Preview Modal */}
        <Suspense fallback={null}>
          <DocumentPreview />
        </Suspense>
      </div>
    </ProcessorPerformanceMonitor>
  );
}
