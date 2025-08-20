import { create } from 'zustand';
import { DocumentFile, MergeOptions, ProcessingJob, DocumentFormat } from '@/app/types';
import { 
  validateFile, 
  getDocumentFormat, 
  generateDocumentId, 
  MAX_FILES_BULK 
} from '@/app/lib/utils/file-utils';
import { DocumentProcessor } from '@/app/lib/document-processors';
import { ErrorHandler } from '@/app/lib/utils/error-handler';

interface DocumentStore {
  // State
  documents: DocumentFile[];
  mergeOptions: MergeOptions;
  currentJob: ProcessingJob | null;
  isProcessing: boolean;
  urlsToCleanup: Set<string>;

  // Actions
  addDocuments: (files: File[]) => Promise<void>;
  removeDocument: (id: string) => void;
  clearDocuments: () => void;
  updateDocument: (id: string, updates: Partial<DocumentFile>) => void;
  reorderDocuments: (sourceIndex: number, destinationIndex: number) => void;

  // Merge Options
  setMergeOptions: (options: Partial<MergeOptions>) => void;
  resetMergeOptions: () => void;

  // Processing
  startProcessing: () => Promise<void>;
  cancelProcessing: () => void;
  updateProgress: (progress: number) => void;

  // Utilities
  getSupportedFormats: () => string[];
  validateFiles: (files: File[]) => { valid: File[]; invalid: File[]; errors: string[] };
  getOutputFormat: () => { format: DocumentFormat; reason: string };
  cleanupUrls: () => void;
  addUrlToCleanup: (url: string) => void;
}

const defaultMergeOptions: MergeOptions = {
  mode: 'sequential',
  outputName: 'merged-document',
  preserveMetadata: true,
  preserveFormatting: true,
  quality: 'medium',
  pageBreaks: false,
  includeHeaders: false,
  includeFooters: false,
};

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  // Initial State
  documents: [],
  mergeOptions: defaultMergeOptions,
  currentJob: null,
  isProcessing: false,
  urlsToCleanup: new Set(),

  // Actions
  addDocuments: async (files: File[]) => {
    const { validateFiles } = get();
    const { valid, invalid, errors } = validateFiles(files);

    if (invalid.length > 0) {
      console.warn('Some files were invalid:', errors);
    }

    const existingDocs = get().documents;
    if (existingDocs.length + valid.length > MAX_FILES_BULK) {
      throw new Error(`Cannot add more than ${MAX_FILES_BULK} documents`);
    }

    const newDocuments: DocumentFile[] = [];

    for (const file of valid) {
      const format = getDocumentFormat(file);
      if (!format) continue;

      // Get processing recommendations
      const recommendations = DocumentProcessor.getProcessingRecommendation(file);
      if (recommendations.warnings.length > 0) {
        console.warn(`Processing warnings for ${file.name}:`, recommendations.warnings);
      }

      const documentFile: DocumentFile = {
        id: generateDocumentId(),
        file,
        name: file.name,
        size: file.size,
        format,
        status: 'pending',
      };

      newDocuments.push(documentFile);

      // Validate document structure first
      DocumentProcessor.validateDocument(file, format, {
        onProgress: (progress) => {
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { ...doc, progress: progress * 0.2 } // Validation is 20% of total
                : doc
            )
          }));
        }
      })
      .then(validation => {
        if (!validation.valid) {
          const error = ErrorHandler.createUserFriendlyError(
            validation.error || 'File validation failed',
            'validation'
          );
          const errorDetails = ErrorHandler.getErrorDetails(error);
          
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { 
                    ...doc, 
                    status: 'error' as const, 
                    error: `${errorDetails.title}: ${errorDetails.message}${errorDetails.userAction ? ' ' + errorDetails.userAction : ''}` 
                  }
                : doc
            )
          }));
          return;
        }

        // Analyze document with progress tracking
        DocumentProcessor.analyzeDocument(file, format, {
          onProgress: (progress) => {
            set(state => ({
              documents: state.documents.map(doc =>
                doc.id === documentFile.id
                  ? { ...doc, progress: 0.2 + (progress * 0.4) } // Analysis is 40% of total (20-60%)
                  : doc
              )
            }));
          }
        })
        .then(metadata => {
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { ...doc, metadata, progress: 0.6 }
                : doc
            )
          }));

          // Generate preview as final step
          DocumentProcessor.generatePreview(file, format)
            .then(preview => {
              set(state => ({
                documents: state.documents.map(doc =>
                  doc.id === documentFile.id
                    ? { ...doc, preview, status: 'processed' as const, progress: 1.0 }
                    : doc
                )
              }));
            })
            .catch(originalError => {
              const error = ErrorHandler.createUserFriendlyError(originalError, 'preview');
              const errorDetails = ErrorHandler.getErrorDetails(error);
              
              console.error('Preview generation failed:', {
                file: file.name,
                error: errorDetails,
                originalError
              });
              
              // Don't fail the entire document for preview errors
              set(state => ({
                documents: state.documents.map(doc =>
                  doc.id === documentFile.id
                    ? { 
                        ...doc, 
                        status: 'processed' as const, 
                        progress: 1.0, 
                        error: `Preview: ${errorDetails.message}` 
                      }
                    : doc
                )
              }));
            });
        })
        .catch(originalError => {
          const error = ErrorHandler.createUserFriendlyError(originalError, 'analysis');
          const errorDetails = ErrorHandler.getErrorDetails(error);
          
          console.error('Document analysis failed:', {
            file: file.name,
            error: errorDetails,
            originalError
          });
          
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { 
                    ...doc, 
                    status: 'error' as const, 
                    error: `${errorDetails.title}: ${errorDetails.message}${errorDetails.userAction ? ' ' + errorDetails.userAction : ''}` 
                  }
                : doc
            )
          }));
        });
      })
      .catch(originalError => {
        const error = ErrorHandler.createUserFriendlyError(originalError, 'validation');
        const errorDetails = ErrorHandler.getErrorDetails(error);
        
        console.error('Document validation failed:', {
          file: file.name,
          error: errorDetails,
          originalError
        });
        
        set(state => ({
          documents: state.documents.map(doc =>
            doc.id === documentFile.id
              ? { 
                  ...doc, 
                  status: 'error' as const, 
                  error: `${errorDetails.title}: ${errorDetails.message}${errorDetails.userAction ? ' ' + errorDetails.userAction : ''}` 
                }
              : doc
          )
        }));
      });
    }

    set(state => ({
      documents: [...state.documents, ...newDocuments]
    }));
  },

  removeDocument: (id: string) => {
    set(state => {
      const docToRemove = state.documents.find(doc => doc.id === id);
      if (docToRemove?.preview) {
        // Clean up preview URL if it's a blob URL
        if (docToRemove.preview.startsWith('blob:')) {
          URL.revokeObjectURL(docToRemove.preview);
          state.urlsToCleanup.delete(docToRemove.preview);
        }
      }
      return {
        documents: state.documents.filter(doc => doc.id !== id)
      };
    });
  },

  clearDocuments: () => {
    const { urlsToCleanup } = get();
    // Clean up all blob URLs
    urlsToCleanup.forEach(url => URL.revokeObjectURL(url));
    set({ documents: [], urlsToCleanup: new Set() });
  },

  updateDocument: (id: string, updates: Partial<DocumentFile>) => {
    set(state => ({
      documents: state.documents.map(doc =>
        doc.id === id ? { ...doc, ...updates } : doc
      )
    }));
  },

  reorderDocuments: (sourceIndex: number, destinationIndex: number) => {
    set(state => {
      const documents = [...state.documents];
      const [removed] = documents.splice(sourceIndex, 1);
      documents.splice(destinationIndex, 0, removed);
      return { documents };
    });
  },

  // Merge Options
  setMergeOptions: (options: Partial<MergeOptions>) => {
    set(state => ({
      mergeOptions: { ...state.mergeOptions, ...options }
    }));
  },

  resetMergeOptions: () => {
    set({ mergeOptions: defaultMergeOptions });
  },

  // Processing
  startProcessing: async () => {
    const { documents, mergeOptions, getOutputFormat, updateProgress } = get();

    if (documents.length === 0) {
      throw new Error('No documents to process');
    }

    // Check if all documents are processed
    const unprocessedDocs = documents.filter(doc => doc.status !== 'processed');
    if (unprocessedDocs.length > 0) {
      throw new Error(`${unprocessedDocs.length} document(s) are still being analyzed. Please wait for analysis to complete.`);
    }

    // Determine output format automatically
    const { format: outputFormat, reason } = getOutputFormat();

    const job: ProcessingJob = {
      id: generateDocumentId(),
      documents,
      options: mergeOptions,
      status: 'queued',
      progress: 0,
      createdAt: new Date(),
    };

    set({ currentJob: job, isProcessing: true });

    try {
      set(state => ({
        currentJob: state.currentJob ? { ...state.currentJob, status: 'processing' } : null
      }));

      updateProgress(5); // Initial progress

      // Group documents by format for processing
      const documentsByFormat = documents.reduce((acc, doc) => {
        if (!acc[doc.format]) acc[doc.format] = [];
        acc[doc.format].push(doc);
        return acc;
      }, {} as Record<DocumentFormat, DocumentFile[]>);

      let result;
      const inputFormats = Object.keys(documentsByFormat) as DocumentFormat[];

      // Enhanced progress tracking for different processing types
      const progressCallback = (progress: number) => {
        const scaledProgress = 10 + (progress * 80); // Scale to 10-90% range
        updateProgress(scaledProgress);
      };

      if (outputFormat === 'pdf' && (inputFormats.length > 1 || (inputFormats.length === 1 && inputFormats[0] === 'docx' && documents.length > 1))) {
        // Convert all documents to PDF and merge
        result = await DocumentProcessor.convertAndMergeToPDF(
          documents.map(doc => ({ file: doc.file, format: doc.format })), 
          { ...mergeOptions, onProgress: progressCallback } as unknown as Record<string, unknown>
        );
      } else if (inputFormats.length === 1 && inputFormats[0] === outputFormat) {
        // Single format merge, no conversion needed
        const format = inputFormats[0];
        const files = documentsByFormat[format].map(doc => doc.file);
        result = await DocumentProcessor.mergeDocuments(files, format, {
          ...mergeOptions,
          onProgress: progressCallback
        } as unknown as Record<string, unknown>);
      } else {
        throw new Error(`Format conversion to ${outputFormat} not yet supported for this combination`);
      }

      if (result.success && result.data) {
        // Create download URL with proper MIME type
        const mimeTypes = {
          'pdf': 'application/pdf',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'txt': 'text/plain',
          'csv': 'text/csv',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        };

        const blob = new Blob([result.data as BlobPart], {
          type: mimeTypes[outputFormat] || 'application/octet-stream'
        });
        const resultUrl = URL.createObjectURL(blob);
        
        // Add URL to cleanup set
        const { addUrlToCleanup } = get();
        addUrlToCleanup(resultUrl);

        updateProgress(95);
        
        set(state => ({
          currentJob: state.currentJob ? {
            ...state.currentJob,
            status: 'completed',
            progress: 100,
            completedAt: new Date(),
            resultUrl,
            outputFormat,
            formatReason: reason,
          } : null,
          isProcessing: false,
        }));
        
        updateProgress(100);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (originalError) {
      const error = ErrorHandler.createUserFriendlyError(originalError, 'processing');
      const errorDetails = ErrorHandler.getErrorDetails(error);
      
      console.error('Processing error:', {
        documents: documents.map(d => ({ name: d.name, format: d.format })),
        error: errorDetails,
        originalError
      });
      
      set(state => ({
        currentJob: state.currentJob ? {
          ...state.currentJob,
          status: 'failed',
          error: `${errorDetails.title}: ${errorDetails.message}${errorDetails.userAction ? ' ' + errorDetails.userAction : ''}`,
        } : null,
        isProcessing: false,
      }));
    }
  },

  cancelProcessing: () => {
    const { currentJob } = get();
    if (currentJob?.resultUrl && currentJob.resultUrl.startsWith('blob:')) {
      URL.revokeObjectURL(currentJob.resultUrl);
      const { urlsToCleanup } = get();
      urlsToCleanup.delete(currentJob.resultUrl);
    }
    set({ currentJob: null, isProcessing: false });
  },

  updateProgress: (progress: number) => {
    set(state => ({
      currentJob: state.currentJob ? { ...state.currentJob, progress } : null
    }));
  },

  // Utilities
  getSupportedFormats: () => {
    return DocumentProcessor.getSupportedMergeFormats();
  },

  validateFiles: (files: File[]) => {
    const valid: File[] = [];
    const invalid: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      try {
        const validation = validateFile(file);
        if (validation.valid) {
          valid.push(file);
        } else {
          invalid.push(file);
          const error = ErrorHandler.createUserFriendlyError(
            validation.error || 'File validation failed',
            'validation'
          );
          const errorDetails = ErrorHandler.getErrorDetails(error);
          errors.push(`${file.name}: ${errorDetails.message}`);
        }
      } catch (originalError) {
        invalid.push(file);
        const error = ErrorHandler.createUserFriendlyError(originalError, 'validation');
        const errorDetails = ErrorHandler.getErrorDetails(error);
        errors.push(`${file.name}: ${errorDetails.message}`);
      }
    });

    return { valid, invalid, errors };
  },

  getOutputFormat: () => {
    const { documents } = get();
    
    if (documents.length === 0) {
      return { format: 'pdf' as DocumentFormat, reason: 'No documents selected' };
    }

    const formats = [...new Set(documents.map(doc => doc.format))];
    
    // If all documents are the same format
    if (formats.length === 1) {
      const format = formats[0];
      
      // Special case: Multiple DOCX files should be converted to PDF for better merging
      if (format === 'docx' && documents.length > 1) {
        return { 
          format: 'pdf' as DocumentFormat, 
          reason: 'Multiple Word documents will be merged as PDF to preserve formatting' 
        };
      }
      
      return { 
        format, 
        reason: `Single format detected: ${format.toUpperCase()}` 
      };
    }
    
    // Multiple formats - always convert to PDF
    return { 
      format: 'pdf' as DocumentFormat, 
      reason: 'Mixed document formats will be merged as PDF for compatibility' 
    };
  },

  // URL cleanup utilities
  cleanupUrls: () => {
    const { urlsToCleanup } = get();
    urlsToCleanup.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke URL:', url, error);
      }
    });
    set(state => ({ ...state, urlsToCleanup: new Set() }));
  },

  addUrlToCleanup: (url: string) => {
    set(state => {
      const newCleanupSet = new Set(state.urlsToCleanup);
      newCleanupSet.add(url);
      return { ...state, urlsToCleanup: newCleanupSet };
    });
  },
}));

// Cleanup URLs when the page is unloaded
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    const store = useDocumentStore.getState();
    store.cleanupUrls();
  });
}