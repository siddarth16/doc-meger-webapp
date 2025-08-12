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
          const preserveMetadata = options.preserveMetadata === true;
          const includeBookmarks = options.preserveFormatting === true;
          return await PDFProcessor.mergePDFs(buffers, {
            preserveMetadata,
            includeBookmarks,
          });
        }
        case 'xlsx': {
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          return await ExcelProcessor.mergeExcelFiles(buffers, options);
        }
        case 'docx': {
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          const preserveFormatting = options.preserveFormatting === true;
          const pageBreaks = options.pageBreaks === true;
          const includeHeaders = options.includeHeaders === true;
          const includeFooters = options.includeFooters === true;
          const preserveMetadata = options.preserveMetadata === true;
          
          return await WordProcessor.mergeWordDocuments(buffers, {
            preserveFormatting,
            pageBreaks,
            includeHeaders,
            includeFooters,
            preserveMetadata,
          });
        }
        case 'txt': {
          const texts = await Promise.all(files.map(file => file.text()));
          const pageBreaks = options.pageBreaks === true;
          const includeHeaders = options.includeHeaders === true;
          const preserveFormatting = options.preserveFormatting === true;
          
          return await TextProcessor.mergeTextFiles(texts, {
            separator: pageBreaks ? '\n\n---PAGE BREAK---\n\n' : '\n\n---\n\n',
            includeHeaders,
            preserveFormatting,
          });
        }
        case 'csv': {
          const texts = await Promise.all(files.map(file => file.text()));
          const includeHeaders = options.includeHeaders !== false; // Default true for CSV
          
          return await CSVProcessor.mergeCSVFiles(texts, {
            includeHeaders,
            skipDuplicateHeaders: true,
          });
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

  static async convertAndMergeToPDF(
    documents: { file: File; format: DocumentFormat }[],
    options: Record<string, unknown> = {}
  ): Promise<ProcessorResult> {
    try {
      const pdfBuffers: ArrayBuffer[] = [];
      
      for (const doc of documents) {
        if (doc.format === 'pdf') {
          // Already PDF, just add the buffer
          const buffer = await fileToBuffer(doc.file);
          pdfBuffers.push(buffer);
        } else if (doc.format === 'docx') {
          // Convert DOCX to PDF-like content (enhanced approach)
          const pdfBuffer = await this.convertDocxToPDF(doc.file);
          pdfBuffers.push(pdfBuffer);
        } else if (doc.format === 'txt') {
          // Convert text to PDF
          const text = await doc.file.text();
          const pdfBuffer = await this.convertTextToPDF(text);
          pdfBuffers.push(pdfBuffer);
        } else {
          // For other formats, throw error for now
          throw new Error(`Conversion from ${doc.format} to PDF not yet supported`);
        }
      }
      
      // Merge all PDF buffers
      return await PDFProcessor.mergePDFs(pdfBuffers, {
        preserveMetadata: options.preserveMetadata === true,
        includeBookmarks: options.preserveFormatting === true,
      });
      
    } catch (error) {
      console.error('Convert and merge to PDF error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  static async convertDocxToPDF(file: File): Promise<ArrayBuffer> {
    try {
      // Extract text and basic formatting from DOCX
      const buffer = await fileToBuffer(file);
      const htmlContent = await WordProcessor.extractHTML(buffer);
      
      // Convert HTML to PDF using PDF-lib
      // This is a simplified approach - for better results, we'd need a proper HTML-to-PDF library
      const text = htmlContent
        .replace(/<[^>]+>/g, '\n')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
        
      return await this.convertTextToPDF(text);
    } catch (error) {
      console.error('DOCX to PDF conversion error:', error);
      throw error;
    }
  }

  static async convertTextToPDF(text: string): Promise<ArrayBuffer> {
    try {
      // Create a simple PDF from text using PDF-lib
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const lines = text.split('\n');
      const linesPerPage = 50;
      const lineHeight = 12;
      const margin = 50;
      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      
      for (let i = 0; i < lines.length; i += linesPerPage) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const pageLines = lines.slice(i, i + linesPerPage);
        
        pageLines.forEach((line, index) => {
          page.drawText(line, {
            x: margin,
            y: pageHeight - margin - (index * lineHeight),
            size: 10,
            font,
            color: rgb(0, 0, 0),
          });
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      return pdfBytes.buffer as ArrayBuffer;
    } catch (error) {
      console.error('Text to PDF conversion error:', error);
      throw error;
    }
  }

  static getSupportedMergeFormats(): DocumentFormat[] {
    return ['pdf', 'docx', 'xlsx', 'txt', 'csv'];
  }

  static getSupportedConversions(): Record<DocumentFormat, DocumentFormat[]> {
    return {
      pdf: [],
      docx: ['txt', 'pdf'],
      xlsx: ['csv'],
      pptx: [],
      txt: ['pdf'],
      csv: []
    };
  }
}

export * from './pdf-processor';
export * from './excel-processor';
export * from './word-processor';
export * from './text-processor';