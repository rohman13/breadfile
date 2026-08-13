import { createIcons, icons } from 'lucide';
import type { ToolContext, ToolModule } from '../contracts.js';
import { DocumentSession } from '../../core/pdf/document-session.js';
import { ProcessingError } from '../../core/errors/processing-error.js';
import { formatBytes } from '../../utils/helpers.js';
import { normalizePageSelection } from '../../utils/pageSelection.js';
import { createDeletePagesView, type DeletePagesView } from './view.js';
import { deletePdfPages } from './service.js';

class DeletePagesController implements ToolModule {
  private readonly session = new DocumentSession();
  private context: ToolContext | null = null;
  private view: DeletePagesView | null = null;
  private file: File | null = null;
  private disposed = false;

  async mount(context: ToolContext): Promise<void> {
    this.context = context;
    this.disposed = false;
    this.view = createDeletePagesView();
    context.container.replaceChildren(this.view.root);
    createIcons({ icons });
    this.view.fileInput.addEventListener('change', this.handleFileChange);
    this.view.processButton.addEventListener('click', this.handleProcess);
  }

  private readonly handleFileChange = async (event: Event): Promise<void> => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0] || !this.context || !this.view) return;
    const file = input.files[0];
    this.context.services.progress.show('Loading PDF...');
    try {
      const document = await this.session.load(file);
      if (this.disposed) return;
      this.file = file;
      this.view.fileSummary.textContent = `${file.name} · ${formatBytes(file.size)}`;
      this.view.totalPages.textContent = String(document.getPageCount());
      this.view.options.classList.remove('hidden');
      this.view.pageInput.focus();
    } catch (error) {
      this.session.dispose();
      this.file = null;
      input.value = '';
      this.context.services.alerts.show('Could not open this PDF', this.messageFor(error));
    } finally {
      this.context.services.progress.hide();
    }
  };

  private readonly handleProcess = async (): Promise<void> => {
    if (!this.context || !this.view || !this.file) return;
    const totalPages = Number(this.view.totalPages.textContent);
    const selected = normalizePageSelection(this.view.pageInput.value, totalPages);
    if (!Array.isArray(selected)) {
      this.context.services.alerts.show('Check the page numbers', selected.error);
      return;
    }

    this.context.services.progress.show('Deleting pages...');
    try {
      const output = await deletePdfPages(this.session.bytes, selected);
      if (this.disposed) return;
      this.context.services.downloads.save(
        new Blob([new Uint8Array(output)], { type: 'application/pdf' }),
        this.outputName(this.file.name),
      );
    } catch (error) {
      this.context.services.alerts.show('Could not delete pages', this.messageFor(error));
    } finally {
      this.context.services.progress.hide();
    }
  };

  private outputName(name: string): string {
    const stem = name.replace(/\.pdf$/i, '') || 'document';
    return `${stem}-pages-removed.pdf`;
  }

  private messageFor(error: unknown): string {
    return error instanceof ProcessingError ? error.message : 'Please check the PDF and try again.';
  }

  dispose(): void {
    this.disposed = true;
    this.view?.fileInput.removeEventListener('change', this.handleFileChange);
    this.view?.processButton.removeEventListener('click', this.handleProcess);
    this.session.dispose();
    this.context = null;
    this.view = null;
    this.file = null;
  }
}

export function createTool(): ToolModule {
  return new DeletePagesController();
}
