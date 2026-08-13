function loaderElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing #${id}`);
  return element;
}

export const progressService = {
  show(message = 'Processing...'): void {
    loaderElement('loader-text').textContent = message;
    loaderElement('loader-modal').classList.remove('hidden');
  },
  hide(): void {
    loaderElement('loader-modal').classList.add('hidden');
  },
};
