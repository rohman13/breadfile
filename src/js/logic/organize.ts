
import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';

import { degrees, PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function organize() {
    showLoader('Saving changes...');
    try {
        const newPdf = await PDFLibDocument.create();
        const pageContainer = document.getElementById('page-organizer');
        const pageElements = Array.from(pageContainer.children) as HTMLElement[];
        const pageIndices = pageElements.map(child => parseInt(child.dataset.pageIndex!));

        const copiedPages = await newPdf.copyPages(state.pdfDoc, pageIndices);
        copiedPages.forEach((page: any, index: number) => {
            const turn = parseInt(pageElements[index].dataset.rotation || '0');
            if (turn) page.setRotation(degrees(page.getRotation().angle + turn));
            newPdf.addPage(page);
        });

        const newPdfBytes = await newPdf.save();
        downloadFile(new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' }), 'organized.pdf');
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Could not save the changes.');
    } finally {
        hideLoader();
    }
}