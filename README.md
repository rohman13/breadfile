# BreadFile

A quiet, privacy-first PDF workshop that runs entirely in the browser.

**Live site:** [bread.beno.app](https://bread.beno.app)

## Tools

- Merge PDFs
- Split PDF
- Extract pages
- Delete pages
- Rotate pages
- Organize pages
- Compress PDF
- Images to PDF
- PDF to JPG or PNG

Files are processed locally in the browser and are never uploaded to an application server.

## Development

Requires Node.js 20 or newer.

```bash
npm install
npm run dev
```

Run tests and create a production build:

```bash
npm run test:run
npm run build
```

## Cloudflare deployment

The repository includes `wrangler.jsonc` for deploying the built static assets to Cloudflare Workers.

```bash
npx wrangler login
npm run deploy
```

The configured production domain is `bread.beno.app`.

## Technology

- Vite and TypeScript
- PDF.js and pdf-lib
- Cloudflare Workers static assets
- All document processing performed client-side

## License and acknowledgements

BreadFile's original modifications are available under the [MIT License](LICENSE).

BreadFile is derived from the open-source [BentoPDF](https://github.com/goodtab/bentopdf) project. Inherited BentoPDF code remains subject to its [Apache License 2.0](LICENSE-APACHE-2.0), including its attribution and redistribution requirements.
