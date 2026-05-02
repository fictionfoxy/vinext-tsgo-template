#!/usr/bin/env node
/**
 * Project initialization script.
 * Run once after cloning: node scripts/init.mjs
 * Replaces all `my-app` / `My App` / `my-org` placeholders, then self-deletes.
 */

import { createInterface } from 'node:readline/promises';
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { stdin as input, stdout as output } from 'node:process';

const root = resolve(import.meta.dirname, '..');
const rl = createInterface({ input, output });

console.log('\n  Initialize your project\n');

const slug = (await rl.question('Project slug (lowercase-kebab): ')).trim();
const title = (await rl.question(`Display name [${toTitle(slug)}]: `)).trim() || toTitle(slug);
const org = (await rl.question('GitHub org or username: ')).trim();
rl.close();

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Invalid slug. Use lowercase letters, numbers, and hyphens.');
  process.exit(1);
}

const SKIP = new Set(['node_modules', '.git', '.turbo', '.vinext', '.next', 'dist', 'pnpm-lock.yaml']);
const TEXT_EXTS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.mdx', '.yaml', '.yml', '.txt', '.env', '.html', '.css', '.scss']);

const replacements = [
  [/my-app/g, slug],
  [/My App/g, title],
  [/my-org/g, org],
];

let filesChanged = 0;

function processDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile()) {
      const ext = entry.name.includes('.') ? '.' + entry.name.split('.').pop() : '';
      if (!TEXT_EXTS.has(ext)) continue;
      const original = readFileSync(fullPath, 'utf8');
      let updated = original;
      for (const [pattern, replacement] of replacements) {
        updated = updated.replace(pattern, replacement);
      }
      if (updated !== original) {
        writeFileSync(fullPath, updated, 'utf8');
        filesChanged++;
        console.log('  updated  ' + relative(root, fullPath));
      }
    }
  }
}

console.log('\nReplacing placeholders...\n');
processDir(root);

console.log('\nDone - ' + filesChanged + ' file(s) updated.');
console.log('\nNext steps:');
console.log('  1. pnpm install');
console.log('  2. pnpm turbo build');
console.log('  3. git add -A && git commit -m "chore: initialize ' + slug + '"');
console.log('  4. git remote set-url origin git@github.com:' + org + '/' + slug + '.git');
console.log('  5. git push -u origin main\n');

setTimeout(() => {
  try { unlinkSync(resolve(import.meta.dirname, 'init.mjs')); } catch {}
}, 500);

function toTitle(str) {
  return str.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
