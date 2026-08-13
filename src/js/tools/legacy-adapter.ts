import type { ToolModule } from './contracts.js';

export async function createLegacyTool(toolId: string): Promise<ToolModule> {
  return {
    async mount(): Promise<void> {
      const { setupToolInterface } = await import('../handlers/toolSelectionHandler.js');
      setupToolInterface(toolId);
    },
    dispose(): void {
      // Legacy tools still clean up through resetState/switchView. This adapter is
      // temporary and will disappear as each public tool adopts the new contract.
    },
  };
}
