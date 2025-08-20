'use client';

import { useState } from 'react';
import { 
  DocumentIcon, 
  TrashIcon, 
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilIcon,
  Bars3Icon
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
  const updateDocument = useDocumentStore(state => state.updateDocument);
  const openPreview = useUIStore(state => state.openPreview);

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Handle file renaming
  const startRename = (document: DocumentFile) => {
    setEditingId(document.id);
    setEditingName(document.name);
  };

  const saveRename = (documentId: string) => {
    if (editingName.trim() && editingName !== documents.find(d => d.id === documentId)?.name) {
      updateDocument(documentId, { name: editingName.trim() });
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  // Handle keyboard navigation for renaming
  const handleKeyDown = (e: React.KeyboardEvent, documentId: string) => {
    if (e.key === 'Enter') {
      saveRename(documentId);
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  if (documents.length === 0) {
    return (
      <div className={cn('text-center py-12 bg-surface-secondary rounded-xl border border-border', className)}>
        <DocumentIcon className="h-16 w-16 text-text-disabled mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">No documents uploaded yet</h3>
        <p className="text-text-secondary text-base">
          Upload some documents to get started with merging, or try our sample documents
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
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">
            Documents ({documents.length})
          </h3>
          <p className="text-sm text-text-secondary mt-1">
            Drag to reorder • Click to rename • Documents will merge in this order
          </p>
        </div>
        {documents.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearDocuments}
            className="text-error hover:text-error/80 hover:bg-error/10"
            aria-label="Clear all documents"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Document List */}
      <div 
        className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar"
        role="list"
        aria-label="Document list"
      >
        {documents.map((document, index) => (
          <div
            key={document.id}
            role="listitem"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              'bg-surface-secondary border border-border rounded-xl p-4 transition-all duration-200',
              'hover:bg-surface-elevated hover:border-primary/30 hover:shadow-sm',
              draggedIndex === index && 'opacity-50 scale-98 cursor-grabbing',
              draggedIndex !== index && 'cursor-move',
              document.status === 'error' && 'border-error/50 bg-error/5'
            )}
            aria-label={`Document ${index + 1}: ${document.name}`}
          >
            <div className="flex items-center space-x-4">
              {/* Drag Handle */}
              <button
                className="flex flex-col space-y-1 text-text-disabled hover:text-text-secondary cursor-grab active:cursor-grabbing p-1 rounded focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`Drag to reorder ${document.name}`}
                tabIndex={0}
              >
                <Bars3Icon className="h-5 w-5" />
              </button>

              {/* Status Icon */}
              <div className="flex-shrink-0" aria-hidden="true">
                {getStatusIcon(document.status)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-1">
                  {editingId === document.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => saveRename(document.id)}
                      onKeyDown={(e) => handleKeyDown(e, document.id)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-1 text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                      aria-label="Edit document name"
                    />
                  ) : (
                    <button
                      onClick={() => startRename(document)}
                      className="flex-1 text-left font-medium text-text-primary hover:text-primary truncate focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                      title="Click to rename"
                      aria-label={`Rename ${document.name}`}
                    >
                      {document.name}
                    </button>
                  )}
                  
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-semibold rounded-md',
                      getFormatColor(document.format)
                    )}
                    aria-label={`File format: ${document.format}`}
                  >
                    {document.format.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <span>{formatFileSize(document.size)}</span>
                  {document.metadata?.pageCount && (
                    <span>{document.metadata.pageCount} pages</span>
                  )}
                  {document.metadata?.slideCount && (
                    <span>{document.metadata.slideCount} slides</span>
                  )}
                  {document.metadata?.wordCount && (
                    <span>{document.metadata.wordCount.toLocaleString()} words</span>
                  )}
                  {document.metadata?.sheetCount && (
                    <span>{document.metadata.sheetCount} sheets</span>
                  )}
                </div>

                {document.status === 'error' && document.error && (
                  <p className="text-error text-sm mt-2 font-medium" role="alert">
                    {document.error}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-1">
                {editingId !== document.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => startRename(document)}
                    className="text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                    aria-label={`Rename ${document.name}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
                
                {document.status === 'processed' && document.preview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openPreview(document)}
                    className="text-accent hover:text-accent/80 hover:bg-accent/10"
                    aria-label={`Preview ${document.name}`}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(document.id)}
                  className="text-error hover:text-error/80 hover:bg-error/10"
                  aria-label={`Remove ${document.name}`}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Processing Progress */}
            {(document.status === 'processing' || document.status === 'pending') && (
              <div className="mt-4" role="progressbar" aria-label="Processing document">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">
                    {document.status === 'pending' ? 'Analyzing document...' : 'Processing document...'}
                  </span>
                  {document.progress !== undefined && (
                    <span className="text-sm font-medium text-text-secondary">
                      {(document.progress * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: document.progress ? `${(document.progress * 100)}%` : '30%',
                      ...(document.progress === undefined && { animationName: 'pulse' })
                    }}
                    aria-valuenow={document.progress ? document.progress * 100 : 30}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      {documents.length > 1 && (
        <div className="text-sm text-text-secondary bg-info/10 border border-info/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-info/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs">💡</span>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-text-primary">Document Order</p>
              <p>
                Documents will be merged in the order shown above. Drag and drop to reorder, 
                click names to rename, and use the preview button to check content before merging.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}