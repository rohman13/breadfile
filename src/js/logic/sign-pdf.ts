import { showLoader, hideLoader, showAlert } from '../ui.js';
import { downloadFile } from '../utils/helpers.js';
import { state } from '../state.js';
import * as pdfjsLib from 'pdfjs-dist';
import { canvasRectToPdfRect, isSupportedSignatureImage } from '../utils/signature.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

type SignatureAsset = { id: number; image: HTMLImageElement; label: string };
type PlacedSignature = { id: number; assetId: number; image: HTMLImageElement; pageIndex: number; x: number; y: number; width: number; height: number };
type PlacementSnapshot = Omit<PlacedSignature, 'image'>;

type Interaction = {
  mode: 'move' | 'resize'; id: number; pointerId: number;
  startX: number; startY: number; original: PlacementSnapshot;
};

const signState = {
  pdf: null as any,
  canvas: null as HTMLCanvasElement | null,
  context: null as CanvasRenderingContext2D | null,
  overlay: null as HTMLElement | null,
  stage: null as HTMLElement | null,
  currentPageNum: 1,
  scale: 1,
  drawCanvas: null as HTMLCanvasElement | null,
  drawContext: null as CanvasRenderingContext2D | null,
  savedSignatures: [] as SignatureAsset[],
  placedSignatures: [] as PlacedSignature[],
  activeAssetId: null as number | null,
  selectedPlacementId: null as number | null,
  interaction: null as Interaction | null,
  history: [] as PlacementSnapshot[][],
  renderToken: 0,
};

function snapshot(): PlacementSnapshot[] {
  return signState.placedSignatures.map(({ image: _image, ...item }) => ({ ...item }));
}
function pushHistory() { signState.history.push(snapshot()); if (signState.history.length > 60) signState.history.shift(); updateButtons(); }
function restore(items: PlacementSnapshot[]) {
  signState.placedSignatures = items.map(item => ({ ...item, image: signState.savedSignatures.find(asset => asset.id === item.assetId)!.image }));
  signState.selectedPlacementId = null; renderPlacements(); updateButtons();
}

export function resetSignState() {
  Object.assign(signState, {
    pdf: null, canvas: null, context: null, overlay: null, stage: null,
    currentPageNum: 1, scale: 1, drawCanvas: null, drawContext: null,
    savedSignatures: [], placedSignatures: [], activeAssetId: null,
    selectedPlacementId: null, interaction: null, history: [],
  });
  signState.renderToken += 1;
}

function setStatus(message: string) { const status = document.getElementById('signature-status'); if (status) status.textContent = message; }
function currentPlacements() { return signState.placedSignatures.filter(item => item.pageIndex === signState.currentPageNum - 1); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
function pointInStage(event: PointerEvent) {
  const rect = signState.stage!.getBoundingClientRect();
  return { x: clamp((event.clientX - rect.left) / rect.width, 0, 1), y: clamp((event.clientY - rect.top) / rect.height, 0, 1) };
}

function updateButtons() {
  const undo = document.getElementById('undo-btn') as HTMLButtonElement | null;
  const remove = document.getElementById('delete-signature-btn') as HTMLButtonElement | null;
  if (undo) undo.disabled = signState.history.length === 0;
  if (remove) remove.disabled = signState.selectedPlacementId === null;
}

function renderPlacements() {
  const overlay = signState.overlay; if (!overlay) return;
  overlay.replaceChildren();
  for (const item of currentPlacements()) {
    const object = document.createElement('div');
    object.className = `signature-object${item.id === signState.selectedPlacementId ? ' is-selected' : ''}`;
    object.dataset.placementId = String(item.id);
    Object.assign(object.style, { left: `${item.x * 100}%`, top: `${item.y * 100}%`, width: `${item.width * 100}%`, height: `${item.height * 100}%` });
    const image = item.image.cloneNode() as HTMLImageElement; image.alt = 'Placed signature or stamp'; image.draggable = false;
    const resize = document.createElement('span'); resize.className = 'signature-object__resize'; resize.setAttribute('aria-hidden', 'true');
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'signature-object__remove'; remove.title = 'Remove mark'; remove.setAttribute('aria-label', 'Remove mark'); remove.textContent = '×';
    remove.onclick = event => { event.stopPropagation(); pushHistory(); signState.placedSignatures = signState.placedSignatures.filter(entry => entry.id !== item.id); signState.selectedPlacementId = null; renderPlacements(); setStatus('Mark removed.'); };
    object.append(image, resize, remove); overlay.append(object);
  }
  updateButtons();
}

async function renderPage(pageNumber: number) {
  const token = ++signState.renderToken;
  const page = await signState.pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: signState.scale });
  const canvas = signState.canvas!;
  canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
  signState.stage!.style.width = `${canvas.width}px`; signState.stage!.style.height = `${canvas.height}px`;
  await page.render({ canvas, canvasContext: signState.context!, viewport }).promise;
  if (token !== signState.renderToken) return;
  renderPlacements();
  document.getElementById('current-page-display-sign')!.textContent = String(pageNumber);
  (document.getElementById('prev-page-sign') as HTMLButtonElement).disabled = pageNumber <= 1;
  (document.getElementById('next-page-sign') as HTMLButtonElement).disabled = pageNumber >= signState.pdf.numPages;
}

async function fitToWidth() {
  const page = await signState.pdf.getPage(signState.currentPageNum);
  const container = document.getElementById('canvas-container-sign')!;
  const baseWidth = page.getViewport({ scale: 1 }).width;
  signState.scale = clamp((container.clientWidth - 26) / baseWidth, .25, 2.5);
  await renderPage(signState.currentPageNum);
}

function setupDrawingCanvas() {
  const canvas = document.getElementById('signature-draw-canvas') as HTMLCanvasElement;
  const ratio = window.devicePixelRatio || 1;
  const cssWidth = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
  canvas.width = Math.round(cssWidth * ratio); canvas.height = Math.round(160 * ratio);
  const context = canvas.getContext('2d')!; context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.lineCap = 'round'; context.lineJoin = 'round'; context.lineWidth = 2.5;
  context.strokeStyle = (document.getElementById('signature-color') as HTMLInputElement).value;
  signState.drawCanvas = canvas; signState.drawContext = context;
  let drawing = false;
  const point = (event: PointerEvent) => { const bounds = canvas.getBoundingClientRect(); return { x: event.clientX - bounds.left, y: event.clientY - bounds.top }; };
  canvas.onpointerdown = event => { event.preventDefault(); drawing = true; canvas.setPointerCapture(event.pointerId); const p = point(event); context.beginPath(); context.moveTo(p.x, p.y); };
  canvas.onpointermove = event => { if (!drawing) return; event.preventDefault(); const p = point(event); context.lineTo(p.x, p.y); context.stroke(); };
  canvas.onpointerup = canvas.onpointercancel = () => { drawing = false; };
}

function trimmedDrawingDataUrl(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')!; const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width, right = -1, top = canvas.height, bottom = -1;
  for (let y = 0; y < canvas.height; y += 1) for (let x = 0; x < canvas.width; x += 1) if (pixels.data[(y * canvas.width + x) * 4 + 3] > 8) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
  if (right < left || bottom < top) return null;
  const padding = Math.round(12 * (window.devicePixelRatio || 1)); left = Math.max(0, left - padding); top = Math.max(0, top - padding); right = Math.min(canvas.width - 1, right + padding); bottom = Math.min(canvas.height - 1, bottom + padding);
  const output = document.createElement('canvas'); output.width = right - left + 1; output.height = bottom - top + 1;
  output.getContext('2d')!.drawImage(canvas, left, top, output.width, output.height, 0, 0, output.width, output.height);
  return output.toDataURL('image/png');
}

async function normalizeImage(dataUrl: string) {
  const image = new Image(); image.src = dataUrl; await image.decode();
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
  canvas.getContext('2d')!.drawImage(image, 0, 0); return canvas.toDataURL('image/png');
}
async function addAsset(dataUrl: string, label: string) {
  const image = new Image(); image.src = await normalizeImage(dataUrl); await image.decode();
  const asset = { id: Date.now() + Math.random(), image, label }; signState.savedSignatures.push(asset); signState.activeAssetId = asset.id;
  renderAssets(); setStatus(`${label} selected. Tap the document to place it.`);
}
function renderAssets() {
  const container = document.getElementById('saved-signatures-container')!; container.replaceChildren();
  if (!signState.savedSignatures.length) { const empty = document.createElement('p'); empty.className = 'signature-empty'; empty.textContent = 'Create or upload a signature or stamp to begin.'; container.append(empty); return; }
  for (const asset of signState.savedSignatures) {
    const button = document.createElement('button'); button.type = 'button'; button.className = `signature-asset${asset.id === signState.activeAssetId ? ' is-selected' : ''}`; button.title = `Select ${asset.label}`;
    const image = asset.image.cloneNode() as HTMLImageElement; image.alt = asset.label; button.append(image);
    button.onclick = () => { signState.activeAssetId = asset.id; renderAssets(); setStatus(`${asset.label} selected. Tap the document to place it.`); }; container.append(button);
  }
}

function typedSignatureDataUrl(text: string, style: 'handwritten' | 'script', color: string) {
  const canvas = document.createElement('canvas'); canvas.width = 1000; canvas.height = 260; const context = canvas.getContext('2d')!;
  const font = style === 'handwritten' ? '88px "Segoe Print", "Bradley Hand", cursive' : '104px "URW Chancery L", "Apple Chancery", "Snell Roundhand", cursive';
  context.font = font; context.fillStyle = color; context.textBaseline = 'middle'; context.textAlign = 'center';
  context.save(); if (style === 'handwritten') context.rotate(-.025); context.fillText(text, 500, 130, 930); context.restore();
  return canvas.toDataURL('image/png');
}

function setupPlacement() {
  const overlay = signState.overlay!;
  overlay.onpointerdown = event => {
    if ((event.target as Element).closest('.signature-object__remove')) return;
    const object = (event.target as Element).closest<HTMLElement>('.signature-object'); const point = pointInStage(event);
    if (object) {
      const item = signState.placedSignatures.find(entry => entry.id === Number(object.dataset.placementId)); if (!item) return;
      signState.selectedPlacementId = item.id; const mode = (event.target as Element).closest('.signature-object__resize') ? 'resize' : 'move';
      signState.interaction = { mode, id: item.id, pointerId: event.pointerId, startX: point.x, startY: point.y, original: { id: item.id, assetId: item.assetId, pageIndex: item.pageIndex, x: item.x, y: item.y, width: item.width, height: item.height } };
      overlay.setPointerCapture(event.pointerId); renderPlacements(); event.preventDefault(); return;
    }
    const asset = signState.savedSignatures.find(item => item.id === signState.activeAssetId);
    if (!asset) { signState.selectedPlacementId = null; renderPlacements(); setStatus('Choose a saved signature or stamp first.'); return; }
    pushHistory(); const width = Math.min(.34, 190 / signState.stage!.clientWidth); const aspect = asset.image.naturalHeight / asset.image.naturalWidth; const height = Math.min(.28, width * aspect * (signState.stage!.clientWidth / signState.stage!.clientHeight));
    const placed: PlacedSignature = { id: Date.now() + Math.random(), assetId: asset.id, image: asset.image, pageIndex: signState.currentPageNum - 1, x: clamp(point.x - width / 2, 0, 1 - width), y: clamp(point.y - height / 2, 0, 1 - height), width, height };
    signState.placedSignatures.push(placed); signState.selectedPlacementId = placed.id; renderPlacements(); setStatus('Placed. Drag to move; use the corner handle to resize.');
  };
  overlay.onpointermove = event => {
    const action = signState.interaction; if (!action || action.pointerId !== event.pointerId) return; event.preventDefault();
    const item = signState.placedSignatures.find(entry => entry.id === action.id); if (!item) return; const point = pointInStage(event);
    if (action.mode === 'move') { item.x = clamp(action.original.x + point.x - action.startX, 0, 1 - item.width); item.y = clamp(action.original.y + point.y - action.startY, 0, 1 - item.height); }
    else { const stageRatio = signState.stage!.clientWidth / signState.stage!.clientHeight; const imageRatio = item.image.naturalWidth / item.image.naturalHeight; item.width = clamp(action.original.width + point.x - action.startX, .06, 1 - item.x); item.height = clamp(item.width / imageRatio * stageRatio, .025, 1 - item.y); }
    renderPlacements();
  };
  const finish = (event: PointerEvent) => { const action = signState.interaction; if (!action || action.pointerId !== event.pointerId) return; signState.history.push(signState.placedSignatures.map(item => item.id === action.id ? action.original : ({ id: item.id, assetId: item.assetId, pageIndex: item.pageIndex, x: item.x, y: item.y, width: item.width, height: item.height }))); signState.interaction = null; updateButtons(); };
  overlay.onpointerup = overlay.onpointercancel = finish;
}

export async function setupSignTool() {
  resetSignState();
  const editor = document.getElementById('signature-editor')!;
  editor.classList.add('signature-editor--loading');
  signState.pdf = await pdfjsLib.getDocument({ data: await state.pdfDoc.save() }).promise;
  editor.classList.remove('hidden');
  signState.canvas = document.getElementById('canvas-sign') as HTMLCanvasElement; signState.context = signState.canvas.getContext('2d');
  signState.overlay = document.getElementById('signature-object-layer'); signState.stage = document.getElementById('signature-page-stage');
  document.getElementById('total-pages-display-sign')!.textContent = String(signState.pdf.numPages);
  setupDrawingCanvas(); setupPlacement(); renderAssets(); updateButtons();
  document.getElementById('prev-page-sign')!.onclick = async () => { if (signState.currentPageNum > 1) { signState.currentPageNum -= 1; signState.selectedPlacementId = null; await renderPage(signState.currentPageNum); } };
  document.getElementById('next-page-sign')!.onclick = async () => { if (signState.currentPageNum < signState.pdf.numPages) { signState.currentPageNum += 1; signState.selectedPlacementId = null; await renderPage(signState.currentPageNum); } };
  document.getElementById('zoom-in-btn')!.onclick = async () => { signState.scale = Math.min(3, signState.scale + .2); await renderPage(signState.currentPageNum); };
  document.getElementById('zoom-out-btn')!.onclick = async () => { signState.scale = Math.max(.25, signState.scale - .2); await renderPage(signState.currentPageNum); };
  document.getElementById('fit-width-btn')!.onclick = fitToWidth;
  document.getElementById('undo-btn')!.onclick = () => { const previous = signState.history.pop(); if (previous) restore(previous); };
  document.getElementById('delete-signature-btn')!.onclick = () => { if (signState.selectedPlacementId === null) return; pushHistory(); signState.placedSignatures = signState.placedSignatures.filter(item => item.id !== signState.selectedPlacementId); signState.selectedPlacementId = null; renderPlacements(); };

  const tabs = ['draw', 'handwritten', 'script', 'upload'];
  for (const tab of tabs) document.getElementById(`${tab}-tab-btn`)!.onclick = () => tabs.forEach(name => { document.getElementById(`${name}-panel`)!.classList.toggle('hidden', name !== tab); document.getElementById(`${name}-tab-btn`)!.classList.toggle('is-active', name === tab); });
  (document.getElementById('signature-color') as HTMLInputElement).oninput = event => { signState.drawContext!.strokeStyle = (event.target as HTMLInputElement).value; };
  document.getElementById('clear-draw-btn')!.onclick = () => signState.drawContext!.clearRect(0, 0, signState.drawCanvas!.width, signState.drawCanvas!.height);
  document.getElementById('save-draw-btn')!.onclick = async () => { const dataUrl = trimmedDrawingDataUrl(signState.drawCanvas!); if (!dataUrl) return showAlert('Nothing drawn yet', 'Draw your signature before saving it.'); await addAsset(dataUrl, 'Drawn signature'); };
  for (const style of ['handwritten', 'script'] as const) {
    const input = document.getElementById(`${style}-text-input`) as HTMLInputElement; const color = document.getElementById(`${style}-color`) as HTMLInputElement; const preview = document.getElementById(`${style}-preview`)!;
    const update = () => { preview.textContent = input.value || 'Your name'; preview.style.color = color.value; }; input.oninput = color.oninput = update; update();
    document.getElementById(`save-${style}-btn`)!.onclick = async () => { if (!input.value.trim()) return showAlert('Name required', 'Type a name before saving it.'); await addAsset(typedSignatureDataUrl(input.value.trim(), style, color.value), style === 'handwritten' ? 'Handwritten signature' : 'Script signature'); };
  }
  (document.getElementById('signature-upload-input') as HTMLInputElement).onchange = async event => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; if (!isSupportedSignatureImage(file)) return showAlert('Unsupported image', 'Choose a PNG, JPG, or WebP image smaller than 10 MB.'); await addAsset(await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); }), file.name); };
  editor.classList.remove('signature-editor--loading');
  await fitToWidth();
}

export async function applyAndSaveSignatures() {
  if (!signState.placedSignatures.length) return showAlert('Nothing placed yet', 'Place at least one signature or stamp on the document.');
  showLoader('Adding signatures and stamps...');
  try {
    const pages = state.pdfDoc.getPages();
    for (const item of signState.placedSignatures) {
      const page = pages[item.pageIndex]; if (!page) throw new Error(`Page ${item.pageIndex + 1} is unavailable.`);
      const renderedPage = await signState.pdf.getPage(item.pageIndex + 1); const viewport = renderedPage.getViewport({ scale: 1 });
      const pdfRect = canvasRectToPdfRect(viewport, { x: item.x * viewport.width, y: item.y * viewport.height, width: item.width * viewport.width, height: item.height * viewport.height });
      const image = await state.pdfDoc.embedPng(await fetch(item.image.src).then(response => response.arrayBuffer())); page.drawImage(image, pdfRect);
    }
    const bytes = await state.pdfDoc.save(); const originalName = state.files[0]?.name?.replace(/\.pdf$/i, '') || 'document';
    downloadFile(new Blob([bytes], { type: 'application/pdf' }), `${originalName}-signed.pdf`); showAlert('Signed PDF ready', 'Your signature or stamp was added and the download has started.');
  } catch (error) { console.error(error); showAlert('Could not sign this PDF', 'BreadFile could not add the signature. Try a different image or PDF.'); }
  finally { hideLoader(); }
}
