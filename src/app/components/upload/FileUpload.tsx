'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { DocumentPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { useUIStore } from '@/app/stores/ui-store';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE } from '@/app/lib/utils/file-utils';
import { cn } from '@/app/lib/utils/cn';
import { DocumentOrderModal } from './DocumentOrderModal';

export function FileUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
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

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isDragActive && !isDragReject
                ? 'Drop files here'
                : isDragReject
                ? 'Unsupported files'
                : 'Upload Documents'
              }
            </h3>
            
            <p className="text-sm text-gray-400 max-w-md">
              {isDragReject
                ? 'Please upload supported document formats only'
                : 'Drag & drop your documents here, or click to browse'
              }
            </p>
          </div>

          <div className="space-y-2 text-xs text-gray-500">
            <p>Supported formats: {supportedFormatsText}</p>
            <p>Maximum file size: {MAX_FILE_SIZE / 1024 / 1024}MB per file</p>
            <p>Bulk upload: Up to 100 documents</p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation();
              // Trigger the file input click
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (input) input.click();
            }}
          >
            Choose Files
          </Button>
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

      {/* Upload Tips */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-primary mb-2">📄 Multiple Formats</h4>
          <p className="text-gray-400">
            Mix and match PDFs, Word docs, Excel sheets, and more
          </p>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-accent mb-2">⚡ Bulk Processing</h4>
          <p className="text-gray-400">
            Upload up to 100 documents at once for efficient processing
          </p>
        </div>
        
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-medium text-secondary mb-2">🔒 Client-Side</h4>
          <p className="text-gray-400">
            Documents are processed locally for maximum privacy
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