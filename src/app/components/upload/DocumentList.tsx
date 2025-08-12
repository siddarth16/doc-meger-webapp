'use client';

import { useState } from 'react';
import { 
  DocumentIcon, 
  TrashIcon, 
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { useUIStore } from '@/app/stores/ui-store';
import { formatFileSize } from '@/app/lib/utils/file-utils';
import { DocumentFile } from '@/app/types';
import { cn } from '@/app/lib/utils/cn';

interface DocumentListProps {
  className?: string;
}

export function DocumentList({ className }: DocumentListProps) {
  const documents = useDocumentStore(state => state.documents);
  const removeDocument = useDocumentStore(state => state.removeDocument);
  const clearDocuments = useDocumentStore(state => state.clearDocuments);
  const reorderDocuments = useDocumentStore(state => state.reorderDocuments);
  const openPreview = useUIStore(state => state.openPreview);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <DocumentIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No documents uploaded yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Upload some documents to get started with merging
        </p>
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      reorderDocuments(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const getStatusIcon = (status: DocumentFile['status']) => {
    switch (status) {
      case 'processed':
        return <CheckCircleIcon className="h-5 w-5 text-primary" />;
      case 'processing':
        return (
          <div className="h-5 w-5">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
          </div>
        );
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <div className="h-5 w-5 bg-gray-500 rounded-full animate-pulse" />;
    }
  };

  const getFormatColor = (format: string) => {
    const colors = {
      pdf: 'text-red-400 bg-red-500/10',
      docx: 'text-blue-400 bg-blue-500/10',
      xlsx: 'text-green-400 bg-green-500/10',
      pptx: 'text-orange-400 bg-orange-500/10',
      txt: 'text-gray-400 bg-gray-500/10',
      csv: 'text-yellow-400 bg-yellow-500/10',
    };
    return colors[format as keyof typeof colors] || 'text-gray-400 bg-gray-500/10';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Documents ({documents.length})
        </h3>
        {documents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDocuments}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Document List */}
      <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
        {documents.map((document, index) => (
          <div
            key={document.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'bg-muted/30 border border-border rounded-lg p-4 transition-all duration-200',
              'hover:bg-muted/50 hover:border-primary/30 cursor-move',
              draggedIndex === index && 'opacity-50 scale-95',
              document.status === 'error' && 'border-red-500/30'
            )}
          >
            <div className="flex items-center space-x-4">
              {/* Drag Handle */}
              <div className="flex flex-col space-y-1 text-gray-500 cursor-grab active:cursor-grabbing">
                <div className="w-3 h-0.5 bg-current rounded" />
                <div className="w-3 h-0.5 bg-current rounded" />
                <div className="w-3 h-0.5 bg-current rounded" />
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(document.status)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-foreground truncate">
                    {document.name}
                  </p>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded',
                      getFormatColor(document.format)
                    )}
                  >
                    {document.format.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                  <span>{formatFileSize(document.size)}</span>
                  {document.metadata?.pageCount && (
                    <span>{document.metadata.pageCount} pages</span>
                  )}
                  {document.metadata?.wordCount && (
                    <span>{document.metadata.wordCount.toLocaleString()} words</span>
                  )}
                  {document.metadata?.sheetCount && (
                    <span>{document.metadata.sheetCount} sheets</span>
                  )}
                </div>

                {document.status === 'error' && document.error && (
                  <p className="text-red-400 text-xs mt-1">{document.error}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {document.preview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPreview(document)}
                    className="text-accent hover:text-accent/80"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(document.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Processing Progress */}
            {document.status === 'processing' && (
              <div className="mt-3 bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full transition-all duration-300 animate-pulse w-1/2" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      {documents.length > 1 && (
        <div className="text-xs text-gray-500 bg-muted/20 rounded-lg p-3">
          <p className="flex items-center">
            <span className="mr-2">💡</span>
            Drag and drop to reorder documents. The merge order will follow the list order.
          </p>
        </div>
      )}
    </div>
  );
}