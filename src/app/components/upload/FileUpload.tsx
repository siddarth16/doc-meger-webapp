'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentPlusIcon, XMarkIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { useUIStore } from '@/app/stores/ui-store';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from '@/app/lib/utils/file-utils';
import { loadAllSampleDocuments } from '@/app/lib/utils/sample-documents';
import { cn } from '@/app/lib/utils/cn';
import { DocumentOrderModal } from './DocumentOrderModal';

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const addDocuments = useDocumentStore(state => state.addDocuments);
  const validateFiles = useDocumentStore(state => state.validateFiles);
  const documents = useDocumentStore(state => state.documents);
  const addNotification = useUIStore(state => state.addNotification);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      setDragActive(false);
      
      if (acceptedFiles.length === 0) return;

      const { valid, invalid, errors } = validateFiles(acceptedFiles);
      
      if (invalid.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Some files were rejected',
          message: errors.join(', '),
          duration: 8000,
        });
      }

      if (valid.length > 0) {
        const currentDocumentCount = documents.length;
        await addDocuments(valid);
        
        // Show ordering modal if we now have multiple documents and added more than 1 file
        if ((currentDocumentCount + valid.length) > 1 && valid.length > 1) {
          setTimeout(() => {
            setShowOrderModal(true);
          }, 500); // Small delay to let the documents load
        }
        
        addNotification({
          type: 'success',
          title: 'Files added successfully',
          message: `Added ${valid.length} document${valid.length === 1 ? '' : 's'}`,
        });
      }
    } catch (error) {
      console.error('File upload error:', error);
      addNotification({
        type: 'error',
        title: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [addDocuments, validateFiles, addNotification, documents.length]);

  // Handle sample documents loading
  const handleLoadSamples = useCallback(async () => {
    try {
      setIsLoadingSamples(true);
      
      const sampleFiles = await loadAllSampleDocuments();
      
      if (sampleFiles.length === 0) {
        addNotification({
          type: 'warning',
          title: 'No sample documents available',
          message: 'Could not load sample documents. Please try uploading your own files.',
        });
        return;
      }

      const { valid, invalid, errors } = validateFiles(sampleFiles);
      
      if (invalid.length > 0) {
        addNotification({
          type: 'warning',
          title: 'Some sample documents were rejected',
          message: errors.join(', '),
          duration: 8000,
        });
      }

      if (valid.length > 0) {
        await addDocuments(valid);
        
        addNotification({
          type: 'success',
          title: 'Sample documents loaded',
          message: `Added ${valid.length} sample documents to explore the service`,
          duration: 6000,
        });

        // Show ordering modal for samples
        setTimeout(() => {
          setShowOrderModal(true);
        }, 500);
      }
    } catch (error) {
      console.error('Sample documents loading error:', error);
      addNotification({
        type: 'error',
        title: 'Failed to load samples',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoadingSamples(false);
    }
  }, [addDocuments, validateFiles, addNotification]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const supportedFormatsText = Object.keys(SUPPORTED_FORMATS).map(format => 
    format.toUpperCase()
  ).join(', ');

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer',
          'min-h-[300px] flex flex-col items-center justify-center p-8',
          isDragActive && !isDragReject
            ? 'border-primary bg-primary/5 scale-105'
            : isDragReject
            ? 'border-red-500 bg-red-500/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className={cn(
            'rounded-full p-4 transition-colors',
            isDragActive && !isDragReject
              ? 'bg-primary text-black'
              : isDragReject
              ? 'bg-red-500 text-white'
              : 'bg-muted text-foreground'
          )}>
            {isDragReject ? (
              <XMarkIcon className="h-8 w-8" />
            ) : (
              <DocumentPlusIcon className="h-8 w-8" />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-text-primary">
              {isDragActive && !isDragReject
                ? 'Drop files here'
                : isDragReject
                ? 'Unsupported files'
                : 'Upload Documents'
              }
            </h3>
            
            <p className="text-base text-text-secondary max-w-lg">
              {isDragReject
                ? 'Please upload supported document formats only'
                : 'Drag & drop your documents here, or use the buttons below to get started'
              }
            </p>
          </div>

          <div className="space-y-2 text-sm text-text-muted">
            <p className="font-medium">Supported formats: <span className="font-normal">{supportedFormatsText}</span></p>
            <p>Maximum file size: <span className="font-semibold">{MAX_FILE_SIZE / 1024 / 1024}MB</span> per file</p>
            <p>Bulk upload: Up to <span className="font-semibold">100</span> documents</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                // Trigger the file input click
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input) input.click();
              }}
              aria-label="Choose files from your computer"
            >
              <DocumentPlusIcon className="h-5 w-5 mr-2" />
              Choose Files
            </Button>
            
            <Button
              variant="accent"
              size="lg"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                handleLoadSamples();
              }}
              disabled={isLoadingSamples}
              loading={isLoadingSamples}
              aria-label="Load sample documents to try the service"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {isLoadingSamples ? 'Loading...' : 'Use Sample Documents'}
            </Button>
          </div>
        </div>

        {/* Drag Overlay */}
        {dragActive && (
          <div className="absolute inset-0 rounded-xl bg-primary/10 border-2 border-primary flex items-center justify-center">
            <div className="text-primary text-xl font-semibold">
              Drop files to upload
            </div>
          </div>
        )}
      </div>

      {/* Feature Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Privacy Feature - Highlighted as primary selling point */}
        <div className="md:col-span-1 bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-accent/10 rounded-full -mr-10 -mt-10" />
          <div className="relative">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h4 className="font-bold text-lg text-text-primary mb-2">100% Private</h4>
            <p className="text-text-secondary text-sm leading-relaxed">
              Your documents never leave your device. All processing happens locally in your browser for maximum security and privacy.
            </p>
          </div>
        </div>
        
        {/* Other Features */}
        <div className="bg-surface-secondary rounded-xl p-5 border border-border">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center mb-3">
            <span className="text-xl">📄</span>
          </div>
          <h4 className="font-semibold text-base text-text-primary mb-2">Multiple Formats</h4>
          <p className="text-text-secondary text-sm">
            Mix and match PDFs, Word docs, Excel sheets, and more in a single merge operation
          </p>
        </div>
        
        <div className="bg-surface-secondary rounded-xl p-5 border border-border">
          <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center mb-3">
            <span className="text-xl">⚡</span>
          </div>
          <h4 className="font-semibold text-base text-text-primary mb-2">Bulk Processing</h4>
          <p className="text-text-secondary text-sm">
            Upload up to 100 documents at once with intelligent chunked processing for large files
          </p>
        </div>
      </div>

      {/* Document Ordering Modal */}
      <DocumentOrderModal
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        onConfirm={() => {
          setShowOrderModal(false);
          addNotification({
            type: 'success',
            title: 'Document order updated',
            message: 'Your documents will be merged in the specified order',
          });
        }}
      />
    </div>
  );
}