import { createDropzone } from '../../ui/dropzone.js';

export interface DeletePagesView {
  root: HTMLElement;
  fileInput: HTMLInputElement;
  fileSummary: HTMLElement;
  options: HTMLElement;
  totalPages: HTMLElement;
  pageInput: HTMLInputElement;
  processButton: HTMLButtonElement;
}

export function createDeletePagesView(): DeletePagesView {
  const root = document.createElement('section');
  root.className = 'tool-panel';

  const title = document.createElement('h2');
  title.textContent = 'Delete Pages';
  const description = document.createElement('p');
  description.textContent = 'Remove specific pages or ranges while keeping the rest of your PDF.';

  const { root: dropzone, input: fileInput } = createDropzone();
  const fileSummary = document.createElement('div');
  fileSummary.className = 'mt-4 space-y-2';
  fileSummary.setAttribute('aria-live', 'polite');

  const options = document.createElement('div');
  options.className = 'hidden mt-6';

  const totalLine = document.createElement('p');
  totalLine.className = 'mb-2 font-medium text-white';
  totalLine.append('Total pages: ');
  const totalPages = document.createElement('strong');
  totalPages.id = 'total-pages';
  totalLine.append(totalPages);

  const label = document.createElement('label');
  label.htmlFor = 'pages-to-delete';
  label.className = 'block mb-2 text-sm font-medium text-gray-300';
  label.textContent = 'Pages to delete (for example: 2, 4-6, 9)';

  const pageInput = document.createElement('input');
  pageInput.id = 'pages-to-delete';
  pageInput.type = 'text';
  pageInput.inputMode = 'text';
  pageInput.placeholder = '2, 4-6, 9';
  pageInput.className = 'w-full bg-gray-700 border border-gray-600 text-white rounded-lg p-2.5 mb-6';

  const processButton = document.createElement('button');
  processButton.id = 'process-btn';
  processButton.type = 'button';
  processButton.className = 'btn-gradient w-full';
  processButton.textContent = 'Delete Pages & Download';

  options.append(totalLine, label, pageInput, processButton);
  root.append(title, description, dropzone, fileSummary, options);
  return { root, fileInput, fileSummary, options, totalPages, pageInput, processButton };
}
