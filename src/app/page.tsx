'use client';

import { Navigation } from '@/app/components/layout/Navigation';
import { NotificationCenter } from '@/app/components/layout/NotificationCenter';
import { FileUpload } from '@/app/components/upload/FileUpload';
import { DocumentList } from '@/app/components/upload/DocumentList';
import { MergeOptions } from '@/app/components/merge/MergeOptions';
import { DocumentPreview, PreviewList } from '@/app/components/preview/DocumentPreview';
import { ExportResults } from '@/app/components/export/ExportResults';
import { useUIStore } from '@/app/stores/ui-store';

export default function Home() {
  const { activeTab } = useUIStore();

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
            
            <FileUpload />
            <DocumentList />
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
            
            <MergeOptions />
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
            
            <PreviewList />
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
            
            <ExportResults />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
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
      <DocumentPreview />
    </div>
  );
}
