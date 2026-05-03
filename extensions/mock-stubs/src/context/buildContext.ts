import * as path from 'node:path';
import * as vscode from 'vscode';
import { readGitTrackedFiles } from './gitTrackedFiles.js';
import { rgSnippetForFile } from './ripgrep.js';

export type BuildContextInput = {
  maxGitTrackedFiles: number;
  maxRgLines: number;
};

export type BuiltContext = {
  text: string;
  trackedPaths: string[];
};

/**
 * Assembles prompt context: active editor + diagnostics, git-tracked list (excerpt), rg snippet for file.
 */
export async function buildContext(
  folder: vscode.WorkspaceFolder,
  input: BuildContextInput,
): Promise<BuiltContext> {
  const editor = vscode.window.activeTextEditor;
  const doc = editor?.document;
  const relPath =
    doc && doc.uri.scheme === 'file'
      ? path.relative(folder.uri.fsPath, doc.uri.fsPath) || doc.uri.fsPath
      : '(no active file)';

  let fileBody = '';
  if (doc) {
    fileBody = doc.getText();
  }

  let diagnosticsBlock = '';
  if (doc) {
    const diags = vscode.languages.getDiagnostics(doc.uri);
    if (diags.length) {
      const lines = diags.map((d) => {
        const pos = d.range.start;
        const loc = `${pos.line + 1}:${pos.character + 1}`;
        const src = d.source ? ` [${d.source}]` : '';
        return `- (${loc}) ${d.severity === vscode.DiagnosticSeverity.Error ? 'error' : 'warn'}${src}: ${d.message}`;
      });
      diagnosticsBlock = `\n## Diagnostics\n${lines.join('\n')}\n`;
    }
  }

  const tracked = readGitTrackedFiles(folder, input.maxGitTrackedFiles);
  const listBlock =
    tracked.paths.length > 0
      ? `\n## Git-tracked paths (from git-tracked-files.yaml, capped at ${input.maxGitTrackedFiles}${
          tracked.totalHint != null ? ` of ${tracked.totalHint}` : ''
        })\n${tracked.paths.map((p) => `- ${p}`).join('\n')}\n`
      : '\n## Git-tracked paths\n(none found — ensure git-tracked-files.yaml exists at workspace root.)\n';

  let rgBlock = '';
  if (doc?.uri.scheme === 'file') {
    const abs = doc.uri.fsPath;
    const rgOut = await rgSnippetForFile(folder.uri.fsPath, abs, input.maxRgLines);
    rgBlock = `\n## Ripgrep (${path.basename(abs)}, max ${input.maxRgLines} lines)\n\`\`\`\n${rgOut}\n\`\`\`\n`;
  }

  const text = [
    '## Active file',
    `Path: ${relPath}`,
    '',
    '```',
    fileBody,
    '```',
    diagnosticsBlock,
    listBlock,
    rgBlock,
  ].join('\n');

  return { text, trackedPaths: tracked.paths };
}
