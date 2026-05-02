import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig({
  plugins: [vinext(), nitro()],
});
