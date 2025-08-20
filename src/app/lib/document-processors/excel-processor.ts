import * as XLSX from 'xlsx';
import { DocumentMetadata, ProcessorResult } from '@/app/types';
import { FileSizeUtils } from '../utils/chunk-processor';
import { ErrorHandler } from '../utils/error-handler';

export class ExcelProcessor {
  static async analyzeDocument(buffer: ArrayBuffer): Promise<DocumentMetadata> {
    try {
      // Check for large files that might cause memory issues
      if (FileSizeUtils.isLargeFile({ size: buffer.byteLength } as File, 25)) {
        console.warn('Large Excel file detected, analysis may be limited');
      }

      const workbook = XLSX.read(buffer, { 
        type: 'array',
        cellDates: true, // Parse dates properly
        cellNF: false, // Don't parse number formats to save memory
        cellStyles: false // Don't parse styles to save memory
      });
      
      const sheetNames = workbook.SheetNames;
      let totalRows = 0;
      let totalCells = 0;
      let hasFormulas = false;
      
      // Analyze each sheet
      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        if (sheet['!ref']) {
          const range = XLSX.utils.decode_range(sheet['!ref']);
          const sheetRows = range.e.r + 1;
          const sheetCols = range.e.c + 1;
          totalRows += sheetRows;
          totalCells += sheetRows * sheetCols;
          
          // Check for formulas (basic detection)
          Object.keys(sheet).forEach(cell => {
            if (cell[0] !== '!' && sheet[cell].f) {
              hasFormulas = true;
            }
          });
        }
      });

      // Extract metadata from properties if available
      const props = workbook.Props || {};
      
      // Estimate word count based on cell content (rough approximation)
      const estimatedWordCount = Math.floor(totalCells * 0.3); // Assume 30% of cells have content
      
      return {
        sheetCount: sheetNames.length,
        pageCount: Math.ceil(totalRows / 50), // Rough estimate: 50 rows per page
        wordCount: estimatedWordCount,
        title: props.Title || `Excel Workbook (${sheetNames.length} sheets)`,
        author: props.Author || undefined,
        createdDate: props.CreatedDate || undefined,
        modifiedDate: props.ModifiedDate || undefined,
      };
    } catch (error) {
      console.error('Excel analysis error:', error);
      throw ErrorHandler.createUserFriendlyError(error, 'excel-analysis');
    }
  }

  static async mergeExcelFiles(
    documents: ArrayBuffer[],
    options: {
      preserveMetadata?: boolean;
      combineSheets?: boolean;
      sheetNaming?: 'original' | 'sequential' | 'custom';
      preserveFormatting?: boolean;
      includeFormulas?: boolean;
      onProgress?: (progress: number) => void;
    } = {}
  ): Promise<ProcessorResult> {
    try {
      const mergedWorkbook = XLSX.utils.book_new();
      let sheetCounter = 1;
      const totalFiles = documents.length;
      
      // Configure read options based on user preferences
      const readOptions: XLSX.ParsingOptions = {
        type: 'array',
        cellDates: true,
        cellNF: options.preserveFormatting !== false, // Default to true
        cellStyles: options.preserveFormatting !== false,
        sheetStubs: false, // Don't include empty cells
      };

      for (let i = 0; i < documents.length; i++) {
        const buffer = documents[i];
        options.onProgress?.(i / totalFiles);
        
        try {
          // Check for very large files
          if (FileSizeUtils.isLargeFile({ size: buffer.byteLength } as File, 20)) {
            console.warn(`Large Excel file ${i + 1} detected, processing with optimizations`);
            readOptions.cellNF = false;
            readOptions.cellStyles = false;
          }
          
          const workbook = XLSX.read(buffer, readOptions);
          
          // Process each sheet
          workbook.SheetNames.forEach((sheetName, sheetIndex) => {
            const sheet = workbook.Sheets[sheetName];
            
            // Skip empty sheets
            if (!sheet['!ref']) {
              console.warn(`Skipping empty sheet: ${sheetName}`);
              return;
            }
            
            // Filter out formulas if requested
            if (!options.includeFormulas) {
              Object.keys(sheet).forEach(cellAddr => {
                if (cellAddr[0] !== '!' && sheet[cellAddr].f) {
                  // Convert formula to value
                  delete sheet[cellAddr].f;
                }
              });
            }
            
            // Determine new sheet name
            let newSheetName: string;
            switch (options.sheetNaming) {
              case 'sequential':
                newSheetName = `Sheet${sheetCounter++}`;
                break;
              case 'original':
                newSheetName = `File${i + 1}_${sheetName}`;
                break;
              default:
                newSheetName = i === 0 && sheetIndex === 0 ? sheetName : `File${i + 1}_${sheetName}`;
                sheetCounter++;
            }

            // Ensure unique sheet name (Excel limit is 31 chars)
            let finalName = newSheetName.substring(0, 31);
            let nameCounter = 1;
            while (mergedWorkbook.SheetNames.includes(finalName)) {
              const suffix = `_${nameCounter++}`;
              finalName = newSheetName.substring(0, 31 - suffix.length) + suffix;
            }

            // Add sheet with enhanced metadata
            mergedWorkbook.Sheets[finalName] = sheet;
            mergedWorkbook.SheetNames.push(finalName);
            
            // Add source file information as a comment in cell A1 if empty
            if (!sheet['A1']) {
              sheet['A1'] = { t: 's', v: `Source: File ${i + 1}` };
            }
          });
        } catch (error) {
          console.error(`Error processing Excel file ${i + 1}:`, error);
          
          // Add error sheet instead of completely failing
          const errorSheetName = `File${i + 1}_Error`;
          const errorSheet = XLSX.utils.aoa_to_sheet([
            ['Error Processing File'],
            [`File ${i + 1} could not be processed`],
            [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            ['Please check the original file for corruption or unsupported features']
          ]);
          
          mergedWorkbook.Sheets[errorSheetName] = errorSheet;
          mergedWorkbook.SheetNames.push(errorSheetName);
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

      options.onProgress?.(0.9);
      
      // Enhanced write options for better compatibility
      const writeOptions: XLSX.WritingOptions = {
        type: 'array',
        bookType: 'xlsx',
        cellDates: false, // Use serial dates for compatibility
        bookSST: false, // Don't use shared strings to reduce file size
      };
      
      // For large workbooks, use compression
      if (mergedWorkbook.SheetNames.length > 10) {
        writeOptions.compression = true;
      }
      
      const excelBuffer = XLSX.write(mergedWorkbook, writeOptions);
      options.onProgress?.(1.0);

      return {
        success: true,
        data: excelBuffer,
        metadata: {
          sheetCount: mergedWorkbook.SheetNames.length,
          title: 'Merged Excel Document',
          author: 'DocMerger',
          createdDate: new Date(),
        }
      };
    } catch (error) {
      console.error('Excel merge error:', error);
      const friendlyError = ErrorHandler.createUserFriendlyError(error, 'excel-merge');
      return {
        success: false,
        error: friendlyError.message
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
      const workbook = XLSX.read(buffer, { 
        type: 'array',
        cellStyles: false, // Don't load styles for preview
        cellNF: false // Don't parse number formats
      });
      
      const sheetNames = workbook.SheetNames;
      let totalCells = 0;
      let hasFormulas = false;
      
      // Quick analysis
      sheetNames.forEach(name => {
        const sheet = workbook.Sheets[name];
        if (sheet['!ref']) {
          const range = XLSX.utils.decode_range(sheet['!ref']);
          totalCells += (range.e.r + 1) * (range.e.c + 1);
          
          // Check for formulas
          if (!hasFormulas) {
            Object.keys(sheet).some(cell => {
              if (cell[0] !== '!' && sheet[cell].f) {
                hasFormulas = true;
                return true;
              }
              return false;
            });
          }
        }
      });
      
      let preview = `Excel Workbook\n`;
      preview += `Sheets: ${sheetNames.length}\n`;
      preview += `Size: ${FileSizeUtils.formatBytes(buffer.byteLength)}\n`;
      if (hasFormulas) preview += `Contains formulas: Yes\n`;
      preview += `\nSheet names: ${sheetNames.slice(0, 5).join(', ')}${sheetNames.length > 5 ? '...' : ''}\n\n`;
      
      // Show preview of first sheet
      if (sheetNames.length > 0) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        try {
          const data = XLSX.utils.sheet_to_json(firstSheet, { 
            header: 1, 
            raw: false,
            range: 'A1:F6' // First 6 rows and columns
          }) as unknown[][];
          
          if (data.length > 0) {
            preview += `Preview of "${sheetNames[0]}":\n`;
            
            // Format as table
            data.slice(0, 4).forEach((row, rowIndex) => {
              const formattedRow = row.slice(0, 4).map(cell => {
                const cellStr = String(cell || '').substring(0, 15);
                return cellStr.padEnd(15);
              }).join(' | ');
              preview += formattedRow + '\n';
              
              // Add separator after header
              if (rowIndex === 0 && row.length > 0) {
                preview += '-'.repeat(Math.min(formattedRow.length, 80)) + '\n';
              }
            });
            
            if (data.length > 4) {
              preview += '...\n';
            }
          }
        } catch (sheetError) {
          preview += `Preview of "${sheetNames[0]}": Content preview not available\n`;
        }
      }

      return preview;
    } catch (error) {
      console.error('Excel preview error:', error);
      return `Excel Document (${FileSizeUtils.formatBytes(buffer.byteLength)})\nPreview not available: ${error instanceof Error ? error.message : 'Unknown error'}`;
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