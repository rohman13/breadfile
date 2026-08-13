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
      card.append(icon, name, subtitle);
      tools.append(card);
    });

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
    this.setupSearch();
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
  }

  private async disposeActiveTool(): Promise<void> {
    const tool = this.activeTool;
    this.activeTool = null;
    if (tool) await tool.dispose();
  }

  private setToolView(showTool: boolean): void {
    required<HTMLElement>('grid-view').classList.toggle('hidden', showTool);
    required<HTMLElement>('tool-interface').classList.toggle('hidden', !showTool);
    ['hero-section', 'features-section', 'tools-header'].forEach((id) => {
      required<HTMLElement>(id).classList.toggle('hidden', showTool);
    });
    document.querySelectorAll<HTMLElement>('.section-divider, .hide-section').forEach((element) => {
      element.classList.toggle('hidden', showTool);
    });
  }
}
