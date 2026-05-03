import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

function isPathInsideRoot(root: string, candidate: string): boolean {
  try {
    const rootReal = fs.realpathSync.native(root);
    const candidateReal = fs.realpathSync.native(candidate);
    const rel = path.relative(rootReal, candidateReal);
    if (rel === '' || rel === '.') return false;
    return !rel.startsWith('..') && !path.isAbsolute(rel);
  } catch {
    return false;
  }
}

/**
 * Runs `rg` on a single file with a fixed pattern, returning up to `maxLines` of output.
 * Pattern and flags are fixed; the file path is passed after `--` so it cannot be parsed as flags.
 */
export function rgSnippetForFile(
  workspaceRoot: string,
  fileAbsolutePath: string,
  maxLines: number,
): Promise<string> {
  return new Promise((resolve) => {
    if (!isPathInsideRoot(workspaceRoot, fileAbsolutePath)) {
      resolve('[rg skipped: file is outside workspace root]');
      return;
    }
    const cap = Math.max(1, Math.min(maxLines, 50_000));
    const child = spawn(
      'rg',
      ['-n', '--max-count', String(cap), '^', '--', fileAbsolutePath],
      {
        cwd: workspaceRoot,
        windowsHide: true,
      },
    );
    const chunks: Buffer[] = [];
    let stderr = '';
    child.stdout.on('data', (d: Buffer) => {
      chunks.push(d);
    });
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString('utf8');
    });
    child.on('error', () => {
      resolve(stderr.trim() ? `[rg unavailable] ${stderr.trim()}` : '[rg unavailable]');
    });
    child.on('close', (code) => {
      const out = Buffer.concat(chunks).toString('utf8');
      const lines = out.split(/\r?\n/);
      const capped = lines.slice(0, maxLines).join('\n');
      if (code !== 0 && !capped.trim()) {
        resolve(stderr.trim() ? `[rg exit ${code}] ${stderr.trim()}` : `[rg exit ${code}]`);
        return;
      }
      resolve(capped);
    });
  });
}
