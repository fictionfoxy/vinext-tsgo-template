import mdx from 'fumadocs-mdx/vite';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite';
import vinext from 'vinext';
import * as MdxConfig from './source.config';

export default defineConfig({
  plugins: [mdx(MdxConfig), vinext(), nitro()],
});
