'use client';

import React, { useState } from 'react';
import { 
  XMarkIcon,
  ArrowsUpDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import { useDocumentStore } from '@/app/stores/document-store';
import { DocumentFile } from '@/app/types';
import { cn } from '@/app/lib/utils/cn';
import { formatFileSize } from '@/app/lib/utils/file-utils';

interface DocumentOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DocumentOrderModal({ isOpen, onClose, onConfirm }: DocumentOrderModalProps) {
  const documents = useDocumentStore(state => state.documents);
  const reorderDocuments = useDocumentStore(state => state.reorderDocuments);
  
  const [tempDocuments, setTempDocuments] = useState<DocumentFile[]>(documents);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Update temp documents when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTempDocuments([...documents]);
    }
  }, [isOpen, documents]);

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
      const newDocuments = [...tempDocuments];
      const draggedDoc = newDocuments[draggedIndex];
      newDocuments.splice(draggedIndex, 1);
      newDocuments.splice(dropIndex, 0, draggedDoc);
      setTempDocuments(newDocuments);
    }
    setDraggedIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newDocuments = [...tempDocuments];
      [newDocuments[index - 1], newDocuments[index]] = [newDocuments[index], newDocuments[index - 1]];
      setTempDocuments(newDocuments);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < tempDocuments.length - 1) {
      const newDocuments = [...tempDocuments];
      [newDocuments[index], newDocuments[index + 1]] = [newDocuments[index + 1], newDocuments[index]];
      setTempDocuments(newDocuments);
    }
  };

  const handleConfirm = () => {
    // Apply the reordering to the actual store
    tempDocuments.forEach((doc, newIndex) => {
      const oldIndex = documents.findIndex(d => d.id === doc.id);
      if (oldIndex !== newIndex) {
        reorderDocuments(oldIndex, newIndex);
      }
    });
    onConfirm();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Your Documents</h2>
            <p className="text-sm text-gray-400 mt-1">
              Arrange documents in the order you want them merged. Scripts will be combined in this exact sequence.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-foreground"
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Document List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {tempDocuments.map((document, index) => (
              <div
                key={document.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'bg-muted/30 border border-border rounded-lg p-4 transition-all duration-200',
                  'hover:bg-muted/50 hover:border-primary/30',
                  draggedIndex === index && 'opacity-50 scale-95'
                )}
              >
                <div className="flex items-center space-x-4">
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-black rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Drag Handle */}
                  <div className="flex flex-col space-y-1 text-gray-500 cursor-grab active:cursor-grabbing">
                    <div className="w-3 h-0.5 bg-current rounded" />
                    <div className="w-3 h-0.5 bg-current rounded" />
                    <div className="w-3 h-0.5 bg-current rounded" />
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
                    </div>
                  </div>

                  {/* Move Buttons */}
                  <div className="flex flex-col space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 h-6 w-6 text-gray-400 hover:text-foreground disabled:opacity-30"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === tempDocuments.length - 1}
                      className="p-1 h-6 w-6 text-gray-400 hover:text-foreground disabled:opacity-30"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-4 text-xs text-gray-500 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="flex items-center">
              <ArrowsUpDownIcon className="h-4 w-4 mr-2 text-blue-400" />
              <span className="text-blue-300">
                Drag documents to reorder, or use the arrow buttons. Episode scripts will be merged in numerical order from top to bottom.
              </span>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <div className="text-sm text-gray-400">
            {tempDocuments.length} documents will be merged in this order
          </div>
          <div className="flex space-x-3">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              className="min-w-24"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Confirm Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}