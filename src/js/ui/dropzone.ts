export interface DropzoneOptions {
  accept?: string;
  multiple?: boolean;
  prompt?: string;
}

export function createDropzone(options: DropzoneOptions = {}): {
  root: HTMLLabelElement;
  input: HTMLInputElement;
} {
  const root = document.createElement('label');
  root.className = 'relative flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer bg-gray-900 hover:bg-gray-700 transition-colors duration-300';

  const content = document.createElement('span');
  content.className = 'flex flex-col items-center justify-center pt-5 pb-6';
  content.innerHTML = '<i data-lucide="upload-cloud" class="w-10 h-10 mb-3 text-gray-400" aria-hidden="true"></i>';

  const prompt = document.createElement('span');
  prompt.className = 'mb-2 text-sm text-gray-400';
  prompt.textContent = options.prompt ?? 'Choose a PDF or drag it here';

  const privacy = document.createElement('small');
  privacy.className = 'text-xs text-gray-500';
  privacy.textContent = 'Your file never leaves this device.';

  const input = document.createElement('input');
  input.id = 'file-input';
  input.type = 'file';
  input.accept = options.accept ?? 'application/pdf';
  input.multiple = options.multiple ?? false;
  input.className = 'absolute inset-0 w-full h-full opacity-0 cursor-pointer';

  content.append(prompt, privacy);
  root.append(content, input);
  return { root, input };
}
