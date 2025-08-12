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
      
      // Better HTML to text conversion preserving more structure
      let text = htmlContent
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
        text = rawText || text;
      }
        
      return await this.convertTextToPDF(text);
    } catch (error) {
      console.error('DOCX to PDF conversion error:', error);
      // Fallback to basic text extraction
      try {
        const buffer = await fileToBuffer(file);
        const rawText = await WordProcessor.extractText(buffer);
        return await this.convertTextToPDF(rawText);
      } catch (fallbackError) {
        console.error('Fallback DOCX extraction failed:', fallbackError);
        throw error;
      }
    }
  }

  static async convertTextToPDF(text: string): Promise<ArrayBuffer> {
    try {
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
      
      const lines = text.split('\n');
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

  static formatCSVForPDF(csvText: string): string {
    const lines = csvText.split('\n');
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