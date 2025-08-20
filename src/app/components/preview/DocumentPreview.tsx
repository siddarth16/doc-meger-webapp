'use client';

import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/app/stores/ui-store';
import { useDocumentStore } from '@/app/stores/document-store';
import { formatFileSize } from '@/app/lib/utils/file-utils';
import { Button } from '@/app/components/ui/Button';
import { Fragment } from 'react';

export function DocumentPreview() {
  const { showPreview, previewDocument, closePreview } = useUIStore();

  if (!previewDocument) return null;

  return (
    <Transition appear show={showPreview} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closePreview}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-muted border border-border p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-foreground">
                    Document Preview
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md p-2 text-gray-400 hover:text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={closePreview}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Document Info */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium text-foreground mb-3">Document Info</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-foreground truncate ml-2">{previewDocument.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Format:</span>
                          <span className="text-accent uppercase">{previewDocument.format}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Size:</span>
                          <span className="text-foreground">{formatFileSize(previewDocument.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`capitalize ${
                            previewDocument.status === 'processed' ? 'text-primary' :
                            previewDocument.status === 'error' ? 'text-red-400' :
                            previewDocument.status === 'processing' ? 'text-accent' :
                            'text-gray-400'
                          }`}>
                            {previewDocument.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    {previewDocument.metadata && (
                      <div className="bg-muted/30 rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-3">Metadata</h4>
                        <div className="space-y-2 text-sm">
                          {previewDocument.metadata.pageCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Pages:</span>
                              <span className="text-foreground">{previewDocument.metadata.pageCount}</span>
                            </div>
                          )}
                          {previewDocument.metadata.wordCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Words:</span>
                              <span className="text-foreground">{previewDocument.metadata.wordCount.toLocaleString()}</span>
                            </div>
                          )}
                          {previewDocument.metadata.sheetCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Sheets:</span>
                              <span className="text-foreground">{previewDocument.metadata.sheetCount}</span>
                            </div>
                          )}
                          {previewDocument.metadata.slideCount && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Slides:</span>
                              <span className="text-foreground">{previewDocument.metadata.slideCount}</span>
                            </div>
                          )}
                          {previewDocument.metadata.author && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Author:</span>
                              <span className="text-foreground truncate ml-2">{previewDocument.metadata.author}</span>
                            </div>
                          )}
                          {previewDocument.metadata.title && previewDocument.metadata.title !== previewDocument.name && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Title:</span>
                              <span className="text-foreground truncate ml-2">{previewDocument.metadata.title}</span>
                            </div>
                          )}
                          {previewDocument.metadata.createdDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Created:</span>
                              <span className="text-foreground text-xs">
                                {new Date(previewDocument.metadata.createdDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {previewDocument.metadata.modifiedDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Modified:</span>
                              <span className="text-foreground text-xs">
                                {new Date(previewDocument.metadata.modifiedDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Error Info */}
                    {previewDocument.status === 'error' && previewDocument.error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <h4 className="font-medium text-red-400 mb-2">Error</h4>
                        <p className="text-sm text-red-300">{previewDocument.error}</p>
                      </div>
                    )}
                  </div>

                  {/* Preview Content */}
                  <div className="lg:col-span-2">
                    <div className="bg-muted/30 rounded-lg p-6 h-96 overflow-y-auto custom-scrollbar">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">Content Preview</h4>
                        {previewDocument.progress !== undefined && previewDocument.status !== 'processed' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-muted rounded-full h-1.5">
                              <div 
                                className="bg-accent h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${(previewDocument.progress * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400">
                              {(previewDocument.progress * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {previewDocument.preview ? (
                        <div className="space-y-2">
                          {/* Enhanced preview rendering based on format */}
                          {previewDocument.format === 'xlsx' ? (
                            <div className="text-sm text-foreground">
                              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                                {previewDocument.preview}
                              </pre>
                            </div>
                          ) : previewDocument.format === 'csv' ? (
                            <div className="text-sm text-foreground">
                              <pre className="whitespace-pre font-mono text-xs leading-relaxed overflow-x-auto">
                                {previewDocument.preview}
                              </pre>
                            </div>
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                              {previewDocument.preview}
                            </pre>
                          )}
                        </div>
                      ) : previewDocument.status === 'processing' || previewDocument.status === 'pending' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent mx-auto mb-4" />
                            <p className="text-gray-400 mb-2">
                              {previewDocument.status === 'pending' ? 'Analyzing document...' : 'Generating preview...'}
                            </p>
                            {previewDocument.progress !== undefined && (
                              <p className="text-xs text-gray-500">
                                {(previewDocument.progress * 100).toFixed(0)}% complete
                              </p>
                            )}
                          </div>
                        </div>
                      ) : previewDocument.status === 'error' ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-red-400">
                            <XMarkIcon className="h-12 w-12 mx-auto mb-4" />
                            <p className="mb-2">Preview generation failed</p>
                            <p className="text-xs text-gray-400">Check the error details in the sidebar</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-gray-400">
                            <DocumentIcon className="h-12 w-12 mx-auto mb-2" />
                            <p>Preview not available</p>
                            <p className="text-xs mt-1">Document may be processing or corrupted</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="ghost" onClick={closePreview}>
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export function PreviewList() {
  const { documents } = useDocumentStore();
  const { openPreview } = useUIStore();

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No documents to preview</p>
        <p className="text-gray-500 text-sm mt-2">
          Upload some documents first to preview them
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-muted/30 border border-border rounded-lg p-4 hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 cursor-pointer"
            onClick={() => openPreview(document)}
          >
            <div className="flex items-center space-x-3 mb-3">
              <DocumentIcon className="h-8 w-8 text-gray-400" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{document.name}</h3>
                <p className="text-sm text-gray-400 uppercase">{document.format}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Size:</span>
                <span className="text-foreground">{formatFileSize(document.size)}</span>
              </div>
              
              {document.metadata?.pageCount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Pages:</span>
                  <span className="text-foreground">{document.metadata.pageCount}</span>
                </div>
              )}
              
              {document.metadata?.slideCount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Slides:</span>
                  <span className="text-foreground">{document.metadata.slideCount}</span>
                </div>
              )}
              
              {document.metadata?.sheetCount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Sheets:</span>
                  <span className="text-foreground">{document.metadata.sheetCount}</span>
                </div>
              )}
              
              {document.metadata?.wordCount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Words:</span>
                  <span className="text-foreground">{document.metadata.wordCount > 1000 ? 
                    `${(document.metadata.wordCount / 1000).toFixed(1)}k` : 
                    document.metadata.wordCount.toString()}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`capitalize ${
                  document.status === 'processed' ? 'text-primary' :
                  document.status === 'error' ? 'text-red-400' :
                  document.status === 'processing' ? 'text-accent' :
                  'text-gray-400'
                }`}>
                  {document.status}
                </span>
              </div>
            </div>

            {/* Progress bar for processing documents */}
            {(document.status === 'pending' || document.status === 'processing') && document.progress !== undefined && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">
                    {document.status === 'pending' ? 'Analyzing...' : 'Processing...'}
                  </span>
                  <span className="text-xs text-gray-400">{(document.progress * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div 
                    className="bg-accent h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(document.progress * 100)}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Preview text for processed documents */}
            {document.status === 'processed' && document.preview && (
              <div className="mt-3 text-xs text-gray-500">
                <div className="line-clamp-2 leading-relaxed">
                  {document.preview.split('\n').slice(0, 3).join(' ').substring(0, 120)}...
                </div>
              </div>
            )}
            
            {/* Error indicator */}
            {document.status === 'error' && (
              <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                Processing failed - click to view details
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}