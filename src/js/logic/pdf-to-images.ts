import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile, readFileAsArrayBuffer } from '../utils/helpers.js';
import { state } from '../state.js';
import { getPdfImageExportOptions } from '../utils/conversionOptions.js';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('This browser could not create a page image.'));
    }, mimeType, quality);
  });
}

export async function pdfToImages() {
  const file = state.files[0];
  if (!file) {
    showAlert('Choose a PDF', 'Add a PDF before exporting its pages.');
    return;
  }

  const format = (document.getElementById('image-format') as HTMLSelectElement | null)?.value ?? 'jpg';
  const scale = Number((document.getElementById('image-quality') as HTMLSelectElement | null)?.value ?? '2');
  const options = getPdfImageExportOptions(format);
  let pdf: any;

  showLoader('Reading PDF…');
  try {
    const source = await readFileAsArrayBuffer(file) as ArrayBuffer;
    pdf = await pdfjsLib.getDocument({ data: source }).promise;
    const zip = new JSZip();
    const digits = Math.max(2, String(pdf.numPages).length);

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      showLoader(`Drawing page ${pageNumber} of ${pdf.numPages}…`);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(viewport.width));
      canvas.height = Math.max(1, Math.round(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable in this browser.');

      if (options.mimeType === 'image/jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      await page.render({ canvasContext: context, canvas, viewport }).promise;
      const blob = await canvasToBlob(canvas, options.mimeType, options.quality);
      zip.file(`page-${String(pageNumber).padStart(digits, '0')}.${options.extension}`, blob);
      page.cleanup();
    }

    showLoader('Packing images into a ZIP…');
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadFile(zipBlob, options.zipName);
    showAlert('Pages are ready', `${pdf.numPages} ${options.extension.toUpperCase()} image${pdf.numPages === 1 ? '' : 's'} saved in one ZIP file.`);
  } catch (error) {
    console.error('PDF image export failed:', error);
    showAlert('Could not export these pages', error instanceof Error ? error.message : 'The PDF may be damaged or password-protected.');
  } finally {
    await pdf?.destroy?.();
    hideLoader();
  }
}
