import { describe, expect, it } from 'vitest';
import { toolRegistry } from '../js/tools/registry';

describe('tool architecture contract', () => {
  it('keeps public tool IDs unique', () => {
    const ids = toolRegistry.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides an executable loader for every public tool', () => {
    toolRegistry.forEach((tool) => expect(tool.load).toBeTypeOf('function'));
  });

  it('loads every tool with mount and dispose lifecycle methods', async () => {
    for (const definition of toolRegistry) {
      const tool = await definition.load();
      expect(tool.mount, definition.id).toBeTypeOf('function');
      expect(tool.dispose, definition.id).toBeTypeOf('function');
      await tool.dispose();
    }
  });
});
