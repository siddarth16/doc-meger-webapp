import { create } from 'zustand';
import { DocumentFile, MergeOptions, ProcessingJob, DocumentFormat } from '@/app/types';
import { 
  validateFile, 
  getDocumentFormat, 
  generateDocumentId, 
  MAX_FILES_BULK 
} from '@/app/lib/utils/file-utils';
import { DocumentProcessor } from '@/app/lib/document-processors';

interface DocumentStore {
  // State
  documents: DocumentFile[];
  mergeOptions: MergeOptions;
  currentJob: ProcessingJob | null;
  isProcessing: boolean;

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

      const documentFile: DocumentFile = {
        id: generateDocumentId(),
        file,
        name: file.name,
        size: file.size,
        format,
        status: 'pending',
      };

      newDocuments.push(documentFile);

      // Analyze document in background
      DocumentProcessor.analyzeDocument(file, format)
        .then(metadata => {
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { ...doc, metadata, status: 'processed' as const }
                : doc
            )
          }));
        })
        .catch(error => {
          console.error('Document analysis failed:', error);
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { ...doc, status: 'error' as const, error: error.message }
                : doc
            )
          }));
        });

      // Generate preview
      DocumentProcessor.generatePreview(file, format)
        .then(preview => {
          set(state => ({
            documents: state.documents.map(doc =>
              doc.id === documentFile.id
                ? { ...doc, preview }
                : doc
            )
          }));
        })
        .catch(error => {
          console.error('Preview generation failed:', error);
        });
    }

    set(state => ({
      documents: [...state.documents, ...newDocuments]
    }));
  },

  removeDocument: (id: string) => {
    set(state => ({
      documents: state.documents.filter(doc => doc.id !== id)
    }));
  },

  clearDocuments: () => {
    set({ documents: [] });
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
    const { documents, mergeOptions, getOutputFormat } = get();

    if (documents.length === 0) {
      throw new Error('No documents to process');
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

      // Group documents by format for processing
      const documentsByFormat = documents.reduce((acc, doc) => {
        if (!acc[doc.format]) acc[doc.format] = [];
        acc[doc.format].push(doc);
        return acc;
      }, {} as Record<DocumentFormat, DocumentFile[]>);

      let result;
      const inputFormats = Object.keys(documentsByFormat) as DocumentFormat[];

      if (outputFormat === 'pdf' && (inputFormats.length > 1 || (inputFormats.length === 1 && inputFormats[0] === 'docx' && documents.length > 1))) {
        // Convert all documents to PDF and merge
        result = await DocumentProcessor.convertAndMergeToPDF(
          documents.map(doc => ({ file: doc.file, format: doc.format })), 
          mergeOptions as unknown as Record<string, unknown>
        );
      } else if (inputFormats.length === 1 && inputFormats[0] === outputFormat) {
        // Single format merge, no conversion needed
        const format = inputFormats[0];
        const files = documentsByFormat[format].map(doc => doc.file);
        result = await DocumentProcessor.mergeDocuments(files, format, mergeOptions as unknown as Record<string, unknown>);
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
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      set(state => ({
        currentJob: state.currentJob ? {
          ...state.currentJob,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        } : null,
        isProcessing: false,
      }));
    }
  },

  cancelProcessing: () => {
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
      const validation = validateFile(file);
      if (validation.valid) {
        valid.push(file);
      } else {
        invalid.push(file);
        errors.push(`${file.name}: ${validation.error}`);
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
}));