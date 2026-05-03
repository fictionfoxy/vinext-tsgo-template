/**
 * Extension host ↔ webview `postMessage` protocol (discriminated by `type`).
 *
 * Host → webview: `init`, `trackedFiles`, `models`, `status`, `streamChunk`, `streamEnd`, `error`.
 * Webview → host: `ready`, `run`, `chat`, `selectModel`, `refreshModels`.
 */

/** Theme preference from `mockStubs.theme` (host) — maps to Mantine color scheme. */
export type ThemePreference = 'light' | 'dark' | 'system';

export type ModelOption = {
  id: string;
  label: string;
};

export type InitPayload = {
  theme: ThemePreference;
  showSubagentRoadmapNote: boolean;
  trackedFiles: string[];
  models: ModelOption[];
  selectedModelId: string;
  statusText?: string;
  /** Accumulated assistant output from the host (streaming). */
  streamLog?: string;
};

/** Extension host → webview (`postMessage` into the iframe). */
export type HostToWebviewMessage =
  | { type: 'init'; payload: InitPayload }
  | { type: 'trackedFiles'; paths: string[] }
  | {
      type: 'models';
      models: ModelOption[];
      selectedModelId?: string;
    }
  | { type: 'status'; text: string }
  | { type: 'streamChunk'; text: string }
  | { type: 'streamEnd'; runId: string; status: 'finished' | 'error' | 'cancelled' }
  | { type: 'error'; message: string; code?: string; retryable?: boolean };

/** Webview → extension host (`vscode.postMessage`). */
export type WebviewToHostMessage =
  | { type: 'ready' }
  | { type: 'run' }
  | { type: 'chat'; text: string }
  | { type: 'selectModel'; modelId: string }
  | { type: 'refreshModels' };

export function isHostToWebviewMessage(data: unknown): data is HostToWebviewMessage {
  if (data === null || typeof data !== 'object') return false;
  const t = (data as { type?: unknown }).type;
  return (
    t === 'init' ||
    t === 'trackedFiles' ||
    t === 'models' ||
    t === 'status' ||
    t === 'streamChunk' ||
    t === 'streamEnd' ||
    t === 'error'
  );
}

export function isWebviewToHostMessage(data: unknown): data is WebviewToHostMessage {
  if (data === null || typeof data !== 'object') return false;
  const t = (data as { type?: unknown }).type;
  return (
    t === 'ready' ||
    t === 'run' ||
    t === 'chat' ||
    t === 'selectModel' ||
    t === 'refreshModels'
  );
}
