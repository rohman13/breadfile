// BreadFile's focused MVP surface. The underlying BentoPDF engine remains reusable,
// but the first release exposes only the workflows in the product brief.
export const categories = [
  {
    name: 'PDF Toolbox',
    tools: [
      { id: 'merge', name: 'Merge PDFs', icon: 'combine', subtitle: 'Combine multiple PDFs into one file.' },
      { id: 'split', name: 'Split PDF', icon: 'scissors', subtitle: 'Split by ranges, every N pages, or visually.' },
      { id: 'extract-pages', name: 'Extract Pages', icon: 'ungroup', subtitle: 'Save selected pages as a new PDF.' },
      { id: 'delete-pages', name: 'Delete Pages', icon: 'trash-2', subtitle: 'Remove selected pages from a PDF.' },
      { id: 'rotate', name: 'Rotate Pages', icon: 'rotate-cw', subtitle: 'Rotate one, many, or all pages.' },
      { id: 'organize', name: 'Organize Pages', icon: 'grip', subtitle: 'Reorder pages with drag and drop.' },
      { id: 'compress', name: 'Compress PDF', icon: 'minimize-2', subtitle: 'Make image-heavy PDFs smaller.' },
      { id: 'sign-pdf', name: 'Sign PDF', icon: 'pen-line', subtitle: 'Draw, type, or upload a signature or stamp.' },
      { id: 'image-to-pdf', name: 'Images to PDF', icon: 'images', subtitle: 'Turn JPG, PNG, or WebP images into one PDF.' },
      { id: 'pdf-to-images', name: 'PDF to Images', icon: 'file-image', subtitle: 'Save every page as JPG or PNG.' },
    ],
  },
];
