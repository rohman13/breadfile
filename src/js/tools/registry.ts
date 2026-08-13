import type { ToolDefinition, ToolId } from './contracts.js';

const legacy = (id: Exclude<ToolId, 'delete-pages'>) => async () => {
  const { createLegacyTool } = await import('./legacy-adapter.js');
  return createLegacyTool(id);
};

export const toolRegistry: readonly ToolDefinition[] = [
  { id: 'merge', name: 'Merge PDFs', icon: 'combine', subtitle: 'Combine multiple PDFs into one file.', load: legacy('merge') },
  { id: 'split', name: 'Split PDF', icon: 'scissors', subtitle: 'Split by ranges, every N pages, or visually.', load: legacy('split') },
  { id: 'extract-pages', name: 'Extract Pages', icon: 'ungroup', subtitle: 'Save selected pages as a new PDF.', load: legacy('extract-pages') },
  {
    id: 'delete-pages',
    name: 'Delete Pages',
    icon: 'trash-2',
    subtitle: 'Remove selected pages from a PDF.',
    load: async () => (await import('./delete-pages/index.js')).createTool(),
  },
  { id: 'rotate', name: 'Rotate Pages', icon: 'rotate-cw', subtitle: 'Rotate one, many, or all pages.', load: legacy('rotate') },
  { id: 'organize', name: 'Organize Pages', icon: 'grip', subtitle: 'Reorder pages with drag and drop.', load: legacy('organize') },
  { id: 'compress', name: 'Compress PDF', icon: 'minimize-2', subtitle: 'Make image-heavy PDFs smaller.', load: legacy('compress') },
  { id: 'sign-pdf', name: 'Sign PDF', icon: 'pen-line', subtitle: 'Draw, type, or upload a signature or stamp.', load: legacy('sign-pdf') },
  { id: 'image-to-pdf', name: 'Images to PDF', icon: 'images', subtitle: 'Turn JPG, PNG, or WebP images into one PDF.', load: legacy('image-to-pdf') },
  { id: 'pdf-to-images', name: 'PDF to Images', icon: 'file-image', subtitle: 'Save every page as JPG or PNG.', load: legacy('pdf-to-images') },
];

export function findTool(id: string): ToolDefinition | undefined {
  return toolRegistry.find((tool) => tool.id === id);
}

// Compatibility shape for existing tests and callers while the registry migrates.
export const categories = [{ name: 'PDF Toolbox', tools: toolRegistry }];
