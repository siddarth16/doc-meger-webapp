import { DocumentFormat, DocumentMetadata, ProcessorResult } from '@/app/types';
import { PDFProcessor } from './pdf-processor';
import { ExcelProcessor } from './excel-processor';
import { WordProcessor } from './word-processor';
import { TextProcessor, CSVProcessor } from './text-processor';
import { PowerPointProcessor } from './powerpoint-processor';
import { fileToBuffer } from '../utils/file-utils';
import { ChunkProcessor, FileSizeUtils } from '../utils/chunk-processor';

export class DocumentProcessor {
  static async analyzeDocument(
    file: File, 
    format: DocumentFormat,
    options: { onProgress?: (progress: number) => void } = {}
  ): Promise<DocumentMetadata> {
    try {
      options.onProgress?.(0.1);
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
          const buffer = await fileToBuffer(file);
          options.onProgress?.(0.5);
          const metadata = await PowerPointProcessor.analyzeDocument(buffer);
          options.onProgress?.(1.0);
          return metadata;
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
          const buffer = await fileToBuffer(file);
          return await PowerPointProcessor.generatePreview(buffer);
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
          const buffers = await Promise.all(files.map(file => fileToBuffer(file)));
          return await PowerPointProcessor.mergePowerPointPresentations(buffers);
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
    options: Record<string, unknown> & { onProgress?: (progress: number) => void } = {}
  ): Promise<ProcessorResult> {
    try {
      const pdfBuffers: ArrayBuffer[] = [];
      const totalFiles = documents.length;
      let processedFiles = 0;
      
      for (const doc of documents) {
        options.onProgress?.((processedFiles / totalFiles) * 0.8); // Reserve 20% for final merge
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
          const sanitizedText = this.sanitizeText(text);
          const pdfBuffer = await this.convertTextToPDF(sanitizedText);
          pdfBuffers.push(pdfBuffer);
        } else if (doc.format === 'csv') {
          // Convert CSV to PDF
          const text = await doc.file.text();
          const formattedText = this.formatCSVForPDF(text);
          const pdfBuffer = await this.convertTextToPDF(formattedText);
          pdfBuffers.push(pdfBuffer);
        } else if (doc.format === 'xlsx') {
          // Convert Excel to PDF (basic text representation)
          const buffer = await fileToBuffer(doc.file);
          const csvData = await ExcelProcessor.convertToCSV(buffer);
          const formattedText = this.formatCSVForPDF(csvData);
          const pdfBuffer = await this.convertTextToPDF(formattedText);
          pdfBuffers.push(pdfBuffer);
        } else if (doc.format === 'pptx') {
          // Convert PowerPoint to PDF via text extraction
          const buffer = await fileToBuffer(doc.file);
          const text = await PowerPointProcessor.extractText(buffer);
          const sanitizedText = this.sanitizeText(text);
          const pdfBuffer = await this.convertTextToPDF(sanitizedText);
          pdfBuffers.push(pdfBuffer);
        } else {
          // For other formats, throw error for now
          throw new Error(`Conversion from ${doc.format} to PDF not yet supported`);
        }
        
        processedFiles++;
      }
      
      // Merge all PDF buffers
      options.onProgress?.(0.9);
      const result = await PDFProcessor.mergePDFs(pdfBuffers, {
        preserveMetadata: options.preserveMetadata === true,
        includeBookmarks: options.preserveFormatting === true,
      });
      options.onProgress?.(1.0);
      return result;
      
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
      
      // Sanitize the HTML content first
      const sanitizedHTML = this.sanitizeText(htmlContent);
      
      // Better HTML to text conversion preserving more structure
      let text = sanitizedHTML
        // Preserve paragraph breaks
        .replace(/<\/p>/g, '\n\n')
        .replace(/<p[^>]*>/g, '')
        // Preserve line breaks
        .replace(/<br\s*\/?>/g, '\n')
        // Preserve headings with better formatting
        .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '\n\n$1\n\n')
        // Preserve lists
        .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
        .replace(/<\/ul>|<\/ol>/g, '\n')
        .replace(/<ul[^>]*>|<ol[^>]*>/g, '')
        // Preserve bold formatting indicators
        .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '$2')
        // Preserve italic formatting indicators  
        .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '$2')
        // Clean up remaining HTML tags
        .replace(/<[^>]+>/g, '')
        // Clean up HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Clean up excessive whitespace but preserve intentional spacing
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
        
      // If the extracted text is too short, fall back to raw text extraction
      if (text.length < 100) {
        const rawText = await WordProcessor.extractText(buffer);
        text = this.sanitizeText(rawText) || text;
      } else {
        // Always sanitize the final text
        text = this.sanitizeText(text);
      }
        
      return await this.convertTextToPDF(text);
    } catch (error) {
      console.error('DOCX to PDF conversion error:', error);
      // Fallback to basic text extraction
      try {
        const buffer = await fileToBuffer(file);
        const rawText = await WordProcessor.extractText(buffer);
        const sanitizedText = this.sanitizeText(rawText);
        return await this.convertTextToPDF(sanitizedText);
      } catch (fallbackError) {
        console.error('Fallback DOCX extraction failed:', fallbackError);
        throw error;
      }
    }
  }

  static async convertTextToPDF(text: string): Promise<ArrayBuffer> {
    try {
      // Sanitize the input text first
      const sanitizedText = this.sanitizeText(text);
      
      // Create a better formatted PDF from text using PDF-lib
      const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
      
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      // Better page dimensions and margins for script formatting
      const pageWidth = 612; // US Letter width in points (8.5")
      const pageHeight = 792; // US Letter height in points (11")
      const leftMargin = 72; // 1" margin
      const rightMargin = 72; // 1" margin  
      const topMargin = 72; // 1" margin
      const bottomMargin = 72; // 1" margin
      const contentWidth = pageWidth - leftMargin - rightMargin;
      
      const fontSize = 12;
      const lineHeight = fontSize * 1.4; // 1.4x line spacing for readability
      const linesPerPage = Math.floor((pageHeight - topMargin - bottomMargin) / lineHeight);
      
      const lines = sanitizedText.split('\n');
      const wrappedLines: string[] = [];
      
      // Better text wrapping to prevent cutoff
      lines.forEach(line => {
        if (!line.trim()) {
          wrappedLines.push('');
          return;
        }
        
        const words = line.split(' ');
        let currentLine = '';
        
        words.forEach(word => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);
          
          if (textWidth <= contentWidth) {
            currentLine = testLine;
          } else {
            if (currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              // Word is too long, split it
              wrappedLines.push(word.substring(0, 50) + '-');
              currentLine = word.substring(50);
            }
          }
        });
        
        if (currentLine) {
          wrappedLines.push(currentLine);
        }
      });
      
      // Create pages with proper formatting
      for (let i = 0; i < wrappedLines.length; i += linesPerPage) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const pageLines = wrappedLines.slice(i, i + linesPerPage);
        
        pageLines.forEach((line, index) => {
          const yPosition = pageHeight - topMargin - (index * lineHeight);
          
          // Basic formatting detection
          const isTitle = line.trim().toUpperCase() === line.trim() && line.trim().length > 0 && line.trim().length < 50;
          const currentFont = isTitle ? boldFont : font;
          const currentFontSize = isTitle ? fontSize + 2 : fontSize;
          
          page.drawText(line, {
            x: leftMargin,
            y: yPosition,
            size: currentFontSize,
            font: currentFont,
            color: rgb(0, 0, 0),
          });
        });
        
        // Add page numbers
        const pageNumber = Math.floor(i / linesPerPage) + 1;
        const totalPages = Math.ceil(wrappedLines.length / linesPerPage);
        page.drawText(`Page ${pageNumber} of ${totalPages}`, {
          x: pageWidth - rightMargin - 80,
          y: bottomMargin / 2,
          size: 10,
          font,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
      
      const pdfBytes = await pdfDoc.save();
      return pdfBytes.buffer as ArrayBuffer;
    } catch (error) {
      console.error('Text to PDF conversion error:', error);
      throw error;
    }
  }

  static sanitizeText(text: string): string {
    // Remove problematic Unicode characters that can't be encoded in WinAnsi
    return text
      // Remove zero-width characters
      .replace(/\u200B/g, '') // Zero-width space
      .replace(/\u200C/g, '') // Zero-width non-joiner
      .replace(/\u200D/g, '') // Zero-width joiner
      .replace(/\u2060/g, '') // Word joiner
      .replace(/\uFEFF/g, '') // Zero-width no-break space (BOM)
      // Remove other problematic characters
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Control characters
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
  }

  static formatCSVForPDF(csvText: string): string {
    const sanitizedText = this.sanitizeText(csvText);
    const lines = sanitizedText.split('\n');
    const formattedLines: string[] = [];
    
    lines.forEach((line, index) => {
      if (line.trim()) {
        // Convert CSV to a more readable table format
        const cells = line.split(',').map(cell => cell.trim().replace(/"/g, ''));
        const formattedLine = cells.join(' | ');
        formattedLines.push(formattedLine);
        
        // Add a separator line after the header
        if (index === 0 && cells.length > 1) {
          formattedLines.push('-'.repeat(formattedLine.length));
        }
      }
    });
    
    return formattedLines.join('\n');
  }

  static getSupportedMergeFormats(): DocumentFormat[] {
    return ['pdf', 'docx', 'xlsx', 'txt', 'csv', 'pptx'];
  }

  static getSupportedConversions(): Record<DocumentFormat, DocumentFormat[]> {
    return {
      pdf: [],
      docx: ['txt', 'pdf'],
      xlsx: ['csv', 'pdf'],
      pptx: ['txt', 'pdf'],
      txt: ['pdf'],
      csv: ['pdf']
    };
  }

  /**
   * Validate document structure before processing
   */
  static async validateDocument(
    file: File, 
    format: DocumentFormat,
    options: { onProgress?: (progress: number) => void } = {}
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      const buffer = await fileToBuffer(file);
      options.onProgress?.(0.3);
      
      switch (format) {
        case 'pdf':
          return await PDFProcessor.validatePDFStructure(buffer);
        case 'pptx':
          return await PowerPointProcessor.validatePowerPointStructure(buffer);
        case 'docx':
        case 'xlsx':
        case 'txt':
        case 'csv':
          // Basic validation - check if file is not empty and readable
          if (buffer.byteLength === 0) {
            return { valid: false, error: 'File is empty' };
          }
          return { valid: true };
        default:
          return { valid: false, error: `Unsupported format: ${format}` };
      }
    } catch (error) {
      return {
        valid: false,
        error: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      options.onProgress?.(1.0);
    }
  }

  /**
   * Get recommended processing approach based on file size and format
   */
  static getProcessingRecommendation(file: File): {
    useChunkedProcessing: boolean;
    estimatedTime: number;
    memoryImpact: 'low' | 'medium' | 'high';
    warnings: string[];
  } {
    const warnings: string[] = [];
    const isLargeFile = FileSizeUtils.isLargeFile(file, 10);
    const isVeryLargeFile = FileSizeUtils.isLargeFile(file, 50);
    
    if (isVeryLargeFile) {
      warnings.push('Very large file detected. Processing may take several minutes.');
      warnings.push('Consider splitting the file or using a more powerful device.');
    } else if (isLargeFile) {
      warnings.push('Large file detected. Processing may take extra time.');
    }

    return {
      useChunkedProcessing: isLargeFile,
      estimatedTime: ChunkProcessor.estimateProcessingTime(file),
      memoryImpact: isVeryLargeFile ? 'high' : isLargeFile ? 'medium' : 'low',
      warnings
    };
  }
}

export * from './pdf-processor';
export * from './excel-processor';
export * from './word-processor';
export * from './text-processor';
export * from './powerpoint-processor';