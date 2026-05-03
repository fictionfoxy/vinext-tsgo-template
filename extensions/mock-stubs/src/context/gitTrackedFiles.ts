import * as fs from 'node:fs';
import * as path from 'node:path';
import * as yaml from 'yaml';
import type { WorkspaceFolder } from 'vscode';

type GitTrackedYaml = {
  files?: unknown;
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string');
}

/**
 * Reads `git-tracked-files.yaml` at the workspace root, returns up to `maxFiles` paths.
 */
export function readGitTrackedFiles(
  folder: WorkspaceFolder,
  maxFiles: number,
): { paths: string[]; totalHint?: number } {
  const yamlPath = path.join(folder.uri.fsPath, 'git-tracked-files.yaml');
  if (!fs.existsSync(yamlPath)) {
    return { paths: [] };
  }
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const doc = yaml.parse(raw) as GitTrackedYaml | null | undefined;
  const files = doc && 'files' in doc ? doc.files : undefined;
  if (!isStringArray(files)) {
    return { paths: [] };
  }
  const total = files.length;
  const paths = files.slice(0, Math.max(0, maxFiles));
  return {
    paths,
    totalHint: total > paths.length ? total : undefined,
  };
}
