import { DocumentMetadata, ProcessorResult } from '@/app/types';

// Utility function to sanitize text and remove problematic Unicode characters
function sanitizeText(text: string): string {
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

export class TextProcessor {
  static async analyzeDocument(text: string): Promise<DocumentMetadata> {
    try {
      const sanitizedText = sanitizeText(text);
      const lines = sanitizedText.split('\n');
      const words = sanitizedText.split(/\s+/).filter(word => word.length > 0);
      
      return {
        pageCount: Math.ceil(words.length / 250), // Rough estimate
        wordCount: words.length,
        title: lines[0]?.substring(0, 50) || 'Text Document', // First line as title
      };
    } catch (error) {
      console.error('Text analysis error:', error);
      return {};
    }
  }

  static async mergeTextFiles(
    documents: string[],
    options: {
      separator?: string;
      includeHeaders?: boolean;
      preserveFormatting?: boolean;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      const { separator = '\n\n---\n\n', includeHeaders = false } = options;
      
      let mergedContent = '';
      let totalWordCount = 0;

      documents.forEach((text, index) => {
        // Skip empty documents
        if (!text || text.trim().length === 0) {
          return;
        }

        if (includeHeaders && mergedContent.length > 0) {
          mergedContent += `\n\n=== Document ${index + 1} ===\n\n`;
        }
        
        if (mergedContent.length > 0 && !includeHeaders) {
          mergedContent += separator;
        }
        
        mergedContent += sanitizeText(text.trim());

        const words = text.split(/\s+/).filter(word => word.length > 0);
        totalWordCount += words.length;
      });

      if (mergedContent.trim().length === 0) {
        return {
          success: false,
          error: 'No text content found in any of the documents'
        };
      }

      const encoder = new TextEncoder();
      const data = encoder.encode(mergedContent);

      return {
        success: true,
        data: data.buffer,
        metadata: {
          wordCount: totalWordCount,
          pageCount: Math.ceil(totalWordCount / 250),
          title: 'Merged Text Document'
        }
      };
    } catch (error) {
      console.error('Text merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown text processing error'
      };
    }
  }

  static async generatePreview(text: string): Promise<string> {
    try {
      const sanitizedText = sanitizeText(text);
      const lines = sanitizedText.split('\n');
      const words = sanitizedText.split(/\s+/).filter(word => word.length > 0);
      
      const preview = lines.slice(0, 5).join('\n');
      
      return `Text Document\nLines: ${lines.length}\nWords: ${words.length}\nCharacters: ${text.length}\n\nPreview:\n${preview.substring(0, 200)}${preview.length > 200 ? '...' : ''}`;
    } catch (error) {
      console.error('Text preview error:', error);
      return 'Text Document (Preview not available)';
    }
  }

  static async splitByLines(text: string, linesPerSection: number): Promise<string[]> {
    try {
      const lines = text.split('\n');
      const sections: string[] = [];

      for (let i = 0; i < lines.length; i += linesPerSection) {
        const section = lines.slice(i, i + linesPerSection).join('\n');
        sections.push(section);
      }

      return sections;
    } catch (error) {
      console.error('Text split error:', error);
      throw error;
    }
  }

  static async splitByWords(text: string, wordsPerSection: number): Promise<string[]> {
    try {
      const words = text.split(/\s+/);
      const sections: string[] = [];

      for (let i = 0; i < words.length; i += wordsPerSection) {
        const section = words.slice(i, i + wordsPerSection).join(' ');
        sections.push(section);
      }

      return sections;
    } catch (error) {
      console.error('Text split by words error:', error);
      throw error;
    }
  }

  static extractStatistics(text: string): {
    lines: number;
    words: number;
    characters: number;
    charactersNoSpaces: number;
    paragraphs: number;
  } {
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;

    return {
      lines,
      words,
      characters,
      charactersNoSpaces,
      paragraphs
    };
  }

  static async findAndReplace(
    text: string,
    findText: string,
    replaceText: string,
    options: {
      caseSensitive?: boolean;
      wholeWords?: boolean;
      regex?: boolean;
    } = {}
  ): Promise<string> {
    try {
      const { caseSensitive = true, wholeWords = false, regex = false } = options;
      
      if (regex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regexPattern = new RegExp(findText, flags);
        return text.replace(regexPattern, replaceText);
      }

      let searchPattern = findText;
      if (wholeWords) {
        searchPattern = `\\b${findText}\\b`;
      }

      const flags = caseSensitive ? 'g' : 'gi';
      const regexPattern = new RegExp(searchPattern, flags);
      
      return text.replace(regexPattern, replaceText);
    } catch (error) {
      console.error('Find and replace error:', error);
      throw error;
    }
  }
}

export class CSVProcessor extends TextProcessor {
  static async parseCSV(text: string): Promise<string[][]> {
    try {
      const lines = text.split('\n');
      const result: string[][] = [];

      for (const line of lines) {
        if (line.trim()) {
          // Simple CSV parsing - for production, use a proper CSV library
          const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
          result.push(fields);
        }
      }

      return result;
    } catch (error) {
      console.error('CSV parsing error:', error);
      throw error;
    }
  }

  static async mergeCSVFiles(
    documents: string[],
    options: {
      includeHeaders?: boolean;
      skipDuplicateHeaders?: boolean;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      const { includeHeaders = true, skipDuplicateHeaders = true } = options;
      
      const mergedRows: string[][] = [];
      let headerProcessed = false;

      for (const csvText of documents) {
        const sanitizedCsvText = sanitizeText(csvText);
        const rows = await this.parseCSV(sanitizedCsvText);
        
        if (rows.length === 0) continue;

        if (includeHeaders && !headerProcessed) {
          // Include header from first file
          mergedRows.push(rows[0]);
          headerProcessed = true;
        }

        // Add data rows (skip header if not the first file and skipDuplicateHeaders is true)
        const dataRows = (includeHeaders && skipDuplicateHeaders && headerProcessed) ? rows.slice(1) : rows;
        mergedRows.push(...dataRows);
      }

      // Convert back to CSV text
      const mergedCSV = mergedRows.map(row => 
        row.map(field => `"${field}"`).join(',')
      ).join('\n');

      const encoder = new TextEncoder();
      const data = encoder.encode(mergedCSV);

      return {
        success: true,
        data: data.buffer,
        metadata: {
          title: 'Merged CSV Document'
        }
      };
    } catch (error) {
      console.error('CSV merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown CSV processing error'
      };
    }
  }

  static async generatePreview(text: string): Promise<string> {
    try {
      const rows = await this.parseCSV(text);
      const preview = rows.slice(0, 5).map(row => row.join(' | ')).join('\n');
      
      return `CSV Document\nRows: ${rows.length}\nColumns: ${rows[0]?.length || 0}\n\nPreview:\n${preview}${rows.length > 5 ? '\n...' : ''}`;
    } catch (error) {
      console.error('CSV preview error:', error);
      return 'CSV Document (Preview not available)';
    }
  }
}