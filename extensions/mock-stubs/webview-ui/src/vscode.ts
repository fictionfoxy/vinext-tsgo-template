import type { WebviewToHostMessage } from './messages';

type VsCodeApi = {
  postMessage: (message: unknown) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
};

type GlobalWithVsCode = typeof globalThis & {
  acquireVsCodeApi?: () => VsCodeApi;
};

const g = globalThis as GlobalWithVsCode;

let api: VsCodeApi | undefined;

function getApi(): VsCodeApi {
  if (api) return api;
  if (typeof g.acquireVsCodeApi !== 'function') {
    throw new Error('acquireVsCodeApi is only available inside a VS Code webview');
  }
  api = g.acquireVsCodeApi();
  return api;
}

/** True when running inside the VS Code webview (script was injected with acquireVsCodeApi). */
export function hasVsCodeApi(): boolean {
  return typeof g.acquireVsCodeApi === 'function';
}

export function postToHost(message: WebviewToHostMessage): void {
  try {
    getApi().postMessage(message);
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[mock-stubs webview] postToHost (no VS Code API):', message);
    }
  }
}

export function postReady(): void {
  postToHost({ type: 'ready' });
}

export function postRun(): void {
  postToHost({ type: 'run' });
}

export function postChat(text: string): void {
  postToHost({ type: 'chat', text });
}

export function postSelectModel(modelId: string): void {
  postToHost({ type: 'selectModel', modelId });
}

export function postRefreshModels(): void {
  postToHost({ type: 'refreshModels' });
}
