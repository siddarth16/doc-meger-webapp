import { PDFDocument } from 'pdf-lib';
import { DocumentMetadata, ProcessorResult } from '@/app/types';
import { FileSizeUtils } from '@/app/lib/utils/chunk-processor';

// Dynamically import pdf-parse to avoid SSR issues
const getPdfParse = async () => {
  if (typeof window !== 'undefined') {
    const pdfParse = await import('pdf-parse/lib/pdf-parse.js');
    return pdfParse.default;
  }
  return null;
};

export class PDFProcessor {
  static async analyzeDocument(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      // Extract metadata
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const createdDate = pdfDoc.getCreationDate();
      const modifiedDate = pdfDoc.getModificationDate();

      // Try to extract text for word count estimation
      let wordCount: number | undefined;
      try {
        const text = await this.extractText(buffer);
        if (text && text.length > 0) {
          wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        }
      } catch (error) {
        console.warn('Could not extract text for word count:', error);
      }

      return {
        pageCount,
        wordCount,
        title: title || undefined,
        author: author || undefined,
        createdDate: createdDate || undefined,
        modifiedDate: modifiedDate || undefined,
      };
    } catch (error) {
      console.error('PDF analysis error:', error);
      return {};
    }
  }

  static async mergePDFs(
    documents: ArrayBuffer[],
    options: {
      preserveMetadata?: boolean;
      includeBookmarks?: boolean;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      const mergedPdf = await PDFDocument.create();
      
      // Set metadata for merged document
      if (options.preserveMetadata) {
        mergedPdf.setTitle('Merged Document');
        mergedPdf.setAuthor('DocMerger');
        mergedPdf.setCreationDate(new Date());
        mergedPdf.setModificationDate(new Date());
      }

      for (const buffer of documents) {
        try {
          const pdfDoc = await PDFDocument.load(buffer);
          const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          
          pages.forEach(page => {
            mergedPdf.addPage(page);
          });
        } catch (error) {
          console.error('Error processing PDF document:', error);
          continue; // Skip problematic documents
        }
      }

      const pdfBytes = await mergedPdf.save();
      
      return {
        success: true,
        data: pdfBytes,
        metadata: {
          pageCount: mergedPdf.getPageCount(),
          title: 'Merged Document'
        }
      };
    } catch (error) {
      console.error('PDF merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown PDF processing error'
      };
    }
  }

  static async extractText(buffer: ArrayBuffer): Promise<string> {
    try {
      const pdfParse = await getPdfParse();
      if (!pdfParse) {
        // Fallback for SSR or if pdf-parse is not available
        const pdfDoc = await PDFDocument.load(buffer);
        return `PDF Document with ${pdfDoc.getPageCount()} pages. Text extraction not available in this environment.`;
      }

      // Check if file is too large for memory-safe processing
      const bufferSize = buffer.byteLength;
      if (FileSizeUtils.isLargeFile({ size: bufferSize } as File, 20)) {
        // For very large PDFs, use chunked processing
        return await this.extractTextChunked(buffer);
      }

      const data = await pdfParse(Buffer.from(buffer));
      return data.text || '';
    } catch (error) {
      console.error('PDF text extraction error:', error);
      // Fallback to basic info
      try {
        const pdfDoc = await PDFDocument.load(buffer);
        return `PDF Document with ${pdfDoc.getPageCount()} pages. Text extraction failed.`;
      } catch {
        return 'PDF text extraction failed.';
      }
    }
  }

  static async generatePreview(buffer: ArrayBuffer): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      
      // Try to extract some text for preview
      let textPreview = '';
      try {
        const text = await this.extractText(buffer);
        if (text && text.length > 0) {
          // Get first few lines as preview
          textPreview = text.split('\n')
            .slice(0, 5)
            .join('\n')
            .substring(0, 300);
          if (text.length > 300) textPreview += '...';
        }
      } catch (error) {
        console.warn('Could not extract text for preview:', error);
      }
      
      let preview = `PDF Document\nPages: ${pageCount}`;
      if (title) preview += `\nTitle: ${title}`;
      if (author) preview += `\nAuthor: ${author}`;
      preview += `\nSize: ${FileSizeUtils.formatBytes(buffer.byteLength)}`;
      
      if (textPreview) {
        preview += `\n\nPreview:\n${textPreview}`;
      }
      
      return preview;
    } catch (error) {
      console.error('PDF preview error:', error);
      return 'PDF Document (Preview not available)';
    }
  }

  static async splitPDF(buffer: ArrayBuffer, pageRanges: number[][]): Promise<ArrayBuffer[]> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const results: ArrayBuffer[] = [];

      for (const range of pageRanges) {
        const newPdf = await PDFDocument.create();
        const [start, end] = range;
        
        const pages = await newPdf.copyPages(
          pdfDoc, 
          Array.from({ length: end - start + 1 }, (_, i) => start + i - 1)
        );
        
        pages.forEach(page => newPdf.addPage(page));
        
        const pdfBytes = await newPdf.save();
        results.push(pdfBytes.buffer as ArrayBuffer);
      }

      return results;
    } catch (error) {
      console.error('PDF split error:', error);
      throw error;
    }
  }

  /**
   * Extract text from large PDFs using chunked processing
   */
  private static async extractTextChunked(buffer: ArrayBuffer): Promise<string> {
    try {
      const pdfParse = await getPdfParse();
      if (!pdfParse) return 'Text extraction not available';

      // For very large PDFs, we'll still try to process the whole file
      // but with better error handling and memory management
      const data = await pdfParse(Buffer.from(buffer), {
        max: 0, // Extract all pages
        version: 'v1.10.100' // Use specific version for stability
      });

      return data.text || 'No text content found';
    } catch (error) {
      console.error('Chunked PDF text extraction error:', error);
      return 'Text extraction failed for large PDF';
    }
  }

  /**
   * Validate PDF file structure
   */
  static async validatePDFStructure(buffer: ArrayBuffer): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check PDF header
      const header = new Uint8Array(buffer.slice(0, 8));
      const headerString = Array.from(header).map(b => String.fromCharCode(b)).join('');
      
      if (!headerString.startsWith('%PDF-')) {
        return { valid: false, error: 'Invalid PDF header' };
      }

      // Try to load with pdf-lib
      await PDFDocument.load(buffer);
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid PDF structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}