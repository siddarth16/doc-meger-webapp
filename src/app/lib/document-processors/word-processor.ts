import { Document, Packer, Paragraph, TextRun } from 'docx';
import mammoth from 'mammoth';
import { DocumentMetadata, ProcessorResult } from '@/app/types';

export class WordProcessor {
  static async analyzeDocument(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    try {
      // Use mammoth to extract basic info
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      const text = result.value;
      
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const pageCount = Math.ceil(wordCount / 250); // Rough estimate: 250 words per page

      return {
        pageCount,
        wordCount,
        title: 'Word Document', // mammoth doesn't extract metadata easily
      };
    } catch (error) {
      console.error('Word analysis error:', error);
      return {};
    }
  }

  static async mergeWordDocuments(
    documents: ArrayBuffer[],
    options: {
      preserveMetadata?: boolean;
      pageBreaks?: boolean;
      includeHeaders?: boolean;
      includeFooters?: boolean;
      preserveFormatting?: boolean;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      if (options.preserveFormatting) {
        // For now, if preserveFormatting is requested, recommend PDF conversion
        return {
          success: false,
          error: 'To preserve original formatting, please convert your DOCX files to PDF first and merge them as PDFs. Direct DOCX merging with full formatting preservation is not yet supported.'
        };
      }

      const paragraphs: Paragraph[] = [];
      let totalWordCount = 0;

      for (let i = 0; i < documents.length; i++) {
        const buffer = documents[i];
        
        try {
          // Try to extract with better formatting preservation
          const htmlResult = await mammoth.convertToHtml({ arrayBuffer: buffer });
          const html = htmlResult.value;
          
          // If HTML extraction is successful, try to preserve some formatting
          if (html && html.trim()) {
            if (i > 0 && options.pageBreaks) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: '', break: 1 })],
                  pageBreakBefore: true,
                })
              );
            }

            // Add document header if requested
            if (options.includeHeaders) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: `=== Document ${i + 1} ===`, 
                      bold: true,
                      size: 28 // 14pt
                    })
                  ],
                  spacing: { after: 200 },
                })
              );
            }

            // Parse HTML and convert to paragraphs (simplified approach)
            const textContent = html
              .replace(/<\/p>/g, '\n\n')
              .replace(/<br\s*\/?>/g, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>');

            const lines = textContent.split('\n').filter(line => line.trim());
            
            lines.forEach(line => {
              if (line.trim()) {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun(line.trim())],
                    spacing: { after: 120 }, // Small spacing between lines
                  })
                );
              }
            });

            totalWordCount += textContent.split(/\s+/).filter(word => word.length > 0).length;
          } else {
            // Fallback to plain text extraction
            const textResult = await mammoth.extractRawText({ arrayBuffer: buffer });
            const text = textResult.value;

            if (i > 0 && options.pageBreaks) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun({ text: '', break: 1 })],
                  pageBreakBefore: true,
                })
              );
            }

            const lines = text.split('\n');
            lines.forEach(line => {
              if (line.trim()) {
                paragraphs.push(
                  new Paragraph({
                    children: [new TextRun(line.trim())],
                  })
                );
              }
            });

            totalWordCount += text.split(/\s+/).filter(word => word.length > 0).length;
          }

          // Add spacing between documents
          if (i < documents.length - 1) {
            paragraphs.push(
              new Paragraph({
                children: [new TextRun('')],
                spacing: { after: 400 }, // Larger spacing between documents
              })
            );
          }
        } catch (error) {
          console.error(`Error processing Word document ${i + 1}:`, error);
          
          // Add error notice in the merged document
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ 
                  text: `[Error: Could not process document ${i + 1}]`,
                  italics: true,
                  color: 'FF0000'
                })
              ],
            })
          );
          continue;
        }
      }

      if (paragraphs.length === 0) {
        return {
          success: false,
          error: 'No content found in any document'
        };
      }

      // Create new document with better formatting
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 720,  // 0.5 inch
                right: 720,
                bottom: 720,
                left: 720,
              },
            },
          },
          children: paragraphs,
        }],
        ...(options.preserveMetadata && {
          title: 'Merged Word Document',
          creator: 'DocMerger',
          description: 'Document created by merging multiple Word documents',
        }),
      });

      const docxBuffer = await Packer.toBuffer(doc);

      return {
        success: true,
        data: docxBuffer.buffer as ArrayBuffer,
        metadata: {
          wordCount: totalWordCount,
          pageCount: Math.ceil(totalWordCount / 250),
          title: 'Merged Word Document'
        }
      };
    } catch (error) {
      console.error('Word merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Word processing error'
      };
    }
  }

  static async extractText(buffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    } catch (error) {
      console.error('Word text extraction error:', error);
      return '';
    }
  }

  static async extractHTML(buffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      return result.value;
    } catch (error) {
      console.error('Word HTML extraction error:', error);
      return '';
    }
  }

  static async generatePreview(buffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      const text = result.value;
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      
      // Get first few lines as preview
      const lines = text.split('\n').slice(0, 5);
      const preview = lines.join('\n');
      
      return `Word Document\nWords: ${wordCount}\nPages: ~${Math.ceil(wordCount / 250)}\n\nPreview:\n${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}`;
    } catch (error) {
      console.error('Word preview error:', error);
      return 'Word Document (Preview not available)';
    }
  }

  static async convertToText(buffer: ArrayBuffer): Promise<string> {
    return this.extractText(buffer);
  }

  static async createFromText(text: string, title?: string): Promise<ArrayBuffer> {
    try {
      const paragraphs = text.split('\n\n').map(paragraph => 
        new Paragraph({
          children: [new TextRun(paragraph.trim())],
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs,
        }],
        ...(title && {
          title,
          creator: 'DocMerger',
        }),
      });

      const buffer = await Packer.toBuffer(doc);
      return buffer.buffer as ArrayBuffer;
    } catch (error) {
      console.error('Word creation from text error:', error);
      throw error;
    }
  }
}