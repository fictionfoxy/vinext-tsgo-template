import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/**
 * `vscode` must stay external (VS Code provides it at runtime).
 * `@cursor/sdk` cannot be bundled with esbuild here: the published package pulls
 * webpack chunk loaders, `.d.ts.map` dynamic imports, and unresolved `@anysphere/*`
 * peers — keep it external so Node resolves it from `node_modules` next to the extension.
 */
const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  external: ['vscode', '@cursor/sdk'],
});

if (watch) {
  await ctx.watch();
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
