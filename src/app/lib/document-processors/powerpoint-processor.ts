import { DocumentMetadata, ProcessorResult } from '@/app/types';
import { FileSizeUtils } from '@/app/lib/utils/chunk-processor';
import { ErrorHandler } from '@/app/lib/utils/error-handler';

// Dynamically import PowerPoint libraries to avoid SSR issues
const getPptxParser = async () => {
  if (typeof window !== 'undefined') {
    try {
      const pptxParser = await import('pptx-parser');
      return pptxParser.default;
    } catch (error) {
      console.warn('pptx-parser not available:', error);
      return null;
    }
  }
  return null;
};

// Note: PowerPoint generation is complex and requires specialized libraries
// For now, we'll focus on reading/parsing PowerPoint files
// Generation will convert to other formats like PDF or text

export class PowerPointProcessor {
  static async analyzeDocument(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    try {
      const parser = await getPptxParser();
      if (!parser) {
        return {
          title: 'PowerPoint Presentation',
          slideCount: 1, // Placeholder
        };
      }

      const result = await parser.parseBuffer(buffer);
      const slides = result.slides || [];
      
      // Count total text content for word count estimation
      let totalText = '';
      slides.forEach((slide: { title?: string; text?: string; bullets?: string[] }) => {
        if (slide.text) {
          totalText += slide.text + ' ';
        }
      });

      const wordCount = totalText.trim() ? 
        totalText.split(/\s+/).filter(word => word.length > 0).length : 0;

      return {
        slideCount: slides.length,
        wordCount,
        title: result.title || 'PowerPoint Presentation',
        author: result.author,
        createdDate: result.createdDate ? new Date(result.createdDate) : undefined,
        modifiedDate: result.modifiedDate ? new Date(result.modifiedDate) : undefined,
      };
    } catch (error) {
      console.error('PowerPoint analysis error:', error);
      return {
        title: 'PowerPoint Presentation',
        slideCount: 1, // Fallback
      };
    }
  }

  static async mergePowerPointPresentations(
    documents: ArrayBuffer[],
    _options: {
      preserveMetadata?: boolean;
      preserveFormatting?: boolean;
      slideTransitions?: boolean;
      includeMasterSlides?: boolean;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      // For now, PowerPoint merging will extract text content and merge as a text-based format
      // This is a limitation without a proper browser-compatible PowerPoint generation library
      
      const parser = await getPptxParser();
      if (!parser) {
        return {
          success: false,
          error: 'PowerPoint processing requires converting to PDF format. Please use the PDF conversion option instead.'
        };
      }

      let mergedContent = '';
      let totalSlides = 0;

      for (let docIndex = 0; docIndex < documents.length; docIndex++) {
        const buffer = documents[docIndex];
        
        try {
          const result = await parser.parseBuffer(buffer);
          const slides = result.slides || [];

          if (docIndex > 0) {
            mergedContent += `\n\n=== Document ${docIndex + 1} ===\n\n`;
          }

          slides.forEach((slideData: { title?: string; text?: string; bullets?: string[] }, slideIndex: number) => {
            mergedContent += `\n--- Slide ${slideIndex + 1} ---\n`;
            
            if (slideData.title) {
              mergedContent += `Title: ${slideData.title}\n`;
            }
            
            if (slideData.text) {
              mergedContent += slideData.text + '\n';
            }
            
            if (slideData.bullets && Array.isArray(slideData.bullets)) {
              slideData.bullets.forEach((bullet: string) => {
                mergedContent += `• ${bullet}\n`;
              });
            }
            
            mergedContent += '\n';
            totalSlides++;
          });

        } catch (docError) {
          console.error(`Error processing PowerPoint document ${docIndex + 1}:`, docError);
          mergedContent += `\n[Error: Could not process document ${docIndex + 1}]\n`;
        }
      }

      if (totalSlides === 0) {
        return {
          success: false,
          error: 'No slides found in any document'
        };
      }

      // Convert merged text content to a text file
      const encoder = new TextEncoder();
      const textData = encoder.encode(mergedContent);

      return {
        success: true,
        data: textData.buffer,
        metadata: {
          slideCount: totalSlides,
          title: 'Merged PowerPoint Content (Text Format)'
        }
      };

    } catch (error) {
      console.error('PowerPoint merge error:', error);
      const friendlyError = ErrorHandler.createUserFriendlyError(error, 'powerpoint-merge');
      return {
        success: false,
        error: friendlyError.message
      };
    }
  }

  static async extractText(buffer: ArrayBuffer): Promise<string> {
    try {
      const parser = await getPptxParser();
      if (!parser) {
        return 'PowerPoint text extraction not available';
      }

      const result = await parser.parseBuffer(buffer);
      const slides = result.slides || [];
      
      let allText = '';
      slides.forEach((slide: { title?: string; text?: string; bullets?: string[] }, index: number) => {
        allText += `\n--- Slide ${index + 1} ---\n`;
        if (slide.title) {
          allText += `Title: ${slide.title}\n`;
        }
        if (slide.text) {
          allText += slide.text + '\n';
        }
        if (slide.bullets && Array.isArray(slide.bullets)) {
          slide.bullets.forEach((bullet: string) => {
            allText += `• ${bullet}\n`;
          });
        }
        allText += '\n';
      });

      return allText.trim();
    } catch (error) {
      console.error('PowerPoint text extraction error:', error);
      return 'PowerPoint text extraction failed';
    }
  }

  static async generatePreview(buffer: ArrayBuffer): Promise<string> {
    try {
      const metadata = await this.analyzeDocument(buffer);
      const text = await this.extractText(buffer);
      
      let preview = `PowerPoint Presentation\n`;
      if (metadata.slideCount) preview += `Slides: ${metadata.slideCount}\n`;
      if (metadata.wordCount) preview += `Words: ~${metadata.wordCount}\n`;
      if (metadata.title && metadata.title !== 'PowerPoint Presentation') {
        preview += `Title: ${metadata.title}\n`;
      }
      if (metadata.author) preview += `Author: ${metadata.author}\n`;
      preview += `Size: ${FileSizeUtils.formatBytes(buffer.byteLength)}\n`;
      
      // Add text preview from first few slides
      if (text && text.length > 0) {
        const textPreview = text.split('\n')
          .slice(0, 8)
          .join('\n')
          .substring(0, 400);
        
        preview += `\nPreview:\n${textPreview}`;
        if (text.length > 400) preview += '...';
      }
      
      return preview;
    } catch (error) {
      console.error('PowerPoint preview error:', error);
      return 'PowerPoint Presentation (Preview not available)';
    }
  }

  /**
   * Convert PowerPoint to text format
   */
  static async convertToText(buffer: ArrayBuffer): Promise<string> {
    const text = await this.extractText(buffer);
    return text;
  }

  /**
   * Validate PowerPoint file structure
   */
  static async validatePowerPointStructure(buffer: ArrayBuffer): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check for Office Open XML structure (PowerPoint files are ZIP archives)
      const header = new Uint8Array(buffer.slice(0, 4));
      const zipSignature = [0x50, 0x4B, 0x03, 0x04]; // PK.. ZIP file signature
      
      const isValidZip = zipSignature.every((byte, index) => header[index] === byte);
      
      if (!isValidZip) {
        return { valid: false, error: 'Invalid PowerPoint file format (not a valid ZIP archive)' };
      }

      // Try to parse the document
      const parser = await getPptxParser();
      if (parser) {
        await parser.parseBuffer(buffer);
      }
      
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid PowerPoint structure: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get supported PowerPoint formats
   */
  static getSupportedFormats(): string[] {
    return ['pptx'];
  }

  /**
   * Check if PowerPoint processing is available
   */
  static async isAvailable(): Promise<boolean> {
    const parser = await getPptxParser();
    return !!parser;
  }
}