export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'csv';

export interface DocumentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  format: DocumentFormat;
  status: 'pending' | 'processing' | 'processed' | 'error';
  preview?: string;
  metadata?: DocumentMetadata;
  error?: string;
}

export interface DocumentMetadata {
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
  wordCount?: number;
  author?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  title?: string;
}

export type MergeMode = 'sequential' | 'smart' | 'custom';

export interface MergeOptions {
  mode: MergeMode;
  outputFormat: DocumentFormat;
  outputName: string;
  preserveMetadata: boolean;
  quality: 'low' | 'medium' | 'high';
  customOrder?: string[];
  pageBreaks?: boolean;
  includeHeaders?: boolean;
  includeFooters?: boolean;
}

export interface ProcessingJob {
  id: string;
  documents: DocumentFile[];
  options: MergeOptions;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  resultUrl?: string;
  error?: string;
}

export interface ProcessorResult {
  success: boolean;
  data?: Uint8Array | ArrayBuffer;
  metadata?: DocumentMetadata;
  error?: string;
}

export interface UploadProgress {
  documentId: string;
  progress: number;
  stage: 'uploading' | 'analyzing' | 'processing' | 'complete';
}