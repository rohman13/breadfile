import { PDFDocument } from 'pdf-lib';
import { ProcessingError } from '../../core/errors/processing-error.js';

export async function deletePdfPages(
  source: Uint8Array,
  pageIndices: readonly number[],
): Promise<Uint8Array> {
  try {
    const input = await PDFDocument.load(source, { ignoreEncryption: true });
    if (input.isEncrypted) {
      throw new ProcessingError('This PDF is password-protected.', 'ENCRYPTED_PDF');
    }

    const totalPages = input.getPageCount();
    const selected = new Set(pageIndices);
    if (selected.size === 0) {
      throw new ProcessingError('Select at least one page to delete.', 'INVALID_FILE');
    }
    if (Array.from(selected).some((index) => !Number.isInteger(index) || index < 0 || index >= totalPages)) {
      throw new ProcessingError('The page selection is outside this document.', 'INVALID_FILE');
    }
    if (selected.size >= totalPages) {
      throw new ProcessingError('A PDF must keep at least one page.', 'INVALID_FILE');
    }

    const keep = Array.from({ length: totalPages }, (_, index) => index)
      .filter((index) => !selected.has(index));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(input, keep);
    pages.forEach((page) => output.addPage(page));
    return new Uint8Array(await output.save());
  } catch (error) {
    if (error instanceof ProcessingError) throw error;
    throw new ProcessingError('The pages could not be deleted.', 'PROCESSING_FAILED', error);
  }
}
