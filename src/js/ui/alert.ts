function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing #${id}`);
  return element as T;
}

export const alertService = {
  show(title: string, message: string): void {
    requiredElement<HTMLElement>('alert-title').textContent = title;
    requiredElement<HTMLElement>('alert-message').textContent = message;
    requiredElement<HTMLElement>('alert-modal').classList.remove('hidden');
  },
  hide(): void {
    requiredElement<HTMLElement>('alert-modal').classList.add('hidden');
  },
};
