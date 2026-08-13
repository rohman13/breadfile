export const downloadService = {
  save(blob: Blob, filename: string): void {
    filename = (document.getElementById('paper-output-name') as HTMLInputElement | null)?.value.trim() || filename;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.dispatchEvent(new CustomEvent('breadfile:download', { detail: { filename, size: blob.size } }));
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
