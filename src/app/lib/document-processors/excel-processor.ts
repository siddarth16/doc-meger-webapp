import * as XLSX from 'xlsx';
import { DocumentMetadata, ProcessorResult } from '@/app/types';

export class ExcelProcessor {
  static async analyzeDocument(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      let totalRows = 0;
      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
        totalRows += range.e.r + 1; // +1 because rows are 0-indexed
      });

      // Extract metadata from properties if available
      const props = workbook.Props || {};
      
      return {
        sheetCount: sheetNames.length,
        wordCount: totalRows, // Using row count as a proxy
        title: props.Title || undefined,
        author: props.Author || undefined,
        createdDate: props.CreatedDate || undefined,
        modifiedDate: props.ModifiedDate || undefined,
      };
    } catch (error) {
      console.error('Excel analysis error:', error);
      return {};
    }
  }

  static async mergeExcelFiles(
    documents: ArrayBuffer[],
    options: {
      preserveMetadata?: boolean;
      combineSheets?: boolean;
      sheetNaming?: 'original' | 'sequential' | 'custom';
    } = {}
  ): Promise<ProcessorResult> {
    try {
      const mergedWorkbook = XLSX.utils.book_new();
      let sheetCounter = 1;

      for (let i = 0; i < documents.length; i++) {
        const buffer = documents[i];
        try {
          const workbook = XLSX.read(buffer, { type: 'array' });
          
          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            
            // Determine new sheet name
            let newSheetName: string;
            switch (options.sheetNaming) {
              case 'sequential':
                newSheetName = `Sheet${sheetCounter++}`;
                break;
              case 'original':
                newSheetName = `${sheetName}_File${i + 1}`;
                break;
              default:
                newSheetName = sheetCounter === 1 ? sheetName : `${sheetName}_${sheetCounter}`;
                sheetCounter++;
            }

            // Ensure unique sheet name
            let finalName = newSheetName;
            let nameCounter = 1;
            while (mergedWorkbook.SheetNames.includes(finalName)) {
              finalName = `${newSheetName}_${nameCounter++}`;
            }

            mergedWorkbook.Sheets[finalName] = sheet;
            mergedWorkbook.SheetNames.push(finalName);
          });
        } catch (error) {
          console.error(`Error processing Excel file ${i + 1}:`, error);
          continue;
        }
      }

      if (mergedWorkbook.SheetNames.length === 0) {
        throw new Error('No valid sheets found in any document');
      }

      // Set metadata
      if (options.preserveMetadata) {
        mergedWorkbook.Props = {
          Title: 'Merged Excel Document',
          Author: 'DocMerger',
          CreatedDate: new Date(),
          ModifiedDate: new Date(),
        };
      }

      const excelBuffer = XLSX.write(mergedWorkbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });

      return {
        success: true,
        data: excelBuffer,
        metadata: {
          sheetCount: mergedWorkbook.SheetNames.length,
          title: 'Merged Excel Document'
        }
      };
    } catch (error) {
      console.error('Excel merge error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Excel processing error'
      };
    }
  }

  static async extractData(buffer: ArrayBuffer): Promise<unknown[][]> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const allData: unknown[][] = [];

      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
        allData.push(...(data as unknown[][]));
      });

      return allData;
    } catch (error) {
      console.error('Excel data extraction error:', error);
      return [];
    }
  }

  static async generatePreview(buffer: ArrayBuffer): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      
      let preview = `Excel Workbook\nSheets: ${sheetNames.length}\n\n`;
      
      // Show first few rows of first sheet as preview
      if (sheetNames.length > 0) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const data = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1, 
          raw: false,
          range: 'A1:E5' // First 5 rows and columns
        }) as unknown[][];
        
        preview += `Preview of "${sheetNames[0]}":\n`;
        data.slice(0, 3).forEach(row => {
          preview += row.slice(0, 3).join(' | ') + '\n';
        });
        
        if (data.length > 3) {
          preview += '...\n';
        }
      }

      return preview;
    } catch (error) {
      console.error('Excel preview error:', error);
      return 'Excel Document (Preview not available)';
    }
  }

  static async convertToCSV(buffer: ArrayBuffer, sheetName?: string): Promise<string> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const targetSheet = sheetName || workbook.SheetNames[0];
      const sheet = workbook.Sheets[targetSheet];
      
      return XLSX.utils.sheet_to_csv(sheet);
    } catch (error) {
      console.error('Excel to CSV conversion error:', error);
      throw error;
    }
  }

  static async splitWorkbook(buffer: ArrayBuffer): Promise<{ [sheetName: string]: ArrayBuffer }> {
    try {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const result: { [sheetName: string]: ArrayBuffer } = {};

      workbook.SheetNames.forEach(sheetName => {
        const newWorkbook = XLSX.utils.book_new();
        newWorkbook.Sheets[sheetName] = workbook.Sheets[sheetName];
        newWorkbook.SheetNames.push(sheetName);

        const buffer = XLSX.write(newWorkbook, { type: 'array', bookType: 'xlsx' });
        result[sheetName] = buffer;
      });

      return result;
    } catch (error) {
      console.error('Excel split error:', error);
      throw error;
    }
  }
}