import { Agent, CursorAgentError } from '@cursor/sdk';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'apps/docs/content');
const rootPkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

function readMdxTitles(dir: string): string[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const text = readFileSync(join(dir, f), 'utf8');
      const titleMatch = text.match(/^#\s+(.+)$/m);
      return titleMatch ? titleMatch[1] : f.replace('.mdx', '');
    });
}

const docTitles = readMdxTitles(contentDir);
const projectName = rootPkg.name ?? 'tic-tac-toe';

const prompt = `
You are generating an llms.txt file for the "${projectName}" project following the llms.txt specification (https://llmstxt.org/).

Project details:
- Name: ${projectName}
- Stack: React 19, Mantine 9, TanStack Query 5, Zod 3, Vite 8, Vitest 4, Turborepo, Vercel, vinext
- Documentation sections: ${docTitles.join(', ')}

Generate a well-structured llms.txt file with:
1. An H1 heading with the project name
2. A blockquote with a 1-2 sentence description
3. An "## Overview" section listing key capabilities
4. A "## Docs" section with links like /docs/section-name for each doc page
5. An "## Source" section describing the monorepo packages

Keep it concise and machine-readable. Output ONLY the llms.txt content, no explanation.
`.trim();

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

  writeFileSync(join(root, 'llms.txt'), output.trim() + '\n');
  console.log('Generated llms.txt');
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error('Agent startup failed:', err.message, '| retryable:', err.isRetryable);
    process.exit(1);
  }
  throw err;
} finally {
  await agent[Symbol.asyncDispose]();
}
