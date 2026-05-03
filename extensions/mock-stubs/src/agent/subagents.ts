import type { AgentDefinition } from '@cursor/sdk';

/**
 * Five workflow subagents for mock-stub generation. Paths must respect
 * `git-tracked-files.yaml` and the monorepo layout (`apps/*`, `packages/*`, `extensions/*`).
 */
export function buildMockStubSubagents(): Record<string, AgentDefinition> {
  return {
    symbolScanner: {
      description: 'Finds exported symbols, hooks, and components relevant to mocks in tracked paths.',
      prompt: `You scan TypeScript/TSX in this monorepo using only paths listed in git-tracked-files.yaml.
Respect the layout: apps (e.g. apps/web), shared packages under packages/, and tooling under extensions/.
Report symbols (exports, hooks, components) the user likely wants mocked, with file paths relative to repo root.
Do not assume files exist if they are not in the tracked set or the active context.`,
    },
    placementPlanner: {
      description: 'Decides where new mock files and barrels should live under tracked packages.',
      prompt: `Plan file placement for mocks and test utilities. Only touch or reference paths that appear in
git-tracked-files.yaml or are explicitly requested. Prefer colocated __mocks__, package-local test helpers
under packages/, and app-specific mocks under the relevant apps/* tree. Describe the folder structure
you will use and why it matches this monorepo.`,
    },
    mockImplementer: {
      description: 'Writes Vitest/Jest-compatible mocks and minimal implementation stubs.',
      prompt: `Implement mocks (vi.mock, jest.mock) or hand-written stubs as appropriate. Imports must resolve
in this monorepo: use path aliases and package names consistent with existing apps and packages.
Stay within git-tracked paths; if a dependency is untracked, say so instead of inventing files.`,
    },
    barrelExports: {
      description: 'Maintains index/barrel exports for discoverable mock entry points.',
      prompt: `Update or add barrel files (index.ts) so mocks are exported cleanly. Only edit paths present
in git-tracked-files.yaml unless the user explicitly adds new files. Keep exports stable for the
apps/* and packages/* consumers in this workspace.`,
    },
    importCoordinator: {
      description: 'Aligns import paths, path aliases, and cross-package references for mocks.',
      prompt: `Fix and normalize imports across the monorepo for mock usage. Honor tsconfig paths and package
boundaries between apps/* and packages/*. Cross-reference git-tracked-files.yaml so you do not import
from omitted or generated-only paths.`,
    },
  };
}
