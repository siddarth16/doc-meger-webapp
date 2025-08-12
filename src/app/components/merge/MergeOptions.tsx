'use client';

import { useState } from 'react';
import { 
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { useUIStore } from '@/app/stores/ui-store';
import { MergeMode, DocumentFormat } from '@/app/types';
import { cn } from '@/app/lib/utils/cn';

export function MergeOptions() {
  const { documents, mergeOptions, setMergeOptions, startProcessing, isProcessing } = useDocumentStore();
  const { addNotification, setActiveTab } = useUIStore();
  
  const [isStarting, setIsStarting] = useState(false);

  const handleStartProcessing = async () => {
    try {
      setIsStarting(true);
      await startProcessing();
      addNotification({
        type: 'success',
        title: 'Processing completed',
        message: 'Your documents have been merged successfully!'
      });
      setActiveTab('export');
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Processing failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsStarting(false);
    }
  };

  const mergeModes = [
    {
      id: 'sequential' as MergeMode,
      name: 'Sequential Merge',
      description: 'Combine documents in the order they appear',
      icon: DocumentTextIcon
    },
    {
      id: 'smart' as MergeMode,
      name: 'Smart Merge',
      description: 'Intelligently merge similar content types',
      icon: Cog6ToothIcon
    },
    {
      id: 'custom' as MergeMode,
      name: 'Custom Merge',
      description: 'Advanced customization options',
      icon: ArrowPathIcon
    }
  ];

  const outputFormats: { value: DocumentFormat; label: string; description: string }[] = [
    { value: 'pdf', label: 'PDF', description: 'Universal document format' },
    { value: 'docx', label: 'Word', description: 'Microsoft Word document' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel spreadsheet' },
    { value: 'txt', label: 'Text', description: 'Plain text file' },
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' }
  ];

  const qualityOptions = [
    { value: 'low' as const, label: 'Low', description: 'Smaller file size' },
    { value: 'medium' as const, label: 'Medium', description: 'Balanced quality' },
    { value: 'high' as const, label: 'High', description: 'Best quality' }
  ];

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No documents to merge</p>
        <p className="text-gray-500 text-sm mt-2">
          Upload some documents first to configure merge options
        </p>
        <Button
          variant="primary"
          className="mt-4"
          onClick={() => setActiveTab('upload')}
        >
          Upload Documents
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Document Summary */}
      <div className="bg-muted/30 border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Documents to Merge</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{documents.length}</div>
            <div className="text-gray-400">Documents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">
              {(documents.reduce((sum, doc) => sum + doc.size, 0) / 1024 / 1024).toFixed(1)}MB
            </div>
            <div className="text-gray-400">Total Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {documents.filter(doc => doc.status === 'processed').length}
            </div>
            <div className="text-gray-400">Processed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {new Set(documents.map(doc => doc.format)).size}
            </div>
            <div className="text-gray-400">Formats</div>
          </div>
        </div>
      </div>

      {/* Merge Mode */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Merge Mode</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mergeModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setMergeOptions({ mode: mode.id })}
              className={cn(
                'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                mergeOptions.mode === mode.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <div className="flex items-center space-x-3 mb-2">
                <mode.icon className="h-5 w-5" />
                <span className="font-medium">{mode.name}</span>
                {mergeOptions.mode === mode.id && (
                  <CheckIcon className="h-4 w-4 text-primary ml-auto" />
                )}
              </div>
              <p className="text-sm text-gray-400">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Output Format */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Output Format</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {outputFormats.map((format) => (
            <button
              key={format.value}
              onClick={() => setMergeOptions({ outputFormat: format.value })}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200 text-center',
                mergeOptions.outputFormat === format.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
              )}
            >
              <div className="font-medium text-sm">{format.label}</div>
              <div className="text-xs text-gray-400 mt-1">{format.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quality Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Quality</h3>
        <div className="grid grid-cols-3 gap-4">
          {qualityOptions.map((quality) => (
            <button
              key={quality.value}
              onClick={() => setMergeOptions({ quality: quality.value })}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200 text-center',
                mergeOptions.quality === quality.value
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border hover:border-accent/50 hover:bg-muted/30'
              )}
            >
              <div className="font-medium">{quality.label}</div>
              <div className="text-xs text-gray-400 mt-1">{quality.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Output Name */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Output Name</h3>
        <div className="max-w-md">
          <input
            type="text"
            value={mergeOptions.outputName}
            onChange={(e) => setMergeOptions({ outputName: e.target.value })}
            className="w-full px-4 py-2 bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
            placeholder="Enter output filename"
          />
          <p className="text-xs text-gray-500 mt-1">
            File extension will be added automatically based on output format
          </p>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Advanced Options</h3>
        <div className="space-y-3">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeOptions.preserveMetadata}
              onChange={(e) => setMergeOptions({ preserveMetadata: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-foreground">Preserve document metadata</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeOptions.preserveFormatting}
              onChange={(e) => setMergeOptions({ preserveFormatting: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
            />
            <div className="flex-1">
              <span className="text-foreground">Preserve original formatting</span>
              <p className="text-xs text-gray-400 mt-1">
                For DOCX files: Converts to PDF for best formatting preservation. For other formats: Maintains source structure.
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeOptions.pageBreaks}
              onChange={(e) => setMergeOptions({ pageBreaks: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-foreground">Add page breaks between documents</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeOptions.includeHeaders}
              onChange={(e) => setMergeOptions({ includeHeaders: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-foreground">Include document headers</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeOptions.includeFooters}
              onChange={(e) => setMergeOptions({ includeFooters: e.target.checked })}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-foreground">Include document footers</span>
          </label>
        </div>
      </div>

      {/* Formatting Notice */}
      {mergeOptions.preserveFormatting && mergeOptions.outputFormat === 'docx' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="font-medium text-yellow-400 mb-2">⚠️ Formatting Notice</h4>
          <p className="text-sm text-yellow-300">
            For best formatting preservation with DOCX files, consider converting them to PDF first. 
            Direct DOCX merging will preserve basic text structure but may not maintain complex formatting, styles, or embedded objects.
          </p>
        </div>
      )}

      {/* Start Processing Button */}
      <div className="pt-6 border-t border-border">
        <Button
          variant="primary"
          size="lg"
          onClick={handleStartProcessing}
          loading={isStarting || isProcessing}
          disabled={documents.some(doc => doc.status === 'processing' || doc.status === 'error')}
          className="w-full md:w-auto"
        >
          {isProcessing ? 'Processing...' : 'Start Merging'}
        </Button>
        
        {documents.some(doc => doc.status === 'error') && (
          <p className="text-red-400 text-sm mt-2">
            Some documents have errors. Please fix them before proceeding.
          </p>
        )}
      </div>
    </div>
  );
}