'use client';

import { useState } from 'react';
import { 
  ArrowDownTrayIcon,
  CheckCircleIcon,
  DocumentIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { useUIStore } from '@/app/stores/ui-store';
import { formatFileSize, getFileExtension } from '@/app/lib/utils/file-utils';

export function ExportResults() {
  const { currentJob, clearDocuments, resetMergeOptions } = useDocumentStore();
  const { addNotification, setActiveTab } = useUIStore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!currentJob?.resultUrl) return;

    try {
      setIsDownloading(true);
      
      // Create download link
      const link = document.createElement('a');
      link.href = currentJob.resultUrl;
      link.download = `${currentJob.options.outputName}${getFileExtension(currentJob.outputFormat || 'pdf')}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addNotification({
        type: 'success',
        title: 'Download started',
        message: 'Your merged document is being downloaded'
      });
    } catch {
      addNotification({
        type: 'error',
        title: 'Download failed',
        message: 'There was an error downloading your file'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartNew = () => {
    clearDocuments();
    resetMergeOptions();
    setActiveTab('upload');
    addNotification({
      type: 'info',
      title: 'Ready for new merge',
      message: 'Upload documents to start a new merge operation'
    });
  };

  if (!currentJob) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No merge results to export</p>
        <p className="text-gray-500 text-sm mt-2">
          Complete a merge operation first to download results
        </p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => setActiveTab('upload')}
        >
          Start New Merge
        </Button>
      </div>
    );
  }

  const isCompleted = currentJob.status === 'completed';
  const isFailed = currentJob.status === 'failed';
  const isProcessing = currentJob.status === 'processing' || currentJob.status === 'queued';

  return (
    <div className="space-y-8">
      {/* Status Card */}
      <div className={`rounded-lg border-2 p-6 ${
        isCompleted ? 'border-primary bg-primary/5' :
        isFailed ? 'border-red-500 bg-red-500/5' :
        'border-accent bg-accent/5'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${
            isCompleted ? 'bg-primary text-black' :
            isFailed ? 'bg-red-500 text-white' :
            'bg-accent text-black'
          }`}>
            {isCompleted ? (
              <CheckCircleIcon className="h-6 w-6" />
            ) : isFailed ? (
              <DocumentIcon className="h-6 w-6" />
            ) : (
              <ClockIcon className="h-6 w-6" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${
              isCompleted ? 'text-primary' :
              isFailed ? 'text-red-400' :
              'text-accent'
            }`}>
              {isCompleted ? 'Merge Completed!' :
               isFailed ? 'Merge Failed' :
               'Processing...'}
            </h3>
            <p className="text-gray-400 mt-1">
              {isCompleted ? 'Your documents have been successfully merged' :
               isFailed ? (currentJob.error || 'An error occurred during processing') :
               `Processing ${currentJob.documents.length} documents...`}
            </p>
          </div>

          {isProcessing && (
            <div className="text-accent text-lg font-semibold">
              {Math.round(currentJob.progress)}%
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="mt-4 bg-muted rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentJob.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Job Details */}
      <div className="bg-muted/30 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Job Details</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{currentJob.documents.length}</div>
            <div className="text-gray-400 text-sm">Documents</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-accent uppercase">
              {currentJob.outputFormat || 'pdf'}
            </div>
            <div className="text-gray-400 text-sm">Output Format</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary capitalize">
              {currentJob.options.mode}
            </div>
            <div className="text-gray-400 text-sm">Merge Mode</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-primary capitalize">
              {currentJob.options.quality}
            </div>
            <div className="text-gray-400 text-sm">Quality</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Output Name:</span>
            <span className="text-foreground font-mono">
              {currentJob.options.outputName}{getFileExtension(currentJob.outputFormat || 'pdf')}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-400">Created:</span>
            <span className="text-foreground">
              {currentJob.createdAt.toLocaleString()}
            </span>
          </div>
          
          {currentJob.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-400">Completed:</span>
              <span className="text-foreground">
                {currentJob.completedAt.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-400">Total Size:</span>
            <span className="text-foreground">
              {formatFileSize(currentJob.documents.reduce((sum, doc) => sum + doc.size, 0))}
            </span>
          </div>

          {currentJob.formatReason && (
            <div className="flex justify-between">
              <span className="text-gray-400">Format Decision:</span>
              <span className="text-foreground text-xs">
                {currentJob.formatReason}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Source Documents */}
      <div className="bg-muted/30 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Source Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentJob.documents.map((doc, index) => (
            <div key={doc.id} className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
              <div className="text-gray-400 text-sm w-6">{index + 1}.</div>
              <DocumentIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{doc.name}</p>
                <p className="text-xs text-gray-400 uppercase">{doc.format}</p>
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(doc.size)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {isCompleted && currentJob.resultUrl && (
          <Button
            variant="primary"
            size="lg"
            onClick={handleDownload}
            loading={isDownloading}
            className="flex-1"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Download Merged Document
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="lg"
          onClick={handleStartNew}
          className="flex-1"
        >
          Start New Merge
        </Button>
      </div>
    </div>
  );
}