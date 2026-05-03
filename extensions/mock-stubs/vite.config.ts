import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Webview bundle: `webview-ui/index.html` → `/src/main.tsx` → `dist/webview/`. */
export default defineConfig({
  root: path.resolve(__dirname, 'webview-ui'),
  base: '',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'webview-ui/index.html'),
    },
  },
});
