import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';

import { degrees, PDFDocument as PDFLibDocument } from 'pdf-lib';

export async function rotate() {
    showLoader('Applying rotations...');
    try {
        const output = await PDFLibDocument.create();
        const copied = await output.copyPages(state.pdfDoc, state.pdfDoc.getPageIndices());
        copied.forEach(page => output.addPage(page));
        const pages = output.getPages();
        document.querySelectorAll('.page-rotator-item').forEach(item => {
            // @ts-expect-error TS(2339) FIXME: Property 'dataset' does not exist on type 'Element... Remove this comment to see the full error message
            const pageIndex = parseInt(item.dataset.pageIndex);
            // @ts-expect-error TS(2339) FIXME: Property 'dataset' does not exist on type 'Element... Remove this comment to see the full error message
            const rotation = parseInt(item.dataset.rotation || '0');
            if (rotation !== 0) {
                const currentRotation = pages[pageIndex].getRotation().angle;
                pages[pageIndex].setRotation(degrees(currentRotation + rotation));
            }
        });

        const rotatedPdfBytes = await output.save();
        downloadFile(new Blob([new Uint8Array(rotatedPdfBytes)], { type: 'application/pdf' }), 'rotated.pdf');
    } catch (e) {
        console.error(e);
        showAlert('Error', 'Could not apply rotations.');
    } finally {
        hideLoader();
    }
}