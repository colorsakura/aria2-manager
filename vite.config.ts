import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { build as buildWithEsbuild } from 'esbuild';
import { defineConfig, type Plugin } from 'vite';

const root = import.meta.dirname;

function bundleBackground(): Plugin {
  return {
    name: 'bundle-background-iife',
    apply: 'build',
    closeBundle: async () => {
      await buildWithEsbuild({
        entryPoints: [resolve(root, 'src/background/main.ts')],
        bundle: true,
        outfile: resolve(root, 'dist/background.js'),
        format: 'iife',
        target: 'es2022'
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bundleBackground()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(root, 'src/popup/index.html'),
        options: resolve(root, 'src/options/index.html')
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
