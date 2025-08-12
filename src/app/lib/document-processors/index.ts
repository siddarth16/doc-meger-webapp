import { DocumentFormat, DocumentMetadata, ProcessorResult } from '@/app/types';
import { PDFProcessor } from './pdf-processor';
import { ExcelProcessor } from './excel-processor';
import { WordProcessor } from './word-processor';
import { TextProcessor, CSVProcessor } from './text-processor';
import { fileToBuffer } from '../utils/file-utils';

export class DocumentProcessor {
  static async analyzeDocument(file: File, format: DocumentFormat): Promise<DocumentMetadata> {
    try {
      switch (format) {
        case 'pdf': {
          const buffer = await fileToBuffer(file);
          return await PDFProcessor.analyzeDocument(buffer);
        }
        case 'xlsx': {
          const buffer = await fileToBuffer(file);
          return await ExcelProcessor.analyzeDocument(buffer);
        }
        case 'docx': {
          const buffer = await fileToBuffer(file);
          return await WordProcessor.analyzeDocument(buffer);
        }
        case 'txt': {
          const text = await file.text();
          return await TextProcessor.analyzeDocument(text);
        }
        case 'csv': {
          const text = await file.text();
          return await TextProcessor.analyzeDocument(text);
        }
        case 'pptx': {
          // Basic analysis for PowerPoint - would need a specialized library for full support
          return {
            title: file.name,
            pageCount: 1, // Placeholder
          };
        }
        default:
          throw new Error(`Unsupported format for analysis: ${format}`);
      }
    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        title: file.name,
      };
    }
  }

  static async generatePreview(file: File, format: DocumentFormat): Promise<string> {
    try {
      switch (format) {
        case 'pdf': {
          const buffer = await fileToBuffer(file);
          return await PDFProcessor.generatePreview(buffer);
        }
        case 'xlsx': {
          const buffer = await fileToBuffer(file);
          return await ExcelProcessor.generatePreview(buffer);
        }
        case 'docx': {
          const buffer = await fileToBuffer(file);
          return await WordProcessor.generatePreview(buffer);
        }
        case 'txt': {
          const text = await file.text();
          return await TextProcessor.generatePreview(text);
        }
        case 'csv': {
          const text = await file.text();
          return await CSVProcessor.generatePreview(text);
        }
        case 'pptx': {
          return `PowerPoint Presentation\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nFull PowerPoint processing requires additional libraries.`;
        }
        default:
          return `${(format as string).toUpperCase()} Document\nSize: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      return `${(format as string).toUpperCase()} Document\nPreview not available`;
    }
  }

  static async mergeDocuments(
    files: File[],
    format: DocumentFormat,
    options: Record<string, unknown> = {}
  ): Promise<ProcessorResult> {
    try {
      switch (format) {
        case 'pdf': {
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          return await PDFProcessor.mergePDFs(buffers, options);
        }
        case 'xlsx': {
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          return await ExcelProcessor.mergeExcelFiles(buffers, options);
        }
        case 'docx': {
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          return await WordProcessor.mergeWordDocuments(buffers, options);
        }
        case 'txt': {
          const texts = await Promise.all(files.map(file => file.text()));
          return await TextProcessor.mergeTextFiles(texts, options);
        }
        case 'csv': {
          const texts = await Promise.all(files.map(file => file.text()));
          return await CSVProcessor.mergeCSVFiles(texts, options);
        }
        case 'pptx': {
          return {
            success: false,
            error: 'PowerPoint merging requires additional libraries. Please convert to PDF first.'
          };
        }
        default:
          return {
            success: false,
            error: `Merging not supported for format: ${format}`
          };
      }
    } catch (error) {
      console.error('Document merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown merge error'
      };
    }
  }

  static async convertFormat(
    file: File,
    fromFormat: DocumentFormat,
    toFormat: DocumentFormat
  ): Promise<ProcessorResult> {
    try {
      // Basic conversion support - would be expanded in production
      if (fromFormat === 'docx' && toFormat === 'txt') {
        const buffer = await fileToBuffer(file);
        const text = await WordProcessor.extractText(buffer);
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        
        return {
          success: true,
          data: data.buffer,
          metadata: { title: file.name.replace('.docx', '.txt') }
        };
      }

      if (fromFormat === 'xlsx' && toFormat === 'csv') {
        const buffer = await fileToBuffer(file);
        const csv = await ExcelProcessor.convertToCSV(buffer);
        const encoder = new TextEncoder();
        const data = encoder.encode(csv);
        
        return {
          success: true,
          data: data.buffer,
          metadata: { title: file.name.replace('.xlsx', '.csv') }
        };
      }

      return {
        success: false,
        error: `Conversion from ${fromFormat} to ${toFormat} not supported`
      };
    } catch (error) {
      console.error('Format conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  static getSupportedMergeFormats(): DocumentFormat[] {
    return ['pdf', 'docx', 'xlsx', 'txt', 'csv'];
  }

  static getSupportedConversions(): Record<DocumentFormat, DocumentFormat[]> {
    return {
      pdf: [],
      docx: ['txt'],
      xlsx: ['csv'],
      pptx: [],
      txt: [],
      csv: []
    };
  }
}

export * from './pdf-processor';
export * from './excel-processor';
export * from './word-processor';
export * from './text-processor';