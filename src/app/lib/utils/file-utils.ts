import { DocumentFormat } from '@/app/types';

export const SUPPORTED_FORMATS: Record<DocumentFormat, string[]> = {
  pdf: ['application/pdf'],
  docx: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ],
  xlsx: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ],
  pptx: [
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint'
  ],
  txt: ['text/plain'],
  csv: ['text/csv', 'application/csv']
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_FILES_BULK = 100;

export function getDocumentFormat(file: File): DocumentFormat | null {
  const mimeType = file.type;
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Check by MIME type first
  for (const [format, mimeTypes] of Object.entries(SUPPORTED_FORMATS)) {
    if (mimeTypes.includes(mimeType)) {
      return format as DocumentFormat;
    }
  }

  // Fallback to extension
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'docx': case 'doc': return 'docx';
    case 'xlsx': case 'xls': return 'xlsx';
    case 'pptx': case 'ppt': return 'pptx';
    case 'txt': return 'txt';
    case 'csv': return 'csv';
    default: return null;
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
    };
  }

  const format = getDocumentFormat(file);
  if (!format) {
    return {
      valid: false,
      error: 'Unsupported file format'
    };
  }

  return { valid: true };
}

export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(format: DocumentFormat): string {
  const extensions: Record<DocumentFormat, string> = {
    pdf: '.pdf',
    docx: '.docx',
    xlsx: '.xlsx',
    pptx: '.pptx',
    txt: '.txt',
    csv: '.csv'
  };
  
  return extensions[format];
}

export async function fileToBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}