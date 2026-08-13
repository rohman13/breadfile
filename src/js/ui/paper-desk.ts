import { createIcons, icons } from 'lucide';
import { state } from '../state.js';

const COPY: Record<string, { verb: string; summary: string; output: string }> = {
  merge: { verb: 'Bind my PDFs', summary: 'Files will be packed into one PDF in the order shown.', output: 'merged.pdf' },
  split: { verb: 'Cut & pack pages', summary: 'Your chosen groups will be packed as a PDF or ZIP.', output: 'split-document.pdf' },
  'extract-pages': { verb: 'Pack selected pages', summary: 'Selected pages will be packed as individual PDFs in a ZIP.', output: 'extracted-pages.zip' },
  'delete-pages': { verb: 'Make my trimmed PDF', summary: 'Marked pages will be removed. Everything else stays in order.', output: 'pages-removed.pdf' },
  rotate: { verb: 'Make my rotated PDF', summary: 'The turns shown on the desk will be applied to the new PDF.', output: 'rotated.pdf' },
  organize: { verb: 'Make my organized PDF', summary: 'The page order and edits shown above will become your new PDF.', output: 'organized.pdf' },
  compress: { verb: 'Make it smaller', summary: 'Pages will be carefully repacked using your chosen balance.', output: 'compressed.pdf' },
  'sign-pdf': { verb: 'Pack my signed PDF', summary: 'The marks placed on the document will be added to a new PDF.', output: 'signed.pdf' },
  'image-to-pdf': { verb: 'Bind my picture book', summary: 'Images will become PDF pages in the order shown.', output: 'images.pdf' },
  'pdf-to-images': { verb: 'Pack my page images', summary: 'Every page will become an image inside one ZIP parcel.', output: 'page-images.zip' },
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function addUploadArt(dropzone: HTMLElement, multiple: boolean): void {
  dropzone.classList.add('paper-upload-tray');
  const existing = dropzone.querySelector(':scope > div, :scope > span');
  if (!existing) return;
  existing.classList.add('paper-upload-copy');
  const oldIcon = existing.querySelector('svg, [data-lucide]');
  oldIcon?.remove();
  const art = el('span', 'paper-upload-art');
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = '<i></i><i></i><i></i><b>+</b>';
  existing.prepend(art);
  const prompt = existing.querySelector('p, span:not(.paper-upload-art)');
  if (prompt) prompt.innerHTML = `<strong>${multiple ? 'Bring your files to the desk' : 'Drop your PDF on the desk'}</strong><small>Click to browse or drag it here</small>`;
}

function makeStep(number: string, title: string, note: string): HTMLElement {
  const step = el('div', 'paper-step');
  step.innerHTML = `<span>${number}</span><div><strong>${title}</strong><small>${note}</small></div>`;
  return step;
}

function decorateWorkspace(toolId: string, root: HTMLElement): void {
  const dropzone = root.querySelector<HTMLElement>('#drop-zone, label:has(#file-input)');
  if (!dropzone) return;
  const input = root.querySelector<HTMLInputElement>('#file-input');
  const multiple = Boolean(input?.multiple);
  addUploadArt(dropzone, multiple);
  const uploadSection = el('section', 'paper-stage paper-stage--upload');
  uploadSection.append(makeStep('1', multiple ? 'Bring your pieces' : 'Bring your pages', 'Files stay in this browser and leave when you close it.'));
  dropzone.before(uploadSection);
  uploadSection.append(dropzone);

  const fileDisplay = root.querySelector<HTMLElement>('#file-display-area');
  if (fileDisplay) uploadSection.append(fileDisplay);
  const controls = root.querySelector<HTMLElement>('#file-controls');
  if (controls) uploadSection.append(controls);

  const process = root.querySelector<HTMLButtonElement>('#process-btn');
  if (!process) return;
  const cfg = COPY[toolId];
  process.textContent = cfg.verb;

  const actionShelf = el('section', 'paper-action-shelf');
  const left = el('div', 'paper-action-shelf__copy');
  left.innerHTML = `<small>3 · Pack it up</small><strong>${cfg.summary}</strong>`;
  const naming = el('label', 'paper-output-name');
  naming.innerHTML = '<span>Parcel label</span>';
  const output = document.createElement('input');
  output.id = 'paper-output-name';
  output.type = 'text';
  output.value = cfg.output;
  output.setAttribute('aria-label', 'Output file name');
  naming.append(output);
  left.append(naming);
  process.before(actionShelf);
  actionShelf.append(left, process);

  const workspaceTarget = findWorkspace(toolId, root);
  if (workspaceTarget) {
    workspaceTarget.classList.add('paper-workspace');
    const heading = makeStep('2', workspaceTitle(toolId), workspaceNote(toolId));
    workspaceTarget.before(heading);
    heading.classList.add('paper-step--workspace');
  }
}

function findWorkspace(toolId: string, root: HTMLElement): HTMLElement | null {
  const selectors: Record<string, string> = {
    merge: '#merge-options', split: '#split-options', 'extract-pages': '#extract-options',
    'delete-pages': '#delete-options', rotate: '#rotate-all-controls', organize: '#page-organizer',
    compress: '#compress-options', 'sign-pdf': '#signature-editor', 'image-to-pdf': '#image-list',
    'pdf-to-images': '#images-options',
  };
  return root.querySelector<HTMLElement>(selectors[toolId]);
}

function workspaceTitle(id: string): string {
  if (id === 'sign-pdf') return 'Make and place your mark';
  if (id === 'compress' || id === 'pdf-to-images') return 'Choose the finish';
  if (id === 'image-to-pdf') return 'Arrange your picture pages';
  if (id === 'merge') return 'Arrange the bundle';
  return 'Arrange the job';
}
function workspaceNote(id: string): string {
  if (id === 'organize') return 'Drag page cards, turn them, duplicate them, or set them aside.';
  if (id === 'delete-pages') return 'Tap page cards to mark them for removal, or type a range.';
  if (id === 'extract-pages') return 'Tap page cards to choose what should go into the parcel.';
  if (id === 'rotate') return 'Turn one page or use the batch controls for the whole stack.';
  return 'The preview below is the recipe for your new file.';
}

function enhanceFileLabels(root: HTMLElement): MutationObserver {
  const decorate = () => {
    root.querySelectorAll<HTMLElement>('#file-display-area > div, #file-list > li').forEach((item) => {
      if (item.dataset.paperReady) return;
      item.dataset.paperReady = 'true';
      item.classList.add('paper-file-label');
      const pin = el('i', 'paper-file-label__pin');
      pin.setAttribute('aria-hidden', 'true');
      item.prepend(pin);
    });
    const nativeSummary = root.querySelector<HTMLElement>('#file-display-area');
    if (nativeSummary?.childNodes.length === 1 && nativeSummary.firstChild?.nodeType === Node.TEXT_NODE) nativeSummary.classList.add('paper-file-label');
  };
  const observer = new MutationObserver(decorate);
  root.querySelectorAll('#file-display-area, #file-list').forEach((display) => observer.observe(display, { childList: true, subtree: true }));
  decorate();
  return observer;
}

function setupDropAssignment(root: HTMLElement, signal: AbortSignal): void {
  const input = root.querySelector<HTMLInputElement>('#file-input');
  const tray = root.querySelector<HTMLElement>('.paper-upload-tray');
  if (!input || !tray) return;
  const stop = (event: DragEvent) => { event.preventDefault(); event.stopPropagation(); };
  tray.addEventListener('dragenter', (event) => { stop(event); tray.classList.add('is-dragging'); }, { signal });
  tray.addEventListener('dragover', stop, { signal });
  tray.addEventListener('dragleave', (event) => { stop(event); if (!tray.contains(event.relatedTarget as Node | null)) tray.classList.remove('is-dragging'); }, { signal });
  tray.addEventListener('drop', (event) => {
    stop(event); tray.classList.remove('is-dragging');
    const incoming = Array.from(event.dataTransfer?.files ?? []);
    if (!incoming.length) return;
    const transfer = new DataTransfer();
    (input.multiple ? incoming : incoming.slice(0, 1)).forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { signal });
}

function setupProgressiveReveal(root: HTMLElement, signal: AbortSignal): void {
  const input = root.querySelector<HTMLInputElement>('#file-input');
  if (!input) return;
  const update = () => root.classList.toggle('paper-awaiting-files', !input.files?.length);
  update();
  input.addEventListener('change', update, { signal });
}

function enhanceGeneratedCards(toolId: string, root: HTMLElement): MutationObserver {
  const observer = new MutationObserver(() => {
    let changed = false;
    root.querySelectorAll<HTMLElement>('.page-thumbnail, .page-rotator-item, .page-thumbnail-wrapper, .image-sheet').forEach((card) => {
      if (card.dataset.paperCard) return;
      changed = true;
      card.dataset.paperCard = 'true';
      card.classList.add('paper-page-card');
      if (toolId === 'organize') addOrganizeActions(card, root);
    });
    if (changed || toolId === 'rotate') updateSummary(toolId, root);
  });
  root.querySelectorAll('#page-organizer, #page-rotator, #image-list, #page-merge-preview, #page-selector-grid')
    .forEach((container) => observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-rotation'],
    }));
  return observer;
}

async function renderPagePicker(toolId: string, file: File, root: HTMLElement): Promise<void> {
  const inputId = toolId === 'delete-pages' ? 'pages-to-delete' : 'pages-to-extract';
  const rangeInput = root.querySelector<HTMLInputElement>(`#${inputId}`);
  const options = root.querySelector<HTMLElement>(toolId === 'delete-pages' ? '#delete-options' : '#extract-options');
  if (!rangeInput || !options) return;
  options.querySelector('.paper-page-picker')?.remove();
  const picker = el('div', 'paper-page-picker');
  const summary = el('p', 'paper-page-picker__summary', toolId === 'delete-pages' ? 'No pages marked · the whole document stays' : 'No pages selected yet');
  const grid = el('div', 'paper-page-picker__grid');
  picker.append(summary, grid);
  const firstLabel = options.querySelector('label');
  options.insertBefore(picker, firstLabel ?? options.firstChild);
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const selected = new Set<number>();
  const sync = () => {
    rangeInput.value = Array.from(selected).sort((a, b) => a - b).join(', ');
    const total = pdf.numPages;
    summary.textContent = toolId === 'delete-pages'
      ? `${selected.size} page${selected.size === 1 ? '' : 's'} will be removed · ${total - selected.size} will remain`
      : `${selected.size} page${selected.size === 1 ? '' : 's'} will be packed · ${total - selected.size} left behind`;
  };
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: .32 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
    await page.render({ canvas, canvasContext: canvas.getContext('2d')!, viewport }).promise;
    const card = el('button', 'paper-page-card paper-picker-card') as HTMLButtonElement;
    card.type = 'button'; card.dataset.pageNumber = String(number);
    const image = document.createElement('img'); image.src = canvas.toDataURL(); image.alt = `Page ${number}`;
    const label = el('span', 'paper-picker-card__label', `Page ${number}`);
    const stamp = el('span', 'paper-picker-card__stamp', toolId === 'delete-pages' ? 'REMOVE' : 'PACK');
    card.append(image, label, stamp);
    card.onclick = () => { selected.has(number) ? selected.delete(number) : selected.add(number); card.classList.toggle('is-selected', selected.has(number)); sync(); };
    grid.append(card);
  }
  rangeInput.addEventListener('input', () => {
    selected.clear();
    rangeInput.value.split(',').forEach((part) => {
      const match = part.trim().match(/^(\d+)(?:-(\d+))?$/); if (!match) return;
      const start = Number(match[1]); const end = Number(match[2] || match[1]);
      for (let n = start; n <= end && n <= pdf.numPages; n += 1) if (n > 0) selected.add(n);
    });
    grid.querySelectorAll<HTMLElement>('.paper-picker-card').forEach((card) => card.classList.toggle('is-selected', selected.has(Number(card.dataset.pageNumber))));
  });
}

function setupVisualPicker(toolId: string, root: HTMLElement, signal: AbortSignal): void {
  if (!['delete-pages', 'extract-pages'].includes(toolId)) return;
  const input = root.querySelector<HTMLInputElement>('#file-input');
  input?.addEventListener('change', () => { const file = input.files?.[0]; if (file) window.setTimeout(() => void renderPagePicker(toolId, file, root), 100); }, { signal });
}

function setupOrganizeHistory(toolId: string, root: HTMLElement, signal: AbortSignal): void {
  if (toolId !== 'organize') return;
  const container = root.querySelector<HTMLElement>('#page-organizer'); if (!container) return;
  const controls = el('div', 'paper-workspace-tools');
  controls.innerHTML = '<span>Page desk</span><div><button type="button" data-organize-undo disabled><i data-lucide="undo-2"></i> Undo</button><button type="button" data-organize-reset><i data-lucide="refresh-ccw"></i> Restore original</button></div>';
  container.before(controls);
  const undo = controls.querySelector<HTMLButtonElement>('[data-organize-undo]')!;
  const reset = controls.querySelector<HTMLButtonElement>('[data-organize-reset]')!;
  let original: HTMLElement[] = [];
  const history: Array<() => void> = [];
  const refreshUndo = () => { undo.disabled = history.length === 0; };
  const expectedPages = () => state.pdfDoc?.getPageCount?.() ?? 0;
  const captureOriginal = () => {
    const cards = Array.from(container.children) as HTMLElement[];
    if (!original.length && expectedPages() > 0 && cards.length === expectedPages()) original = [...cards];
  };
  const observer = new MutationObserver(captureOriginal);
  observer.observe(container, { childList: true });
  captureOriginal();
  root.addEventListener('click', (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('.delete-page-btn');
    const card = button?.closest<HTMLElement>('.page-thumbnail');
    if (!button || !card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (container.children.length <= 1) return;
    const next = card.nextElementSibling;
    card.remove();
    history.push(() => {
      if (next?.parentElement === container) container.insertBefore(card, next);
      else container.append(card);
      updateSummary(toolId, root);
    });
    refreshUndo();
    updateSummary(toolId, root);
  }, { capture: true, signal });
  root.addEventListener('breadfile:organize-duplicate', (event) => {
    const copy = (event as CustomEvent<{ copy: HTMLElement }>).detail.copy;
    history.push(() => { copy.remove(); updateSummary(toolId, root); });
    refreshUndo();
  }, { signal });
  undo.onclick = () => { history.pop()?.(); refreshUndo(); };
  reset.onclick = () => {
    if (!original.length) return;
    container.replaceChildren(...original);
    history.length = 0;
    refreshUndo();
    original.forEach((card) => {
      card.classList.remove('is-selected');
      card.dataset.rotation = '0';
      const image = card.querySelector<HTMLElement>('img');
      if (image) image.style.transform = '';
    });
    updateSummary(toolId, root);
  };
  signal.addEventListener('abort', () => observer.disconnect(), { once: true });
}

function setupRotateSelection(toolId: string, root: HTMLElement, signal: AbortSignal): void {
  if (toolId !== 'rotate') return;
  const container = root.querySelector<HTMLElement>('#page-rotator'); if (!container) return;
  const bar = el('div', 'paper-workspace-tools paper-workspace-tools--rotate');
  bar.innerHTML = '<span>Selected pages</span><div><button type="button" data-turn-selected="-1"><i data-lucide="rotate-ccw"></i> Left</button><button type="button" data-turn-selected="1"><i data-lucide="rotate-cw"></i> Right</button></div>';
  container.before(bar);
  root.addEventListener('click', (event) => { const card = (event.target as Element).closest<HTMLElement>('.page-rotator-item'); if (card && !(event.target as Element).closest('button')) card.classList.toggle('is-selected'); }, { signal });
  bar.querySelectorAll<HTMLButtonElement>('[data-turn-selected]').forEach((button) => button.onclick = () => {
    const direction = Number(button.dataset.turnSelected);
    root.querySelectorAll<HTMLElement>('.page-rotator-item.is-selected').forEach((card) => { const rotation = (Number(card.dataset.rotation || 0) + direction * 90 + 360) % 360; card.dataset.rotation = String(rotation); const image = card.querySelector<HTMLElement>('img'); if (image) image.style.transform = `rotate(${rotation}deg)`; });
  });
}

function snapshot(container: HTMLElement): string[] {
  return Array.from(container.children).map((c) => `${(c as HTMLElement).dataset.pageIndex}:${(c as HTMLElement).dataset.rotation || '0'}`);
}
function restore(container: HTMLElement, order: string[]): void {
  const pool = Array.from(container.children) as HTMLElement[];
  order.forEach((entry) => {
    const [idx, rot] = entry.split(':');
    const card = pool.find((c) => c.dataset.pageIndex === idx && !c.dataset.restored);
    if (!card) return;
    card.dataset.restored = '1'; card.dataset.rotation = rot;
    const image = card.querySelector<HTMLElement>('img'); if (image) image.style.transform = `rotate(${rot}deg)`;
    container.append(card);
  });
  pool.forEach((c) => delete c.dataset.restored);
}

function addOrganizeActions(card: HTMLElement, root: HTMLElement): void {
  if (card.querySelector(':scope > .paper-card-actions')) return;
  const container = card.parentElement!;
  const toolbar = el('div', 'paper-card-actions');
  const select = document.createElement('button'); select.type = 'button'; select.title = 'Select page'; select.innerHTML = '<i data-lucide="check"></i>';
  const rotate = document.createElement('button'); rotate.type = 'button'; rotate.title = 'Rotate page'; rotate.innerHTML = '<i data-lucide="rotate-cw"></i>';
  const duplicate = document.createElement('button'); duplicate.type = 'button'; duplicate.title = 'Duplicate page'; duplicate.innerHTML = '<i data-lucide="copy"></i>';
  select.onclick = () => card.classList.toggle('is-selected');
  rotate.onclick = () => {
    const cards: HTMLElement[] = card.classList.contains('is-selected')
      ? Array.from(root.querySelectorAll<HTMLElement>('#page-organizer .is-selected'))
      : [card];
    cards.forEach((target) => { const r = (Number(target.dataset.rotation || 0) + 90) % 360; target.dataset.rotation = String(r); const img = target.querySelector<HTMLElement>('img'); if (img) img.style.transform = `rotate(${r}deg)`; });
  };
  duplicate.onclick = () => {
    const copy = card.cloneNode(true) as HTMLElement;
    // Clone only page content/state. Paper Desk controls are regenerated once
    // by the observer, and deletion is handled by the delegated listener.
    copy.querySelectorAll('.paper-card-actions').forEach((actions) => actions.remove());
    copy.removeAttribute('data-paper-card');
    copy.classList.remove('is-selected');
    container.insertBefore(copy, card.nextSibling);
    root.dispatchEvent(new CustomEvent('breadfile:organize-duplicate', { detail: { copy } }));
    updateSummary('organize', root);
  };
  toolbar.append(select, rotate, duplicate);
  card.append(toolbar);
  createIcons({ icons });
}

function updateSummary(toolId: string, root: HTMLElement): void {
  const shelf = root.querySelector('.paper-action-shelf__copy strong');
  if (!shelf) return;
  if (toolId === 'organize') shelf.textContent = `${root.querySelectorAll('#page-organizer > .page-thumbnail').length} pages will be packed in the order shown.`;
  if (toolId === 'rotate') shelf.textContent = `${root.querySelectorAll('#page-rotator > .page-rotator-item[data-rotation]:not([data-rotation="0"])').length} page turns will be applied.`;
  if (toolId === 'image-to-pdf') shelf.textContent = `${root.querySelectorAll('#image-list > li').length} pictures will become PDF pages.`;
}

function setupDirtyGuard(root: HTMLElement): () => void {
  let dirty = false;
  const mark = (event: Event) => { if ((event.target as Element)?.closest?.('input, select, button, .paper-page-card')) dirty = true; };
  root.addEventListener('change', mark); root.addEventListener('click', mark);
  const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
  window.addEventListener('beforeunload', beforeUnload);
  return () => window.removeEventListener('beforeunload', beforeUnload);
}

function showParcel(root: HTMLElement, filename: string): void {
  root.querySelector('.paper-parcel')?.remove();
  const parcel = el('section', 'paper-parcel');
  parcel.innerHTML = `<span class="paper-parcel__string" aria-hidden="true"></span><small>Fresh from the workbench</small><strong>${filename}</strong><p>Your download has started. The working copies remain only in this tab.</p><div><button type="button" data-parcel-again>Start another</button><button type="button" data-parcel-tools>Return to tools</button></div>`;
  root.append(parcel);
  parcel.querySelector<HTMLButtonElement>('[data-parcel-again]')!.onclick = () => location.reload();
  parcel.querySelector<HTMLButtonElement>('[data-parcel-tools]')!.onclick = () => document.getElementById('back-to-grid')?.click();
  parcel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function mountPaperDesk(toolId: string, root: HTMLElement): () => void {
  const controller = new AbortController();
  root.classList.add('paper-desk', `paper-desk--${toolId}`);
  decorateWorkspace(toolId, root);
  const fileObserver = enhanceFileLabels(root);
  const cardObserver = enhanceGeneratedCards(toolId, root);
  setupProgressiveReveal(root, controller.signal);
  setupDropAssignment(root, controller.signal);
  setupVisualPicker(toolId, root, controller.signal);
  setupOrganizeHistory(toolId, root, controller.signal);
  setupRotateSelection(toolId, root, controller.signal);
  const disposeGuard = setupDirtyGuard(root);
  const downloaded = (event: Event) => showParcel(root, (event as CustomEvent<{ filename: string }>).detail.filename);
  window.addEventListener('breadfile:download', downloaded);
  createIcons({ icons });
  return () => { controller.abort(); fileObserver.disconnect(); cardObserver.disconnect(); disposeGuard(); window.removeEventListener('breadfile:download', downloaded); };
}
