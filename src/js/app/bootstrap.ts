import { createIcons, icons } from 'lucide';
import * as pdfjsLib from 'pdfjs-dist';
import { AppShell } from './shell.js';
import { alertService } from '../ui/alert.js';
import { progressService } from '../ui/progress.js';
import { downloadService } from '../ui/download.js';
import { setupFaqAccordion } from '../ui/faq-accordion.js';
import { registerServiceWorker } from './service-worker.js';

export function bootstrap(): void {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const shell = new AppShell({
    alerts: alertService,
    progress: progressService,
    downloads: downloadService,
  });
  shell.renderToolGrid();
  shell.setupInteractions();
  const landingTool = document.body.dataset.toolId;
  if (landingTool) void shell.openTool(landingTool);
  document.getElementById('alert-ok')?.addEventListener('click', () => alertService.hide());
  setupFaqAccordion();
  createIcons({ icons });
  registerServiceWorker();
}
