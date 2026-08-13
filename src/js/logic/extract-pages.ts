import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';
import JSZip from 'jszip';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { normalizePageSelection } from '../utils/pageSelection.js';

export async function extractPages() {
    // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
    const pageInput = document.getElementById('pages-to-extract').value;
    if (!pageInput.trim()) {
        showAlert('Invalid Input', 'Please enter page numbers to extract.');
        return;
    }
    showLoader('Extracting pages...');
    try {
        const totalPages = state.pdfDoc.getPageCount();
        const parsed = normalizePageSelection(pageInput, totalPages);
        if (!Array.isArray(parsed)) {
            showAlert('Check the page numbers', parsed.error);
            return;
        }
        const indicesToExtract = new Set(parsed);

        if (indicesToExtract.size === 0) {
            showAlert('Invalid Input', 'No valid pages selected for extraction.');
            return;
        }

        const zip = new JSZip();
        const sortedIndices = Array.from(indicesToExtract).sort((a, b) => a - b);

        for (const index of sortedIndices) {
            const newPdf = await PDFLibDocument.create();
            const [copiedPage] = await newPdf.copyPages(state.pdfDoc, [index as number]);
            newPdf.addPage(copiedPage);
            const newPdfBytes = await newPdf.save();
            zip.file(`page-${index + 1}.pdf`, newPdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadFile(zipBlob, 'extracted-pages.zip');
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Could not extract pages.');
    } finally {
        hideLoader();
    }
}