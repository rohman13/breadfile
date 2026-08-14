import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { resolve } from 'path';

export default defineConfig({
  server: {
    // Quick Cloudflare Tunnel hostnames are ephemeral, so accept the
    // hostname forwarded by the tunnel during local previews.
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    nodePolyfills({
      include: ['buffer', 'stream', 'util', 'zlib', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
    },
  },
  optimizeDeps: {
    include: ['pdfkit', 'blob-stream'],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        contact: resolve(__dirname, 'contact.html'),
        faq: resolve(__dirname, 'faq.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        mergePdf: resolve(__dirname, 'merge-pdf/index.html'),
        splitPdf: resolve(__dirname, 'split-pdf/index.html'),
        extractPdfPages: resolve(__dirname, 'extract-pdf-pages/index.html'),
        deletePdfPages: resolve(__dirname, 'delete-pdf-pages/index.html'),
        rotatePdf: resolve(__dirname, 'rotate-pdf/index.html'),
        organizePdfPages: resolve(__dirname, 'organize-pdf-pages/index.html'),
        compressPdf: resolve(__dirname, 'compress-pdf/index.html'),
        signPdf: resolve(__dirname, 'sign-pdf/index.html'),
        imageToPdf: resolve(__dirname, 'image-to-pdf/index.html'),
        pdfToImages: resolve(__dirname, 'pdf-to-images/index.html'),
        notFound: resolve(__dirname, '404.html'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.ts',
        '**/*.d.ts',
        'dist/',
      ],
    },
  },
});