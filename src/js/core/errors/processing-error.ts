export type ProcessingErrorCode =
  | 'INVALID_FILE'
  | 'ENCRYPTED_PDF'
  | 'CORRUPT_PDF'
  | 'MEMORY_LIMIT'
  | 'PROCESSING_FAILED';

export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly code: ProcessingErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}
