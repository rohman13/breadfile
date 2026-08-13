import { createIcons, icons } from 'lucide';
import { toolRegistry, findTool } from '../tools/registry.js';
import type { AppServices, ToolModule } from '../tools/contracts.js';
import { state, resetState } from '../state.js';

function required<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) throw new Error(`Missing #${id}`);
  return element as T;
}

export class AppShell {
  private activeTool: ToolModule | null = null;
  private paperDeskDispose: (() => void) | null = null;
  private transition = 0;

  constructor(private readonly services: AppServices) {}

  renderToolGrid(): void {
    const grid = required<HTMLElement>('tool-grid');
    grid.replaceChildren();
    const group = document.createElement('div');
    group.className = 'category-group col-span-full';
    const tools = document.createElement('div');
    tools.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6';

    toolRegistry.forEach((tool) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'tool-card bg-gray-800 rounded-xl p-4 cursor-pointer flex flex-col items-center justify-center text-center';
      card.dataset.toolId = tool.id;
      card.setAttribute('aria-label', `${tool.name}: ${tool.subtitle}`);

      const icon = document.createElement('i');
      icon.className = 'w-10 h-10 mb-3 text-indigo-400';
      icon.dataset.lucide = tool.icon;
      const name = document.createElement('h3');
      name.className = 'font-semibold text-white';
      name.textContent = tool.name;
      const subtitle = document.createElement('p');
      subtitle.className = 'text-xs text-gray-400 mt-1 px-2';
      subtitle.textContent = tool.subtitle;
      const accessory = document.createElement('span');
      accessory.className = 'tool-card__accessory';
      accessory.dataset.art = tool.id;
      accessory.setAttribute('aria-hidden', 'true');
      card.append(icon, accessory, name, subtitle);
      tools.append(card);
    });

    const note = document.createElement('aside');
    note.className = 'workshop-note';
    note.setAttribute('aria-label', 'A note from the BreadFile workshop');
    note.innerHTML = '<span class="workshop-note__pencil" aria-hidden="true"><i></i></span><div><small>From the workbench</small><strong>More tiny tools are being sharpened.</strong></div>';
    tools.append(note);

    group.append(tools);
    grid.append(group);
    createIcons({ icons });
  }

  setupInteractions(): void {
    required<HTMLElement>('tool-grid').addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const card = target.closest<HTMLElement>('.tool-card');
      if (card?.dataset.toolId) void this.openTool(card.dataset.toolId);
    });
    required<HTMLButtonElement>('back-to-grid').addEventListener('click', () => void this.showGrid());
    document.querySelector<HTMLAnchorElement>('.bread-cta[href="#tools-header"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      this.scrollToTools('smooth');
    });
    this.setupSearch();
  }

  private scrollToTools(behavior: ScrollBehavior = 'smooth'): void {
    required<HTMLElement>('tools-header').scrollIntoView({ behavior, block: 'start' });
    if (location.hash !== '#tools-header') history.replaceState(history.state, '', '#tools-header');
  }

  private setupSearch(): void {
    const input = required<HTMLInputElement>('search-bar');
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase().trim();
      document.querySelectorAll<HTMLElement>('.tool-card').forEach((card) => {
        card.classList.toggle('hidden', !(card.textContent ?? '').toLowerCase().includes(query));
      });
    });
  }

  async openTool(id: string): Promise<void> {
    const definition = findTool(id);
    if (!definition) return;
    const currentTransition = ++this.transition;
    await this.disposeActiveTool();
    if (currentTransition !== this.transition) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    state.activeTool = definition.id;
    this.setToolView(true);
    const container = required<HTMLElement>('tool-content');
    container.replaceChildren();

    try {
      const tool = await definition.load();
      if (currentTransition !== this.transition) {
        await tool.dispose();
        return;
      }
      this.activeTool = tool;
      await tool.mount({ container, services: this.services });
      const { mountPaperDesk } = await import('../ui/paper-desk.js');
      this.paperDeskDispose = mountPaperDesk(definition.id, container);
      if (currentTransition !== this.transition) {
        await tool.dispose();
        if (this.activeTool === tool) this.activeTool = null;
        resetState();
        container.replaceChildren();
        this.setToolView(false);
      }
    } catch (error) {
      console.error(error);
      this.services.alerts.show('Could not open this tool', 'Please return to the tool list and try again.');
      await this.showGrid();
    }
  }

  async showGrid(): Promise<void> {
    ++this.transition;
    await this.disposeActiveTool();
    resetState();
    required<HTMLElement>('tool-content').replaceChildren();
    this.setToolView(false);
    // The tools section was hidden while a tool was open. Wait until layout is
    // restored before calculating its scroll position.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToTools('instant' as ScrollBehavior));
    });
  }

  private async disposeActiveTool(): Promise<void> {
    this.paperDeskDispose?.();
    this.paperDeskDispose = null;
    const tool = this.activeTool;
    this.activeTool = null;
    if (tool) await tool.dispose();
  }

  private setToolView(showTool: boolean): void {
    required<HTMLElement>('grid-view').classList.toggle('hidden', showTool);
    required<HTMLElement>('tool-interface').classList.toggle('hidden', !showTool);
    required<HTMLElement>('tools-header').classList.toggle('hidden', showTool);
    ['hero-section', 'features-section', 'tool-station'].forEach((id) => {
      required<HTMLElement>(id).classList.toggle('hidden', showTool);
    });
    document.querySelectorAll<HTMLElement>('.section-divider, .hide-section').forEach((element) => {
      element.classList.toggle('hidden', showTool);
    });
  }
}
