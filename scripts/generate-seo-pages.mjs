import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://bread.beno.app';
const tools = [
  {
    id: 'merge', slug: 'merge-pdf', name: 'Merge PDF',
    title: 'Merge PDF Files Online Free & Privately | BreadFile',
    description: 'Merge multiple PDF files into one document free in your browser. Reorder files, combine them instantly, and keep every PDF private.',
    h1: 'Merge PDF files privately in your browser',
    lead: 'Combine several PDFs into one clean document. Arrange the files in the order you want, then download the finished PDF without uploading anything.',
    benefits: ['Combine multiple PDFs into one file', 'Drag files into the order you need', 'Process documents locally on your device'],
    steps: ['Choose two or more PDF files.', 'Arrange them in the correct order.', 'Select “Bind my PDFs” and download the merged file.'],
    faqs: [
      ['Are my PDFs uploaded to a server?', 'No. BreadFile merges your PDFs locally in your browser, so the document contents stay on your device.'],
      ['Can I change the file order before merging?', 'Yes. Drag the PDF cards into the order you want before creating the merged document.'],
    ],
  },
  {
    id: 'split', slug: 'split-pdf', name: 'Split PDF',
    title: 'Split PDF Pages Online Free & Privately | BreadFile',
    description: 'Split a PDF by page ranges, every few pages, or visual selection. Free browser-based PDF splitter with no file uploads or account.',
    h1: 'Split a PDF into the files you need',
    lead: 'Cut one PDF into smaller documents by ranges, intervals, or selected pages. Everything is processed locally in your browser.',
    benefits: ['Split by custom page ranges', 'Create a file every set number of pages', 'Select pages visually before downloading'],
    steps: ['Choose the PDF you want to split.', 'Select ranges, intervals, or pages.', 'Cut and download the resulting PDF or ZIP.'],
    faqs: [
      ['Can I split only certain pages?', 'Yes. Use visual selection or enter page ranges to choose exactly which pages belong together.'],
      ['Does splitting reduce PDF quality?', 'No. BreadFile copies the selected PDF pages without rasterizing them.'],
    ],
  },
  {
    id: 'extract-pages', slug: 'extract-pdf-pages', name: 'Extract PDF Pages',
    title: 'Extract Pages from PDF Online Free | BreadFile',
    description: 'Extract selected pages from a PDF into new files. Choose pages visually and download them privately without uploading your document.',
    h1: 'Extract selected pages from a PDF',
    lead: 'Pull out only the pages you need and save them as separate PDF files in one convenient ZIP package.',
    benefits: ['Choose pages from a visual preview', 'Save each selected page as a PDF', 'Keep the source document on your device'],
    steps: ['Open your PDF.', 'Mark the pages you want to extract.', 'Download the selected pages in a ZIP file.'],
    faqs: [
      ['What format are extracted pages saved in?', 'Each selected page is saved as its own PDF and packaged in a ZIP download.'],
      ['Will the original PDF be changed?', 'No. BreadFile creates new files and leaves your original document untouched.'],
    ],
  },
  {
    id: 'delete-pages', slug: 'delete-pdf-pages', name: 'Delete PDF Pages',
    title: 'Delete Pages from PDF Online Free | BreadFile',
    description: 'Remove unwanted pages from a PDF online for free. Select pages visually, create a clean copy, and keep your files private in your browser.',
    h1: 'Delete unwanted pages from a PDF',
    lead: 'Remove blank, duplicate, or unnecessary pages and download a trimmed copy without sending the document to a server.',
    benefits: ['Select pages from clear thumbnails', 'Remove individual pages or ranges', 'Download a new trimmed PDF'],
    steps: ['Choose your PDF.', 'Mark every page you want removed.', 'Create and download the trimmed PDF.'],
    faqs: [
      ['Can I undo a page selection?', 'Yes. Tap a marked page again before processing to keep it in the final PDF.'],
      ['Does BreadFile overwrite my original file?', 'No. It downloads a new PDF and never modifies the original on your device.'],
    ],
  },
  {
    id: 'rotate', slug: 'rotate-pdf', name: 'Rotate PDF',
    title: 'Rotate PDF Pages Online Free & Privately | BreadFile',
    description: 'Rotate one, several, or all PDF pages online for free. Preview each turn and download a corrected PDF without uploading your file.',
    h1: 'Rotate PDF pages the right way up',
    lead: 'Fix sideways or upside-down pages one at a time, or rotate the whole document together. Your PDF stays in your browser.',
    benefits: ['Rotate individual PDF pages', 'Turn every page left or right at once', 'Preview rotations before downloading'],
    steps: ['Open the PDF.', 'Rotate individual pages or use the batch controls.', 'Download the corrected document.'],
    faqs: [
      ['Can I rotate only one page?', 'Yes. Each page has its own rotation controls, and there are also controls for the entire document.'],
      ['Is the rotation permanent?', 'The original file is unchanged. The downloaded copy includes the rotations you selected.'],
    ],
  },
  {
    id: 'organize', slug: 'organize-pdf-pages', name: 'Organize PDF Pages',
    title: 'Organize & Reorder PDF Pages Online | BreadFile',
    description: 'Reorder, rotate, duplicate, and remove PDF pages online for free. Organize your document visually and privately in your browser.',
    h1: 'Organize PDF pages on a visual desk',
    lead: 'Drag pages into a better order, turn them, duplicate useful pages, or remove what you do not need—all before creating a new PDF.',
    benefits: ['Reorder pages by dragging thumbnails', 'Rotate, duplicate, or remove pages', 'Preview the final page sequence'],
    steps: ['Choose a PDF.', 'Arrange and edit the page cards.', 'Download the organized copy.'],
    faqs: [
      ['Can I duplicate a page?', 'Yes. Use the duplicate action on a page card, then drag the copy wherever it belongs.'],
      ['Are page changes applied immediately?', 'Changes appear in the preview first. Your original file remains unchanged until you download a new copy.'],
    ],
  },
  {
    id: 'compress', slug: 'compress-pdf', name: 'Compress PDF',
    title: 'Compress PDF Online Free & Privately | BreadFile',
    description: 'Compress image-heavy PDF files online for free. Choose a quality balance, reduce file size locally, and never upload your document.',
    h1: 'Compress a PDF without uploading it',
    lead: 'Reduce the size of image-heavy PDFs for easier sharing or storage. Choose the balance between visual quality and file size.',
    benefits: ['Choose from practical compression levels', 'Process PDFs locally in your browser', 'Compare the new file size after download'],
    steps: ['Choose an image-heavy PDF.', 'Select your preferred quality balance.', 'Compress and download the smaller copy.'],
    faqs: [
      ['Will compression affect quality?', 'Compression can reduce image detail. Choose a lighter setting when visual quality matters most.'],
      ['Why does a text-only PDF shrink very little?', 'Text and vector content is already compact. This tool has the largest effect on PDFs containing large images.'],
    ],
  },
  {
    id: 'sign-pdf', slug: 'sign-pdf', name: 'Sign PDF',
    title: 'Sign PDF Online Free—Draw, Type or Upload | BreadFile',
    description: 'Add a visible signature or stamp to a PDF online for free. Draw, type, upload, resize, and place marks privately in your browser.',
    h1: 'Sign a PDF privately in your browser',
    lead: 'Draw a signature, create a handwritten or script mark, or upload a stamp. Place and resize it precisely before downloading the signed PDF.',
    benefits: ['Draw, type, or upload a signature', 'Move and resize marks on any page', 'Keep signatures and documents on your device'],
    steps: ['Choose a PDF and create or upload your mark.', 'Place, move, and resize it on the document.', 'Download the PDF with the visible signature added.'],
    faqs: [
      ['Is this a cryptographic digital signature?', 'No. BreadFile adds a visible electronic signature or stamp, like signing printed paper. It does not issue a certificate-based digital signature.'],
      ['Can I sign more than one page?', 'Yes. Navigate between pages and place one or more marks wherever they are needed.'],
    ],
  },
  {
    id: 'image-to-pdf', slug: 'image-to-pdf', name: 'Image to PDF',
    title: 'Convert Images to PDF Online Free | BreadFile',
    description: 'Convert JPG, PNG, and WebP images into one PDF. Arrange pictures, choose page settings, and create the PDF privately in your browser.',
    h1: 'Turn images into one PDF',
    lead: 'Combine JPG, PNG, or WebP pictures into a single PDF in the order you choose—without uploading the images.',
    benefits: ['Combine multiple images into one PDF', 'Arrange pictures before conversion', 'Support JPG, PNG, and WebP files'],
    steps: ['Choose one or more images.', 'Arrange them in the desired page order.', 'Create and download the PDF.'],
    faqs: [
      ['Which image formats are supported?', 'BreadFile accepts JPG, PNG, and WebP images.'],
      ['Can I control the image order?', 'Yes. Arrange the image cards before creating the PDF.'],
    ],
  },
  {
    id: 'pdf-to-images', slug: 'pdf-to-images', name: 'PDF to Images',
    title: 'Convert PDF to JPG or PNG Online Free | BreadFile',
    description: 'Convert every PDF page to JPG or PNG images online for free. Choose resolution and quality, then download a private ZIP archive.',
    h1: 'Convert PDF pages to JPG or PNG images',
    lead: 'Save every page of a PDF as an image. Choose the format, resolution, and quality, then download all pages in one ZIP file.',
    benefits: ['Export pages as JPG or PNG', 'Choose resolution and image quality', 'Download all converted pages together'],
    steps: ['Choose a PDF.', 'Select JPG or PNG and your preferred quality.', 'Convert and download the ZIP archive.'],
    faqs: [
      ['Does this convert every page?', 'Yes. Every PDF page is rendered as a separate image and included in the ZIP download.'],
      ['Which format should I choose?', 'JPG usually creates smaller files for photos. PNG is useful for diagrams, text, and images that need lossless detail.'],
    ],
  },
];

const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

function headMetadata(tool) {
  const url = `${base}/${tool.slug}/`;
  const schema = {
    '@context': 'https://schema.org', '@type': 'WebApplication', name: tool.name,
    url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript and a modern web browser',
    description: tool.description,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: tool.benefits,
    provider: { '@type': 'Organization', name: 'BreadFile', url: base },
  };
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: tool.faqs.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })) };
  return `  <meta name="description" content="${escapeHtml(tool.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="BreadFile" />
  <meta property="og:title" content="${escapeHtml(tool.title)}" />
  <meta property="og:description" content="${escapeHtml(tool.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${base}/images/breadfile-social.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(tool.title)}" />
  <meta name="twitter:description" content="${escapeHtml(tool.description)}" />
  <meta name="twitter:image" content="${base}/images/breadfile-social.png" />
  <script type="application/ld+json">${json(schema)}</script>
  <script type="application/ld+json">${json(faq)}</script>`;
}

function seoSection(tool) {
  const benefits = tool.benefits.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const steps = tool.steps.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  const faqs = tool.faqs.map(([question, answer]) => `<details><summary>${escapeHtml(question)}</summary><p>${escapeHtml(answer)}</p></details>`).join('');
  return `<section class="tool-seo-content" aria-labelledby="tool-guide-title">
    <nav class="tool-breadcrumb" aria-label="Breadcrumb"><a href="/">BreadFile</a><span aria-hidden="true">/</span><span>${escapeHtml(tool.name)}</span></nav>
    <div class="tool-seo-intro"><span class="bread-kicker">Free · private · browser-based</span><h1 id="tool-guide-title">${escapeHtml(tool.h1)}</h1><p>${escapeHtml(tool.lead)}</p></div>
    <div class="tool-seo-grid"><article><h3>What you can do</h3><ul>${benefits}</ul></article><article><h3>Three simple steps</h3><ol>${steps}</ol></article></div>
    <div class="tool-seo-faq"><h2>${escapeHtml(tool.name)} questions</h2>${faqs}</div>
    <aside class="tool-privacy-note"><strong>Your documents stay private.</strong><p>BreadFile processes files locally in your browser. Your PDF is not uploaded to our servers.</p></aside>
  </section>`;
}

const source = (await readFile(resolve(root, 'index.html'), 'utf8'))
  .replace(/^\s*<meta name="robots"[^>]*>\s*$/gim, '')
  .replace(/^\s*<link rel="canonical"[^>]*>\s*$/gim, '')
  .replace(/^\s*<meta property="og:[^"]+"[^>]*>\s*$/gim, '')
  .replace(/^\s*<meta name="twitter:[^"]+"[^>]*>\s*$/gim, '')
  .replace(/^\s*<script type="application\/ld\+json">.*?<\/script>\s*$/gim, '')
  .replace(/\s*<section class="bread-seo-home hide-section"[\s\S]*?<\/section>/i, '');
for (const tool of tools) {
  let html = source
    .replace(/<meta name="description"[^>]*>\s*/i, '')
    .replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(tool.title)}</title>`)
    .replace('  <link rel="icon"', `${headMetadata(tool)}\n  <link rel="icon"`)
    .replace('<body>', `<body data-tool-id="${tool.id}" class="tool-landing-page">`)
    .replace(/<h1>Free private PDF tools\.<br><span>No uploads required\.<\/span><\/h1>/i, `<p class="bread-hero__title">${escapeHtml(tool.h1)}</p>`)
    .replace('<p>Put pages together, pull them apart, turn them around, or tidy the order. Nothing gets uploaded.</p>', `<p>${escapeHtml(tool.lead)}</p>`)
    .replace('id="hero-section" class="bread-hero"', 'id="hero-section" class="bread-hero hidden"')
    .replace('id="features-section" class="bread-promises"', 'id="features-section" class="bread-promises hidden"')
    .replace('id="tool-station" class="bread-tool-station"', 'id="tool-station" class="bread-tool-station hidden"')
    .replace('id="tool-interface" class="hidden bread-workbench"', 'id="tool-interface" class="bread-workbench"')
    .replace('<footer class="bread-footer hide-section">', '<footer class="bread-footer hide-section hidden">')
    .replace('<div id="tool-content"></div>', `<div id="tool-content"></div>\n      ${seoSection(tool)}`);
  const output = resolve(root, tool.slug, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html);
}

console.log(`Generated ${tools.length} SEO tool pages.`);
