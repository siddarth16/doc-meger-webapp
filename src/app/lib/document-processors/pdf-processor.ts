import { PDFDocument } from 'pdf-lib';
import { DocumentMetadata, ProcessorResult } from '@/app/types';

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

      return {
        pageCount,
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
      const pdfDoc = await PDFDocument.load(buffer);
      // Note: pdf-lib doesn't have built-in text extraction
      // For a production app, you'd use pdf2pic + tesseract.js or pdf-parse
      return `PDF with ${pdfDoc.getPageCount()} pages`;
    } catch (error) {
      console.error('PDF text extraction error:', error);
      return '';
    }
  }

  static async generatePreview(buffer: ArrayBuffer): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.load(buffer);
      const pageCount = pdfDoc.getPageCount();
      
      // Return a text-based preview for now
      // In production, you'd use pdf2pic or similar to generate thumbnails
      return `PDF Document\nPages: ${pageCount}`;
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
}