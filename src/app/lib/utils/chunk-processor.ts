/**
 * Chunked file processing utilities for handling large documents efficiently
 * Prevents memory overload by processing files in chunks
 */

export interface ChunkProcessorOptions {
  chunkSize?: number; // Size in bytes
  maxConcurrentChunks?: number;
  onProgress?: (progress: number) => void;
  onChunkProcessed?: (chunkIndex: number, totalChunks: number) => void;
}

export interface ProcessingResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  processedChunks?: number;
  totalChunks?: number;
}

export class ChunkProcessor {
  private static readonly DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  private static readonly MAX_CONCURRENT = 3;

  /**
   * Process a large file in chunks to prevent memory issues
   */
  static async processFileInChunks<T>(
    file: File,
    processor: (chunk: ArrayBuffer, chunkIndex: number, isLastChunk: boolean) => Promise<T>,
    options: ChunkProcessorOptions = {}
  ): Promise<ProcessingResult<T[]>> {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      maxConcurrentChunks = this.MAX_CONCURRENT,
      onProgress,
      onChunkProcessed
    } = options;

    try {
      const totalChunks = Math.ceil(file.size / chunkSize);
      const results: T[] = [];
      let processedChunks = 0;

      // Process chunks in batches to control memory usage
      for (let i = 0; i < totalChunks; i += maxConcurrentChunks) {
        const batchEnd = Math.min(i + maxConcurrentChunks, totalChunks);
        const batchPromises: Promise<T>[] = [];

        for (let j = i; j < batchEnd; j++) {
          const start = j * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const isLastChunk = j === totalChunks - 1;
          
          const chunkBlob = file.slice(start, end);
          const chunkPromise = chunkBlob.arrayBuffer()
            .then(buffer => processor(buffer, j, isLastChunk))
            .then(result => {
              processedChunks++;
              onChunkProcessed?.(processedChunks, totalChunks);
              onProgress?.(processedChunks / totalChunks);
              return result;
            });

          batchPromises.push(chunkPromise);
        }

        // Wait for current batch to complete before processing next
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        success: true,
        data: results,
        processedChunks,
        totalChunks
      };

    } catch (error) {
      console.error('Chunked processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error',
        processedChunks,
        totalChunks: Math.ceil(file.size / chunkSize)
      };
    }
  }

  /**
   * Process multiple files with memory management
   */
  static async processMultipleFiles<T>(
    files: File[],
    processor: (file: File, fileIndex: number) => Promise<T>,
    options: { maxConcurrent?: number; onProgress?: (progress: number) => void } = {}
  ): Promise<ProcessingResult<T[]>> {
    const { maxConcurrent = 2, onProgress } = options;

    try {
      const results: T[] = [];
      let processedFiles = 0;

      // Process files in batches to prevent memory overload
      for (let i = 0; i < files.length; i += maxConcurrent) {
        const batch = files.slice(i, i + maxConcurrent);
        const batchPromises = batch.map((file, batchIndex) => 
          processor(file, i + batchIndex).then(result => {
            processedFiles++;
            onProgress?.(processedFiles / files.length);
            return result;
          })
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Give browser time to breathe between batches
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        success: true,
        data: results,
        processedChunks: processedFiles,
        totalChunks: files.length
      };

    } catch (error) {
      console.error('Multiple file processing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      };
    }
  }

  /**
   * Streaming buffer reader for very large files
   */
  static async *streamFileBuffer(
    file: File, 
    chunkSize = this.DEFAULT_CHUNK_SIZE
  ): AsyncGenerator<ArrayBuffer, void, unknown> {
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);
      
      try {
        const buffer = await chunk.arrayBuffer();
        yield buffer;
        offset = end;
      } catch (error) {
        console.error(`Failed to read chunk at offset ${offset}:`, error);
        throw error;
      }
    }
  }

  /**
   * Check if file should be processed in chunks based on size
   */
  static shouldUseChunkedProcessing(file: File, threshold = 10 * 1024 * 1024): boolean {
    return file.size > threshold;
  }

  /**
   * Estimate processing time based on file size
   */
  static estimateProcessingTime(file: File, processingSpeedBytesPerSecond = 1024 * 1024): number {
    return Math.ceil(file.size / processingSpeedBytesPerSecond);
  }

  /**
   * Memory-safe file validation
   */
  static async validateFileStructure(
    file: File,
    validator: (chunk: ArrayBuffer, isFirstChunk: boolean, isLastChunk: boolean) => boolean,
    options: ChunkProcessorOptions = {}
  ): Promise<{ valid: boolean; error?: string }> {
    const chunkSize = options.chunkSize || this.DEFAULT_CHUNK_SIZE;
    const totalChunks = Math.ceil(file.size / chunkSize);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        const buffer = await chunk.arrayBuffer();
        
        const isFirstChunk = i === 0;
        const isLastChunk = i === totalChunks - 1;
        
        if (!validator(buffer, isFirstChunk, isLastChunk)) {
          return {
            valid: false,
            error: `File structure validation failed at chunk ${i + 1}`
          };
        }

        // Progress callback
        options.onProgress?.(i / totalChunks);

        // Yield control back to browser
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation error'
      };
    }
  }
}

/**
 * File size utilities
 */
export class FileSizeUtils {
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static isLargeFile(file: File, thresholdMB = 10): boolean {
    return file.size > thresholdMB * 1024 * 1024;
  }

  static getRecommendedChunkSize(fileSize: number): number {
    if (fileSize < 10 * 1024 * 1024) return 1 * 1024 * 1024; // 1MB for small files
    if (fileSize < 100 * 1024 * 1024) return 5 * 1024 * 1024; // 5MB for medium files
    return 10 * 1024 * 1024; // 10MB for large files
  }
}