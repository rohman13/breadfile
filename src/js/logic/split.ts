
import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';
import JSZip from 'jszip';

import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { normalizePageSelection } from '../utils/pageSelection.js';
import { resolveScissorRange } from '../utils/splitRange.js';
import { createIcons, icons } from 'lucide';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
).toString();

// Track if visual selector has been rendered to avoid duplicates
let visualSelectorRendered = false;
let selectedScissorPages: number[] = [];

function updateScissorSelection(totalPages: number) {
    const range = resolveScissorRange(selectedScissorPages, totalPages);
    const selected = new Set(range?.pages ?? []);
    document.querySelectorAll<HTMLElement>('#page-selector-grid .page-thumbnail-wrapper').forEach((card) => {
        const page = Number(card.dataset.pageNumber);
        card.classList.toggle('selected', selected.has(page));
        card.classList.toggle('is-range-start', page === range?.start);
        card.classList.toggle('is-range-end', page === range?.end);
    });
    document.querySelectorAll<HTMLButtonElement>('#page-selector-grid .split-scissor').forEach((button) => {
        const page = Number(button.dataset.pageNumber);
        const active = selectedScissorPages.includes(page);
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
    });

    const summary = document.getElementById('visual-range-summary');
    if (!summary) return;
    if (!range) {
        summary.textContent = 'Tap a scissor to select pages from page 1.';
    } else if (selectedScissorPages.length === 1) {
        summary.textContent = `Pages 1–${range.end} selected. Tap another scissor to choose a different start.`;
    } else {
        summary.textContent = `Pages ${range.start}–${range.end} selected.`;
    }
}

function toggleScissor(pageNumber: number, totalPages: number) {
    const existing = selectedScissorPages.indexOf(pageNumber);
    if (existing >= 0) {
        selectedScissorPages.splice(existing, 1);
    } else if (selectedScissorPages.length >= 2) {
        selectedScissorPages = [pageNumber];
    } else {
        selectedScissorPages.push(pageNumber);
    }
    updateScissorSelection(totalPages);
}


async function renderVisualSelector() {
    const container = document.getElementById('page-selector-grid');
    if (!container) return;
    // Rendering is async. A second setup/change callback can arrive before the
    // first thumbnail is appended, so the flag alone must guard re-entry.
    if (visualSelectorRendered) return;

    visualSelectorRendered = true;
    selectedScissorPages = [];

    container.textContent = '';
        
    showLoader('Rendering page previews...');
    try {
        const pdfData = await state.pdfDoc.save();
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 0.4 });
            const canvas = document.createElement('canvas');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: canvas.getContext('2d'), canvas, viewport: viewport }).promise;
            
            const wrapper = document.createElement('div');
            wrapper.className = 'page-thumbnail-wrapper split-page-card p-1 border-2 border-transparent rounded-lg';
            // @ts-expect-error TS(2322) FIXME: Type 'number' is not assignable to type 'string'.
            wrapper.dataset.pageIndex = i - 1;
            wrapper.dataset.pageNumber = String(i);

            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            img.className = 'rounded-md w-full h-auto';
            const p = document.createElement('p');
            p.className = 'text-center text-xs mt-1 text-gray-300';
            p.textContent = `Page ${i}`; 
            wrapper.append(img, p);
                        
            const unit = document.createElement('div');
            unit.className = 'split-page-unit';
            const scissor = document.createElement('button');
            scissor.type = 'button';
            scissor.className = 'split-scissor';
            scissor.dataset.pageNumber = String(i);
            scissor.setAttribute('aria-label', `Use page ${i} as a range endpoint`);
            scissor.setAttribute('aria-pressed', 'false');
            scissor.innerHTML = '<i data-lucide="scissors" aria-hidden="true"></i><span class="sr-only">Page ' + i + '</span>';
            scissor.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleScissor(i, pdf.numPages);
            });
            unit.append(wrapper, scissor);
            container.appendChild(unit);
        }
        updateScissorSelection(pdf.numPages);
        createIcons({ icons });
    } catch (error) {
        console.error('Error rendering visual selector:', error);
        showAlert('Error', 'Failed to render page previews.');
        // 4. ADDED: Reset the flag on error so the user can try again.
        visualSelectorRendered = false;
    } finally {
        hideLoader();
    }
}


export function setupSplitTool() {
    const splitModeSelect = document.getElementById('split-mode') as HTMLSelectElement | null;
    const rangePanel = document.getElementById('range-panel');
    const visualPanel = document.getElementById('visual-select-panel');
    const evenOddPanel = document.getElementById('even-odd-panel');
    const zipOptionWrapper = document.getElementById('zip-option-wrapper');
    const allPagesPanel = document.getElementById('all-pages-panel');

    if (!splitModeSelect) return;

    const applyMode = () => {
        const mode = splitModeSelect.value;
                
        if (mode !== 'visual') {
            visualSelectorRendered = false;
            selectedScissorPages = [];
            const container = document.getElementById('page-selector-grid');
            if (container) container.innerHTML = '';
        }
                
        rangePanel.classList.add('hidden');
        visualPanel.classList.add('hidden');
        evenOddPanel.classList.add('hidden');
        allPagesPanel.classList.add('hidden');
        zipOptionWrapper.classList.add('hidden');
        
        if (mode === 'range') {
            rangePanel.classList.remove('hidden');
            zipOptionWrapper.classList.remove('hidden');
        } else if (mode === 'visual') {
            visualPanel.classList.remove('hidden');
            zipOptionWrapper.classList.remove('hidden');
            if (state.pdfDoc) void renderVisualSelector();
        } else if (mode === 'even-odd') {
            evenOddPanel.classList.remove('hidden');
        } else if (mode === 'all') {
            allPagesPanel.classList.remove('hidden');
        }
    };

    // setupSplitTool is called both when the view mounts and after the PDF is
    // loaded. Bind once, but apply the current/default mode on every call.
    if (!splitModeSelect.dataset.splitSetup) {
        splitModeSelect.dataset.splitSetup = 'true';
        visualSelectorRendered = false;
        splitModeSelect.addEventListener('change', applyMode);
    }
    applyMode();
}


export async function split() {
    // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
    const splitMode = document.getElementById('split-mode').value;
    // @ts-expect-error TS(2339) FIXME: Property 'checked' does not exist on type 'HTMLEle... Remove this comment to see the full error message
    const downloadAsZip = document.getElementById('download-as-zip')?.checked || false;
    
    showLoader('Splitting PDF...');

    try {
        const totalPages = state.pdfDoc.getPageCount();
        let indicesToExtract: number[] = [];
        
        switch (splitMode) {
            case 'range':
                // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'HTMLEleme... Remove this comment to see the full error message
                const pageRangeInput = document.getElementById('page-range').value;
                if (!pageRangeInput) throw new Error('Please enter a page range.');
                const parsed = normalizePageSelection(pageRangeInput, totalPages);
                if (!Array.isArray(parsed)) throw new Error(parsed.error);
                indicesToExtract = parsed;
                break;
                        
            case 'even-odd':
                const choiceElement = document.querySelector('input[name="even-odd-choice"]:checked');
                if (!choiceElement) throw new Error('Please select even or odd pages.');
                // @ts-expect-error TS(2339) FIXME: Property 'value' does not exist on type 'Element'.
                const choice = choiceElement.value;
                for (let i = 0; i < totalPages; i++) {
                    if (choice === 'even' && (i + 1) % 2 === 0) indicesToExtract.push(i);
                    if (choice === 'odd' && (i + 1) % 2 !== 0) indicesToExtract.push(i);
                }
                break;
            case 'all':
                indicesToExtract = Array.from({ length: totalPages }, (_, i) => i);
                break;
            case 'visual':
                indicesToExtract = Array.from(document.querySelectorAll<HTMLElement>('#page-selector-grid .page-thumbnail-wrapper.selected'))
                    .map((element) => Number(element.dataset.pageIndex));
                break;
        }

        // Never pass stale, malformed, one-past-the-end, or duplicate DOM
        // indices into pdf-lib. Invalid indices otherwise surface as the
        // cryptic "Cannot read properties of undefined (reading 'node')".
        let uniqueIndices = [...new Set(indicesToExtract)]
            .filter((index): index is number => Number.isInteger(index) && index >= 0 && index < totalPages)
            .sort((a, b) => a - b);
        if (splitMode === 'visual' && uniqueIndices.length === totalPages) {
            uniqueIndices = Array.from({ length: totalPages }, (_, index) => index);
        }
        if (uniqueIndices.length === 0) {
            throw new Error('No pages were selected for splitting.');
        }
        
        if (splitMode === 'all' || (['range', 'visual'].includes(splitMode) && downloadAsZip)) {
            showLoader('Creating ZIP file...');
            const zip = new JSZip();
            for (const index of uniqueIndices) {
                const newPdf = await PDFLibDocument.create();
                const [copiedPage] = await newPdf.copyPages(state.pdfDoc, [index]);
                if (!copiedPage) throw new Error(`Page ${index + 1} could not be copied.`);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                zip.file(`page-${index + 1}.pdf`, pdfBytes);
            }
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            downloadFile(zipBlob, 'split-pages.zip');
        } else {
            const newPdf = await PDFLibDocument.create();
            const copiedPages = await newPdf.copyPages(state.pdfDoc, uniqueIndices);
            copiedPages.forEach((page: any) => newPdf.addPage(page));
            const pdfBytes = await newPdf.save();
            downloadFile(new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }), 'split-document.pdf');
        }
        
        if (splitMode === 'visual') {
            visualSelectorRendered = false;
        }
    } catch (e) {
        console.error(e);
        showAlert('Error', e.message || 'Failed to split PDF. Please check your selection.');
    } finally {
        hideLoader();
    }
}
