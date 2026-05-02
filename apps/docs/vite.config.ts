import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import vinext from 'vinext';

export default defineConfig(async () => ({
  plugins: [await mdx({}), vinext(), nitro()],
}));
