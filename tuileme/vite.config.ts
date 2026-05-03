import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        options: resolve(__dirname, 'src/options/index.ts'),
      },
      output: {
        // Fixed entry names (no hash) for manifest compatibility
        entryFileNames: '[name]/index.js',
        // Chunk names for lazy loading (overlay, etc.)
        chunkFileNames: 'assets/[name].js',
        // Asset names (CSS, fonts)
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    // Target modern browsers (Chrome/Edge latest)
    target: 'es2020',
    // Minify for production
    minify: 'terser',
    // Disable CSS code splitting for simpler extension structure
    cssCodeSplit: false,
  },
  // Copy static files from public/
  publicDir: 'public',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@content': resolve(__dirname, 'src/content'),
      '@background': resolve(__dirname, 'src/background'),
    },
  },
});
