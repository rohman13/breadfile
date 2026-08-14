import type { ToolId } from './contracts.js';

export const toolSlugs: Record<ToolId, string> = {
  merge: 'merge-pdf',
  split: 'split-pdf',
  'extract-pages': 'extract-pdf-pages',
  'delete-pages': 'delete-pdf-pages',
  rotate: 'rotate-pdf',
  organize: 'organize-pdf-pages',
  compress: 'compress-pdf',
  'sign-pdf': 'sign-pdf',
  'image-to-pdf': 'image-to-pdf',
  'pdf-to-images': 'pdf-to-images',
};

export function toolHref(id: ToolId): string {
  return `/${toolSlugs[id]}/`;
}
