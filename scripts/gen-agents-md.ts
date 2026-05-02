import { Agent, CursorAgentError } from '@cursor/sdk';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const srcDir = join(root, 'packages/ui/src');

function collectExports(dir: string): string[] {
  const lines: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      lines.push(...collectExports(join(dir, entry.name)));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      const content = readFileSync(join(dir, entry.name), 'utf8');
      const found = content.match(/^export\s+(function|const|class|type|interface)\s+\w+/gm) ?? [];
      lines.push(...found);
    }
  }
  return lines;
}

const apiExports = collectExports(srcDir);

const prompt = [
  'You are generating an AGENTS.md file for an AI coding agent working in this monorepo.',
  '',
  'The monorepo is a React + Mantine + TanStack Query + Zod + vinext + Turborepo project template.',
  '',
  'Public API exports found in packages/ui/src:',
  ...apiExports.slice(0, 50),
  '',
  'Generate a comprehensive AGENTS.md that covers:',
  '1. ## Project Overview - what this template is and its key packages',
  '2. ## Workspace Structure - apps/web (Vite SPA), apps/docs (vinext + Fumadocs), packages/ui (shared library), packages/tsconfig',
  '3. ## Key Conventions - pnpm workspaces, tsgo for type checking, oxlint at root, Mantine PostCSS setup',
  '4. ## Development Commands - turbo dev, turbo build, turbo test, turbo typecheck, turbo lint',
  '5. ## Package API - brief description of each exported symbol',
  '6. ## Do Nots - things agents should not do (bypass audit, use npm/yarn, force push, etc.)',
  '',
  'Output ONLY the markdown content, no explanation.',
].join('\n');

const agent = Agent.create({
  model: { id: 'claude-sonnet-4-5' },
  local: { cwd: root },
});

try {
  const run = await agent.send(prompt);

  let output = '';
  for await (const event of run.stream()) {
    if (event.type === 'assistant') {
      for (const block of event.message.content) {
        if (block.type === 'text') output += block.text;
      }
    }
  }
  await run.wait();

  writeFileSync(join(root, 'llm-docs/AGENTS.md'), output.trim() + '\n');
  console.log('Generated llm-docs/AGENTS.md');
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error('Agent startup failed:', err.message, '| retryable:', err.isRetryable);
    process.exit(1);
  }
  throw err;
} finally {
  await agent[Symbol.asyncDispose]();
}
