import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';
import html2canvas from 'html2canvas';
import * as pdfjsLib from 'pdfjs-dist';
import { canvasRectToPdfRect, isSupportedSignatureImage } from '../utils/signature.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type SignatureAsset = { id: number; image: HTMLImageElement; label: string };
type PlacedSignature = {
  id: number;
  assetId: number;
  image: HTMLImageElement;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

const signState = {
  pdf: null as any,
  canvas: null as HTMLCanvasElement | null,
  context: null as CanvasRenderingContext2D | null,
  currentPageNum: 1,
  scale: 1,
  pageSnapshot: null as ImageData | null,
  drawCanvas: null as HTMLCanvasElement | null,
  drawContext: null as CanvasRenderingContext2D | null,
  savedSignatures: [] as SignatureAsset[],
  placedSignatures: [] as PlacedSignature[],
  activeAssetId: null as number | null,
  selectedPlacementId: null as number | null,
  interaction: null as null | {
    mode: 'move' | 'resize';
    id: number;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    originalWidth: number;
    originalHeight: number;
  },
  renderToken: 0,
};

export function resetSignState() {
  signState.pdf = null;
  signState.canvas = null;
  signState.context = null;
  signState.currentPageNum = 1;
  signState.scale = 1;
  signState.pageSnapshot = null;
  signState.drawCanvas = null;
  signState.drawContext = null;
  signState.savedSignatures = [];
  signState.placedSignatures = [];
  signState.activeAssetId = null;
  signState.selectedPlacementId = null;
  signState.interaction = null;
  signState.renderToken += 1;
}

function setStatus(message: string) {
  const status = document.getElementById('signature-status');
  if (status) status.textContent = message;
}

function getCanvasPoint(event: PointerEvent) {
  const rect = signState.canvas!.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (signState.canvas!.width / rect.width),
    y: (event.clientY - rect.top) * (signState.canvas!.height / rect.height),
  };
}

function currentPagePlacements() {
  return signState.placedSignatures.filter(item => item.pageIndex === signState.currentPageNum - 1);
}

function placementAt(x: number, y: number) {
  return [...currentPagePlacements()].reverse().find(item =>
    x >= item.x && x <= item.x + item.width && y >= item.y && y <= item.y + item.height,
  );
}

function drawPageOverlay() {
  if (!signState.context || !signState.pageSnapshot) return;
  signState.context.putImageData(signState.pageSnapshot, 0, 0);
  for (const item of currentPagePlacements()) {
    signState.context.drawImage(item.image, item.x, item.y, item.width, item.height);
    if (item.id === signState.selectedPlacementId) {
      signState.context.save();
      signState.context.strokeStyle = '#586c79';
      signState.context.lineWidth = 2;
      signState.context.setLineDash([7, 4]);
      signState.context.strokeRect(item.x, item.y, item.width, item.height);
      signState.context.setLineDash([]);
      signState.context.fillStyle = '#586c79';
      signState.context.fillRect(item.x + item.width - 6, item.y + item.height - 6, 12, 12);
      signState.context.restore();
    }
  }
  const deleteButton = document.getElementById('delete-signature-btn') as HTMLButtonElement | null;
  if (deleteButton) deleteButton.disabled = signState.selectedPlacementId === null;
}

async function renderPage(pageNumber: number) {
  const token = ++signState.renderToken;
  const page = await signState.pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: signState.scale });
  const canvas = signState.canvas!;
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, canvasContext: signState.context!, viewport }).promise;
  if (token !== signState.renderToken) return;
  signState.pageSnapshot = signState.context!.getImageData(0, 0, canvas.width, canvas.height);
  drawPageOverlay();
  document.getElementById('current-page-display-sign')!.textContent = String(pageNumber);
  (document.getElementById('prev-page-sign') as HTMLButtonElement).disabled = pageNumber <= 1;
  (document.getElementById('next-page-sign') as HTMLButtonElement).disabled = pageNumber >= signState.pdf.numPages;
}

async function fitToWidth() {
  const page = await signState.pdf.getPage(signState.currentPageNum);
  const container = document.getElementById('canvas-container-sign')!;
  const baseWidth = page.getViewport({ scale: 1 }).width;
  signState.scale = Math.max(0.25, Math.min(2.5, (container.clientWidth - 24) / baseWidth));
  await renderPage(signState.currentPageNum);
}

function trimmedDrawingDataUrl(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')!;
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width;
  let right = -1;
  let top = canvas.height;
  let bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (pixels.data[(y * canvas.width + x) * 4 + 3] > 8) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  if (right < left || bottom < top) return null;
  const padding = 12;
  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(canvas.width - 1, right + padding);
  bottom = Math.min(canvas.height - 1, bottom + padding);
  const output = document.createElement('canvas');
  output.width = right - left + 1;
  output.height = bottom - top + 1;
  output.getContext('2d')!.drawImage(canvas, left, top, output.width, output.height, 0, 0, output.width, output.height);
  return output.toDataURL('image/png');
}

async function dataUrlToPng(dataUrl: string) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext('2d')!.drawImage(image, 0, 0);
  return canvas.toDataURL('image/png');
}

async function addAsset(dataUrl: string, label: string) {
  const image = new Image();
  image.src = await dataUrlToPng(dataUrl);
  await image.decode();
  const asset = { id: Date.now() + Math.random(), image, label };
  signState.savedSignatures.push(asset);
  signState.activeAssetId = asset.id;
  renderAssets();
  setStatus(`${label} selected. Tap the document to place it.`);
}

function renderAssets() {
  const container = document.getElementById('saved-signatures-container')!;
  container.replaceChildren();
  if (!signState.savedSignatures.length) {
    const empty = document.createElement('p');
    empty.className = 'signature-empty';
    empty.textContent = 'Create or upload a signature or stamp to begin.';
    container.appendChild(empty);
    return;
  }
  for (const asset of signState.savedSignatures) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `signature-asset${asset.id === signState.activeAssetId ? ' is-selected' : ''}`;
    button.title = `Select ${asset.label}`;
    const preview = asset.image.cloneNode() as HTMLImageElement;
    preview.alt = asset.label;
    button.appendChild(preview);
    button.onclick = () => {
      signState.activeAssetId = asset.id;
      renderAssets();
      setStatus(`${asset.label} selected. Tap the document to place it.`);
    };
    container.appendChild(button);
  }
}

function setupDrawingCanvas() {
  const canvas = document.getElementById('signature-draw-canvas') as HTMLCanvasElement;
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(600, Math.round(rect.width * ratio));
  canvas.height = Math.round(160 * ratio);
  const context = canvas.getContext('2d')!;
  context.scale(ratio, ratio);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 2.5;
  context.strokeStyle = (document.getElementById('signature-color') as HTMLInputElement).value;
  signState.drawCanvas = canvas;
  signState.drawContext = context;

  let drawing = false;
  const point = (event: PointerEvent) => {
    const bounds = canvas.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };
  canvas.onpointerdown = event => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    const p = point(event);
    context.beginPath();
    context.moveTo(p.x, p.y);
  };
  canvas.onpointermove = event => {
    if (!drawing) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { drawing = false; };
}

function setupPlacement() {
  const canvas = signState.canvas!;
  canvas.onpointerdown = event => {
    const point = getCanvasPoint(event);
    const existing = placementAt(point.x, point.y);
    if (existing) {
      signState.selectedPlacementId = existing.id;
      const resize = point.x >= existing.x + existing.width - 24 && point.y >= existing.y + existing.height - 24;
      signState.interaction = {
        mode: resize ? 'resize' : 'move', id: existing.id,
        startX: point.x, startY: point.y,
        originalX: existing.x, originalY: existing.y,
        originalWidth: existing.width, originalHeight: existing.height,
      };
      canvas.setPointerCapture(event.pointerId);
      drawPageOverlay();
      return;
    }
    const asset = signState.savedSignatures.find(item => item.id === signState.activeAssetId);
    if (!asset) {
      signState.selectedPlacementId = null;
      setStatus('Choose a saved signature or stamp first.');
      drawPageOverlay();
      return;
    }
    const width = Math.min(180, canvas.width * 0.32);
    const height = width * (asset.image.naturalHeight / asset.image.naturalWidth);
    const placed: PlacedSignature = {
      id: Date.now() + Math.random(), assetId: asset.id, image: asset.image,
      pageIndex: signState.currentPageNum - 1,
      x: Math.max(0, Math.min(canvas.width - width, point.x - width / 2)),
      y: Math.max(0, Math.min(canvas.height - height, point.y - height / 2)),
      width, height,
    };
    signState.placedSignatures.push(placed);
    signState.selectedPlacementId = placed.id;
    setStatus('Placed. Drag to move, or drag the corner square to resize.');
    drawPageOverlay();
  };
  canvas.onpointermove = event => {
    if (!signState.interaction) return;
    event.preventDefault();
    const point = getCanvasPoint(event);
    const item = signState.placedSignatures.find(entry => entry.id === signState.interaction!.id);
    if (!item) return;
    const action = signState.interaction;
    if (action.mode === 'move') {
      item.x = Math.max(0, Math.min(canvas.width - item.width, action.originalX + point.x - action.startX));
      item.y = Math.max(0, Math.min(canvas.height - item.height, action.originalY + point.y - action.startY));
    } else {
      const ratio = action.originalWidth / action.originalHeight;
      item.width = Math.max(40, Math.min(canvas.width - item.x, action.originalWidth + point.x - action.startX));
      item.height = item.width / ratio;
      if (item.y + item.height > canvas.height) {
        item.height = canvas.height - item.y;
        item.width = item.height * ratio;
      }
    }
    drawPageOverlay();
  };
  canvas.onpointerup = canvas.onpointercancel = () => { signState.interaction = null; };
}

export async function setupSignTool() {
  resetSignState();
  document.getElementById('signature-editor')!.classList.remove('hidden');
  signState.canvas = document.getElementById('canvas-sign') as HTMLCanvasElement;
  signState.context = signState.canvas.getContext('2d');
  const pdfData = await state.pdfDoc.save();
  signState.pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
  document.getElementById('total-pages-display-sign')!.textContent = String(signState.pdf.numPages);
  setupDrawingCanvas();
  setupPlacement();
  renderAssets();
  await fitToWidth();

  document.getElementById('prev-page-sign')!.onclick = async () => {
    if (signState.currentPageNum > 1) { signState.currentPageNum -= 1; signState.selectedPlacementId = null; await renderPage(signState.currentPageNum); }
  };
  document.getElementById('next-page-sign')!.onclick = async () => {
    if (signState.currentPageNum < signState.pdf.numPages) { signState.currentPageNum += 1; signState.selectedPlacementId = null; await renderPage(signState.currentPageNum); }
  };
  document.getElementById('zoom-in-btn')!.onclick = async () => { signState.scale = Math.min(3, signState.scale + 0.2); await renderPage(signState.currentPageNum); };
  document.getElementById('zoom-out-btn')!.onclick = async () => { signState.scale = Math.max(0.25, signState.scale - 0.2); await renderPage(signState.currentPageNum); };
  document.getElementById('fit-width-btn')!.onclick = fitToWidth;
  document.getElementById('undo-btn')!.onclick = () => {
    const removed = signState.placedSignatures.pop();
    if (removed?.id === signState.selectedPlacementId) signState.selectedPlacementId = null;
    drawPageOverlay();
  };
  document.getElementById('delete-signature-btn')!.onclick = () => {
    signState.placedSignatures = signState.placedSignatures.filter(item => item.id !== signState.selectedPlacementId);
    signState.selectedPlacementId = null;
    drawPageOverlay();
  };

  const tabs = ['draw', 'type', 'upload'];
  for (const tab of tabs) {
    document.getElementById(`${tab}-tab-btn`)!.onclick = () => {
      tabs.forEach(name => {
        document.getElementById(`${name}-panel`)!.classList.toggle('hidden', name !== tab);
        document.getElementById(`${name}-tab-btn`)!.classList.toggle('is-active', name === tab);
      });
    };
  }

  (document.getElementById('signature-color') as HTMLInputElement).oninput = event => {
    signState.drawContext!.strokeStyle = (event.target as HTMLInputElement).value;
  };
  document.getElementById('clear-draw-btn')!.onclick = () => {
    signState.drawContext!.clearRect(0, 0, signState.drawCanvas!.width, signState.drawCanvas!.height);
  };
  document.getElementById('save-draw-btn')!.onclick = async () => {
    const dataUrl = trimmedDrawingDataUrl(signState.drawCanvas!);
    if (!dataUrl) { showAlert('Nothing drawn yet', 'Draw your signature before saving it.'); return; }
    await addAsset(dataUrl, 'Drawn signature');
  };

  const textInput = document.getElementById('signature-text-input') as HTMLInputElement;
  const fontPreview = document.getElementById('font-preview') as HTMLElement;
  const fontFamily = document.getElementById('font-family-select') as HTMLSelectElement;
  const fontColor = document.getElementById('font-color-picker') as HTMLInputElement;
  const updatePreview = () => {
    fontPreview.textContent = textInput.value || 'Your name';
    fontPreview.style.fontFamily = fontFamily.value;
    fontPreview.style.color = fontColor.value;
  };
  [textInput, fontFamily, fontColor].forEach(element => element.addEventListener('input', updatePreview));
  updatePreview();
  document.getElementById('save-type-btn')!.onclick = async () => {
    if (!textInput.value.trim()) { showAlert('Name required', 'Type a name before saving it.'); return; }
    const canvas = await html2canvas(fontPreview, { backgroundColor: null, scale: 2 });
    await addAsset(canvas.toDataURL('image/png'), 'Typed signature');
  };

  (document.getElementById('signature-upload-input') as HTMLInputElement).onchange = async event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!isSupportedSignatureImage(file)) {
      showAlert('Unsupported image', 'Choose a PNG, JPG, or WebP image smaller than 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => addAsset(String(reader.result), file.name);
    reader.readAsDataURL(file);
  };
}

export async function applyAndSaveSignatures() {
  if (!signState.placedSignatures.length) {
    showAlert('Nothing placed yet', 'Place at least one signature or stamp on the document.');
    return;
  }
  showLoader('Adding signatures and stamps...');
  try {
    const pages = state.pdfDoc.getPages();
    for (const item of signState.placedSignatures) {
      const page = pages[item.pageIndex];
      const renderedPage = await signState.pdf.getPage(item.pageIndex + 1);
      const viewport = renderedPage.getViewport({ scale: signState.scale });
      const pdfRect = canvasRectToPdfRect(viewport, item);
      const pngBytes = await fetch(item.image.src).then(response => response.arrayBuffer());
      const image = await state.pdfDoc.embedPng(pngBytes);
      page.drawImage(image, pdfRect);
    }
    const bytes = await state.pdfDoc.save();
    const originalName = state.files[0]?.name?.replace(/\.pdf$/i, '') || 'document';
    downloadFile(new Blob([bytes], { type: 'application/pdf' }), `${originalName}-signed.pdf`);
    showAlert('Signed PDF ready', 'Your visual signature or stamp was added and the download has started.');
  } catch (error) {
    console.error(error);
    showAlert('Could not sign this PDF', 'BreadFile could not add the signature. Try a different image or PDF.');
  } finally {
    hideLoader();
  }
}
