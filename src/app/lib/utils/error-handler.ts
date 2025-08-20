/**
 * Centralized error handling system with user-friendly messages
 */

export interface ErrorDetails {
  code: string;
  title: string;
  message: string;
  userAction?: string;
  technicalDetails?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class DocumentError extends Error {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userAction?: string;
  technicalDetails?: string;

  constructor(code: string, message: string, options?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    userAction?: string;
    technicalDetails?: string;
    cause?: Error;
  }) {
    super(message);
    this.name = 'DocumentError';
    this.code = code;
    this.severity = options?.severity || 'medium';
    this.userAction = options?.userAction;
    this.technicalDetails = options?.technicalDetails || options?.cause?.message;
  }
}

export class ErrorHandler {
  private static readonly ERROR_CODES = {
    // File Upload Errors
    FILE_TOO_LARGE: {
      title: 'File Too Large',
      message: 'The selected file exceeds the maximum size limit.',
      userAction: 'Please choose a smaller file or compress the document.',
      severity: 'medium' as const
    },
    UNSUPPORTED_FORMAT: {
      title: 'Unsupported File Format',
      message: 'This file format is not supported for merging.',
      userAction: 'Please convert your file to PDF, DOCX, XLSX, PPTX, TXT, or CSV format.',
      severity: 'medium' as const
    },
    FILE_CORRUPTED: {
      title: 'Corrupted File',
      message: 'The file appears to be damaged or corrupted.',
      userAction: 'Try opening the file in its original application to verify it works, then upload again.',
      severity: 'high' as const
    },
    FILE_EMPTY: {
      title: 'Empty File',
      message: 'The selected file appears to be empty.',
      userAction: 'Please select a file that contains content.',
      severity: 'medium' as const
    },

    // Processing Errors
    PROCESSING_FAILED: {
      title: 'Processing Failed',
      message: 'Unable to process the document due to an internal error.',
      userAction: 'Please try again. If the problem persists, try converting the file to PDF first.',
      severity: 'high' as const
    },
    MEMORY_EXCEEDED: {
      title: 'Memory Limit Exceeded',
      message: 'The document is too large to process in your browser.',
      userAction: 'Try processing fewer documents at once or use smaller files.',
      severity: 'high' as const
    },
    MERGE_FAILED: {
      title: 'Merge Operation Failed',
      message: 'Unable to combine the selected documents.',
      userAction: 'Ensure all documents are valid and try again with fewer files.',
      severity: 'high' as const
    },
    CONVERSION_FAILED: {
      title: 'Format Conversion Failed',
      message: 'Unable to convert document to the target format.',
      userAction: 'Try manually converting the file using its original application first.',
      severity: 'medium' as const
    },

    // PDF Specific Errors
    PDF_PASSWORD_PROTECTED: {
      title: 'Password Protected PDF',
      message: 'This PDF is password protected and cannot be processed.',
      userAction: 'Please unlock the PDF in a PDF reader first, then upload it again.',
      severity: 'medium' as const
    },
    PDF_EXTRACTION_FAILED: {
      title: 'PDF Text Extraction Failed',
      message: 'Unable to extract text from this PDF document.',
      userAction: 'The PDF might contain only images. Try using OCR software first.',
      severity: 'low' as const
    },

    // Word Document Errors
    DOCX_COMPLEX_FORMATTING: {
      title: 'Complex Formatting Detected',
      message: 'This document contains complex formatting that may not be preserved.',
      userAction: 'For best results, consider converting to PDF first.',
      severity: 'low' as const
    },

    // Excel Errors
    XLSX_LARGE_SPREADSHEET: {
      title: 'Large Spreadsheet',
      message: 'This spreadsheet is very large and may take time to process.',
      userAction: 'Consider splitting large spreadsheets into smaller files.',
      severity: 'low' as const
    },

    // PowerPoint Errors
    PPTX_MEDIA_NOT_SUPPORTED: {
      title: 'Media Content Not Supported',
      message: 'Images, videos, and other media in the presentation cannot be processed.',
      userAction: 'Only text content will be preserved in the merged document.',
      severity: 'low' as const
    },

    // Network/System Errors
    BROWSER_NOT_SUPPORTED: {
      title: 'Browser Not Supported',
      message: 'Your browser does not support the required features for document processing.',
      userAction: 'Please use a modern browser like Chrome, Firefox, Safari, or Edge.',
      severity: 'critical' as const
    },
    INSUFFICIENT_MEMORY: {
      title: 'Insufficient Memory',
      message: 'Your device does not have enough available memory to process these documents.',
      userAction: 'Close other browser tabs and try processing fewer documents at once.',
      severity: 'high' as const
    },

    // Generic Errors
    UNKNOWN_ERROR: {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred while processing your request.',
      userAction: 'Please refresh the page and try again. If the problem persists, try with different files.',
      severity: 'medium' as const
    },
    TIMEOUT_ERROR: {
      title: 'Processing Timeout',
      message: 'The operation took too long and was cancelled.',
      userAction: 'Try processing smaller files or fewer documents at once.',
      severity: 'medium' as const
    }
  };

  /**
   * Create a user-friendly error from any error object
   */
  static createUserFriendlyError(
    error: unknown, 
    context?: string,
    fallbackCode = 'UNKNOWN_ERROR'
  ): DocumentError {
    // If it's already a DocumentError, return as-is
    if (error instanceof DocumentError) {
      return error;
    }

    // Try to identify the error type from the message
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.identifyErrorCode(errorMessage, context);
    const errorConfig = this.ERROR_CODES[errorCode] || this.ERROR_CODES[fallbackCode];

    return new DocumentError(errorCode, errorConfig.message, {
      severity: errorConfig.severity,
      userAction: errorConfig.userAction,
      technicalDetails: errorMessage
    });
  }

  /**
   * Get error details for display
   */
  static getErrorDetails(error: DocumentError): ErrorDetails {
    const errorConfig = this.ERROR_CODES[error.code] || this.ERROR_CODES.UNKNOWN_ERROR;
    
    return {
      code: error.code,
      title: errorConfig.title,
      message: error.message || errorConfig.message,
      userAction: error.userAction || errorConfig.userAction,
      technicalDetails: error.technicalDetails,
      severity: error.severity
    };
  }

  /**
   * Identify error type from error message and context
   */
  private static identifyErrorCode(message: string, context?: string): keyof typeof ErrorHandler.ERROR_CODES {
    const lowerMessage = message.toLowerCase();

    // File size errors
    if (lowerMessage.includes('exceeds') && lowerMessage.includes('limit')) {
      return 'FILE_TOO_LARGE';
    }
    if (lowerMessage.includes('file size') && lowerMessage.includes('too large')) {
      return 'FILE_TOO_LARGE';
    }

    // Format errors
    if (lowerMessage.includes('unsupported') && lowerMessage.includes('format')) {
      return 'UNSUPPORTED_FORMAT';
    }
    if (lowerMessage.includes('invalid') && lowerMessage.includes('format')) {
      return 'UNSUPPORTED_FORMAT';
    }

    // File corruption
    if (lowerMessage.includes('corrupt') || lowerMessage.includes('damaged')) {
      return 'FILE_CORRUPTED';
    }
    if (lowerMessage.includes('invalid') && (lowerMessage.includes('pdf') || lowerMessage.includes('document'))) {
      return 'FILE_CORRUPTED';
    }

    // Empty files
    if (lowerMessage.includes('empty') || lowerMessage.includes('no content')) {
      return 'FILE_EMPTY';
    }

    // Memory issues
    if (lowerMessage.includes('memory') || lowerMessage.includes('heap')) {
      return 'INSUFFICIENT_MEMORY';
    }
    if (lowerMessage.includes('out of memory')) {
      return 'MEMORY_EXCEEDED';
    }

    // PDF specific
    if (lowerMessage.includes('password') && lowerMessage.includes('protect')) {
      return 'PDF_PASSWORD_PROTECTED';
    }
    if (lowerMessage.includes('pdf') && lowerMessage.includes('text extraction')) {
      return 'PDF_EXTRACTION_FAILED';
    }

    // Processing failures
    if (lowerMessage.includes('merge') && lowerMessage.includes('failed')) {
      return 'MERGE_FAILED';
    }
    if (lowerMessage.includes('conversion') && lowerMessage.includes('failed')) {
      return 'CONVERSION_FAILED';
    }

    // Timeouts
    if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
      return 'TIMEOUT_ERROR';
    }

    // Context-specific errors
    if (context === 'pdf' && lowerMessage.includes('failed')) {
      return 'PDF_EXTRACTION_FAILED';
    }
    if (context === 'merge' && lowerMessage.includes('failed')) {
      return 'MERGE_FAILED';
    }
    if (context === 'processing' && lowerMessage.includes('failed')) {
      return 'PROCESSING_FAILED';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Log error for debugging while showing user-friendly message
   */
  static logAndThrow(error: unknown, context?: string): never {
    const userError = this.createUserFriendlyError(error, context);
    
    // Log technical details for debugging
    console.error(`[${userError.code}] ${context || 'Unknown context'}:`, {
      message: userError.message,
      technicalDetails: userError.technicalDetails,
      severity: userError.severity,
      originalError: error
    });

    throw userError;
  }

  /**
   * Handle async operations with proper error conversion
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.createUserFriendlyError(error, context);
    }
  }

  /**
   * Check browser compatibility
   */
  static checkBrowserSupport(): void {
    const requiredFeatures = [
      'File',
      'FileReader',
      'ArrayBuffer',
      'Blob',
      'URL',
      'Promise'
    ];

    for (const feature of requiredFeatures) {
      if (!(feature in window)) {
        throw new DocumentError('BROWSER_NOT_SUPPORTED', 
          `Your browser does not support ${feature}, which is required for document processing.`,
          { severity: 'critical' }
        );
      }
    }
  }

  /**
   * Get error severity color for UI
   */
  static getSeverityColor(severity: ErrorDetails['severity']): string {
    const colors = {
      low: 'text-yellow-400',
      medium: 'text-orange-400',
      high: 'text-red-400',
      critical: 'text-red-600'
    };
    return colors[severity];
  }

  /**
   * Get error severity icon
   */
  static getSeverityIcon(severity: ErrorDetails['severity']): string {
    const icons = {
      low: '⚠️',
      medium: '❗',
      high: '🚨',
      critical: '💥'
    };
    return icons[severity];
  }
}