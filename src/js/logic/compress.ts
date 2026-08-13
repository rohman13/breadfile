import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile, readFileAsArrayBuffer, formatBytes } from '../utils/helpers.js';
import { state } from '../state.js';
import { getCompressionPreset } from '../utils/conversionOptions.js';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async blob => {
      if (!blob) {
        reject(new Error('This browser could not create the compressed page image.'));
        return;
      }
      resolve(await blob.arrayBuffer());
    }, 'image/jpeg', quality);
  });
}

export async function compress() {
  const originalFile = state.files[0];
  if (!originalFile) {
    showAlert('Choose a PDF', 'Add a PDF before compressing it.');
    return;
  }

  const presetValue = (document.getElementById('compression-level') as HTMLSelectElement | null)?.value ?? 'balanced';
  const preset = getCompressionPreset(presetValue);
  showLoader('Preparing page 1…');

  let sourcePdf: any;
  try {
    const sourceBytes = await readFileAsArrayBuffer(originalFile) as ArrayBuffer;
    sourcePdf = await pdfjsLib.getDocument({ data: sourceBytes }).promise;
    const outputPdf = await PDFDocument.create();

    for (let pageNumber = 1; pageNumber <= sourcePdf.numPages; pageNumber++) {
      showLoader(`Compressing page ${pageNumber} of ${sourcePdf.numPages}…`);
      const sourcePage = await sourcePdf.getPage(pageNumber);
      const originalViewport = sourcePage.getViewport({ scale: 1 });
      const renderViewport = sourcePage.getViewport({ scale: preset.scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(renderViewport.width));
      canvas.height = Math.max(1, Math.round(renderViewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas is unavailable in this browser.');

      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await sourcePage.render({ canvasContext: context, canvas, viewport: renderViewport }).promise;

      const jpegBytes = await canvasToJpeg(canvas, preset.quality);
      const image = await outputPdf.embedJpg(jpegBytes);
      const outputPage = outputPdf.addPage([originalViewport.width, originalViewport.height]);
      outputPage.drawImage(image, {
        x: 0,
        y: 0,
        width: originalViewport.width,
        height: originalViewport.height,
      });
      sourcePage.cleanup();
    }

    const compressedBytes = await outputPdf.save({ useObjectStreams: true });
    const savedBytes = originalFile.size - compressedBytes.length;
    const resultSize = formatBytes(compressedBytes.length);

    if (savedBytes > 0) {
      downloadFile(
        new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' }),
        'compressed.pdf',
      );
      const percent = Math.round((savedBytes / originalFile.size) * 100);
      showAlert('PDF compressed', `Reduced from ${formatBytes(originalFile.size)} to ${resultSize}. That is ${percent}% smaller.`);
    } else {
      showAlert('Already compact', `BreadFile could not make this PDF smaller, so it left your original file unchanged.`);
    }
  } catch (error) {
    console.error('Compression failed:', error);
    showAlert('Could not compress this PDF', error instanceof Error ? error.message : 'The file may be damaged or password-protected.');
  } finally {
    await sourcePdf?.destroy?.();
    hideLoader();
  }
}
