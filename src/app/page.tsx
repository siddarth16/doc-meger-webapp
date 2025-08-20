'use client';

import { Suspense, lazy } from 'react';
import { Navigation } from '@/app/components/layout/Navigation';
import { NotificationCenter } from '@/app/components/layout/NotificationCenter';
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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Upload Documents</h1>
              <p className="text-gray-400">
                Add your documents to get started with merging
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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Merge Options</h1>
              <p className="text-gray-400">
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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Preview Documents</h1>
              <p className="text-gray-400">
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
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Export & Download</h1>
              <p className="text-gray-400">
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
      <div className="min-h-screen bg-black text-white flex">
        {/* Processor Preloader - preload based on uploaded document types */}
        <ProcessorPreloader formats={formats} />
        
        {/* Bundle Analyzer for development */}
        <BundleAnalyzer />
        
        {/* Sidebar Navigation */}
        <div className="w-80 flex-shrink-0">
          <Navigation />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {renderContent()}
        </main>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Document Preview Modal */}
        <Suspense fallback={null}>
          <DocumentPreview />
        </Suspense>
      </div>
    </ProcessorPerformanceMonitor>
  );
}
