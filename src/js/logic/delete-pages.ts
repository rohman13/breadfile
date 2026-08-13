import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { normalizePageSelection } from '../utils/pageSelection.js';

export async function deletePages() {
    // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
    const pageInput = document.getElementById('pages-to-delete').value;
    if (!pageInput) {
        showAlert('Invalid Input', 'Please enter page numbers to delete.');
        return;
    }
    showLoader('Deleting pages...');
    try {
        const totalPages = state.pdfDoc.getPageCount();
        const parsed = normalizePageSelection(pageInput, totalPages);
        if (!Array.isArray(parsed)) {
            showAlert('Check the page numbers', parsed.error);
            return;
        }
        const indicesToDelete = new Set(parsed);
        if (indicesToDelete.size === 0) {
            showAlert('Invalid Input', 'No valid pages selected for deletion.');
            return;
        }
        if (indicesToDelete.size >= totalPages) {
            showAlert('Invalid Input', 'You cannot delete all pages.');
            return;
        }

        const indicesToKeep = Array.from({ length: totalPages }, (_, i) => i).filter(index => !indicesToDelete.has(index));
        const newPdf = await PDFLibDocument.create();
        const copiedPages = await newPdf.copyPages(state.pdfDoc, indicesToKeep);
        copiedPages.forEach((page: any) => newPdf.addPage(page));

        const newPdfBytes = await newPdf.save();
        downloadFile(new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }), 'deleted-pages.pdf');
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Could not delete pages.');
    } finally {
        hideLoader();
    }
}