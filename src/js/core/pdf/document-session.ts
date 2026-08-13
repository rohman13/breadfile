import { PDFDocument } from 'pdf-lib';
import { ProcessingError } from '../errors/processing-error.js';

export class DocumentSession {
  private sourceBytes: Uint8Array | null = null;

  async load(file: File): Promise<PDFDocument> {
    this.dispose();
    try {
      this.sourceBytes = new Uint8Array(await file.arrayBuffer());
      const document = await PDFDocument.load(this.sourceBytes, { ignoreEncryption: true });
      if (document.isEncrypted) {
        throw new ProcessingError('This PDF is password-protected.', 'ENCRYPTED_PDF');
      }
      return document;
    } catch (error) {
      this.sourceBytes = null;
      if (error instanceof ProcessingError) throw error;
      throw new ProcessingError('The PDF could not be opened.', 'CORRUPT_PDF', error);
    }
  }

  get bytes(): Uint8Array {
    if (!this.sourceBytes) {
      throw new ProcessingError('Choose a PDF first.', 'INVALID_FILE');
    }
    return this.sourceBytes;
  }

  dispose(): void {
    this.sourceBytes = null;
  }
}
