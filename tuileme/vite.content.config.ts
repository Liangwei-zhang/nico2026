import { defineConfig } from 'vite';
import { resolve } from 'path';

// Content scripts in MV3 are classic scripts (not ES modules).
// Build as a single IIFE bundle with no imports.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.ts'),
      output: {
        entryFileNames: 'content/index.js',
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
    target: 'es2020',
    minify: 'terser',
  },
  publicDir: false,
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@content': resolve(__dirname, 'src/content'),
      '@background': resolve(__dirname, 'src/background'),
    },
  },
});
