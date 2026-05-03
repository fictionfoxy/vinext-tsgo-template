import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { createAgent, disposeAgent, runPromptWithStreaming } from '../agent/runner.js';
import { buildContext } from '../context/buildContext.js';
import { readGitTrackedFiles } from '../context/gitTrackedFiles.js';
import type { HostToWebviewMessage, InitPayload, ThemePreference, WebviewToHostMessage } from '../protocol/messages.js';
import { isWebviewToHostMessage } from '../protocol/messages.js';
import type { MockStubsLogger } from '../logging/logger.js';
import { SECRET_CURSOR_API_KEY } from '../constants.js';
import type { SDKAgent } from '@cursor/sdk';

export class MockStubsViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = 'mockStubsView';

  private view?: vscode.WebviewView;
  private agent: SDKAgent | undefined;
  private agentWorkspace: string | undefined;
  /** Mirrors `mockStubs.futureUserSubagentMode` at agent creation time. */
  private agentUseSubagents: boolean | undefined;
  private agentModelId: string | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext,
    private readonly logger: MockStubsLogger,
    private readonly onRefreshModelsRequest: () => void,
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView;
    const distRoot = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview');
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri, distRoot],
    };
    const nonce = crypto.randomBytes(16).toString('base64url');
    webviewView.webview.html = this.buildHtml(webviewView.webview, distRoot, nonce);

    webviewView.webview.onDidReceiveMessage((raw: unknown) => {
      void this.handleWebviewMessage(raw);
    });

    webviewView.onDidDispose(() => {
      this.view = undefined;
    });
  }

  private buildHtml(webview: vscode.Webview, distRoot: vscode.Uri, nonce: string): string {
    const indexPath = path.join(distRoot.fsPath, 'index.html');
    let base = '';
    if (fs.existsSync(indexPath)) {
      base = fs.readFileSync(indexPath, 'utf8');
    } else {
      base = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><p>Run <code>pnpm run build:webview</code> to generate the webview bundle.</p></body></html>`;
      return base;
    }
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource}`,
      `img-src ${webview.cspSource} https: data:`,
      `script-src 'nonce-${nonce}'`,
    ].join('; ');

    const assetUri = (file: string) =>
      webview.asWebviewUri(vscode.Uri.joinPath(distRoot, 'assets', file)).toString();

    let html = base;
    html = html.replace(/src="(\/|\.\/)assets\/([^"]+)"/g, (_m, _s, file: string) => `src="${assetUri(file)}"`);
    html = html.replace(/href="(\/|\.\/)assets\/([^"]+)"/g, (_m, _s, file: string) => `href="${assetUri(file)}"`);
    html = html.replace(/<script /g, `<script nonce="${nonce}" `);
    if (!html.includes('Content-Security-Policy')) {
      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1><meta http-equiv="Content-Security-Policy" content="${csp}">`,
      );
    }
    return html;
  }

  post(message: HostToWebviewMessage): void {
    this.view?.webview.postMessage(message);
  }

  /** Surfaces errors in the webview when it exists; otherwise uses the window so palette commands still work. */
  private notifyError(message: string): void {
    if (this.view) {
      this.post({ type: 'error', message });
    } else {
      void vscode.window.showErrorMessage(`Mock Stubs: ${message}`);
    }
  }

  private notifyStatus(text: string): void {
    if (this.view) {
      this.post({ type: 'status', text });
    }
  }

  async pushInit(): Promise<void> {
    const payload = await this.buildInitPayload();
    this.post({ type: 'init', payload });
  }

  private cfg() {
    return vscode.workspace.getConfiguration('mockStubs');
  }

  private workspaceFolder(): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.workspaceFolders?.[0];
  }

  private async getApiKey(): Promise<string | undefined> {
    return this.context.secrets.get(SECRET_CURSOR_API_KEY);
  }

  private async buildInitPayload(): Promise<InitPayload> {
    const folder = this.workspaceFolder();
    const c = this.cfg();
    const theme = c.get<string>('theme') ?? 'system';
    const showNote = c.get<boolean>('showSubagentRoadmapNote') ?? true;
    const modelId = c.get<string>('modelId') ?? 'composer-2';
    const maxTracked = c.get<number>('maxGitTrackedFiles') ?? 120;

    let trackedFiles: string[] = [];
    if (folder) {
      trackedFiles = readGitTrackedFiles(folder, maxTracked).paths;
    }

    let models: InitPayload['models'] = [];
    const apiKey = await this.getApiKey();
    try {
      if (apiKey) {
        const { Cursor } = await import('@cursor/sdk');
        const list = await Cursor.models.list({ apiKey });
        models = list.map((m) => ({ id: m.id, label: m.displayName || m.id }));
      }
    } catch (e) {
      this.logger.appendLine(`models.list failed: ${String(e)}`);
    }
    if (models.length === 0) {
      models = [{ id: modelId, label: modelId }];
    }

    const storedModel = this.context.globalState.get<string>('mockStubs.selectedModelId');
    const selectedModelId = storedModel && models.some((m) => m.id === storedModel) ? storedModel : modelId;

    const tp: ThemePreference =
      theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system';

    return {
      theme: tp,
      showSubagentRoadmapNote: showNote,
      trackedFiles,
      models,
      selectedModelId,
      streamLog: '',
      statusText: apiKey ? undefined : 'Set CURSOR_API_KEY in Secrets (mockStubs.cursorApiKey) to list models and run the agent.',
    };
  }

  private useSubagentsFromConfig(): boolean {
    const v = this.cfg().get<string>('futureUserSubagentMode');
    return v !== 'singleAgent';
  }

  private async handleWebviewMessage(raw: unknown): Promise<void> {
    if (!isWebviewToHostMessage(raw)) return;
    const msg = raw as WebviewToHostMessage;
    switch (msg.type) {
      case 'ready':
        await this.pushInit();
        break;
      case 'selectModel':
        await this.context.globalState.update('mockStubs.selectedModelId', msg.modelId);
        this.post({ type: 'status', text: `Model: ${msg.modelId}` });
        break;
      case 'refreshModels':
        this.onRefreshModelsRequest();
        await this.refreshModelsList();
        break;
      case 'run':
        await this.executeRun();
        break;
      case 'chat':
        await this.executeChat(msg.text);
        break;
      default:
        break;
    }
  }

  async refreshModelsList(): Promise<void> {
    const payload = await this.buildInitPayload();
    this.post({
      type: 'models',
      models: payload.models,
      selectedModelId: payload.selectedModelId,
    });
  }

  private async ensureAgent(apiKey: string, cwd: string, modelId: string): Promise<SDKAgent | undefined> {
    const useSubagents = this.useSubagentsFromConfig();
    if (
      this.agent &&
      this.agentWorkspace === cwd &&
      this.agentUseSubagents === useSubagents &&
      this.agentModelId === modelId
    ) {
      return this.agent;
    }
    await disposeAgent(this.agent);
    this.agent = undefined;
    this.agentWorkspace = undefined;
    this.agentUseSubagents = undefined;
    this.agentModelId = undefined;
    try {
      this.agent = await createAgent(apiKey, modelId, cwd, useSubagents);
      this.agentWorkspace = cwd;
      this.agentUseSubagents = useSubagents;
      this.agentModelId = modelId;
      this.logger.appendLine(
        `Agent created (subagents: ${useSubagents ? 'yes (5 workflow agents)' : 'no'}, model: ${modelId})`,
      );
      return this.agent;
    } catch (e) {
      this.logger.appendLine(`Agent.create failed: ${String(e)}`);
      const { CursorAgentError } = await import('@cursor/sdk');
      if (e instanceof CursorAgentError) {
        this.post({
          type: 'error',
          message: e.message,
          retryable: e.isRetryable,
        });
      } else {
        this.post({ type: 'error', message: e instanceof Error ? e.message : String(e) });
      }
      return undefined;
    }
  }

  /** Command palette entry: same as the webview Run action. */
  async runOnActiveFile(): Promise<void> {
    await this.executeRun();
  }

  private async executeRun(): Promise<void> {
    const folder = this.workspaceFolder();
    if (!folder) {
      this.notifyError('Open a workspace folder first.');
      return;
    }
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      this.notifyError('Missing API key. Store it in secret mockStubs.cursorApiKey.');
      return;
    }
    const c = this.cfg();
    const instructions = c.get<string>('instructions') ?? '';
    const maxTracked = c.get<number>('maxGitTrackedFiles') ?? 120;
    const maxRg = c.get<number>('maxRgLines') ?? 200;
    const modelId =
      this.context.globalState.get<string>('mockStubs.selectedModelId') ?? c.get<string>('modelId') ?? 'composer-2';

    const agent = await this.ensureAgent(apiKey, folder.uri.fsPath, modelId);
    if (!agent) return;

    this.notifyStatus('Building context…');
    const built = await buildContext(folder, { maxGitTrackedFiles: maxTracked, maxRgLines: maxRg });

    const task =
      `${instructions ? `${instructions}\n\n` : ''}${built.text}\n\n` +
      `Task: Generate or update mock implementations (React hooks/components/utils) appropriate for the active file, ` +
      `respecting only git-tracked paths and this monorepo layout. Prefer colocated mocks and package boundaries.`;

    this.notifyStatus('Running agent…');
    this.post({ type: 'streamChunk', text: '\n--- run ---\n' });

    const result = await runPromptWithStreaming(agent, task, {
      onTextChunk: (t) => {
        this.post({ type: 'streamChunk', text: t });
      },
    });

    if (result.ok) {
      this.post({ type: 'streamEnd', runId: result.runId ?? '', status: 'finished' });
      this.notifyStatus('Finished.');
    } else {
      this.notifyError(result.errorMessage ?? 'Unknown error');
      this.post({ type: 'streamEnd', runId: result.runId ?? '', status: 'error' });
      this.notifyStatus('Error.');
    }
  }

  private async executeChat(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    const folder = this.workspaceFolder();
    if (!folder) {
      this.notifyError('Open a workspace folder first.');
      return;
    }
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      this.notifyError('Missing API key. Store it in secret mockStubs.cursorApiKey.');
      return;
    }
    const c = this.cfg();
    const instructions = c.get<string>('instructions') ?? '';
    const modelId =
      this.context.globalState.get<string>('mockStubs.selectedModelId') ?? c.get<string>('modelId') ?? 'composer-2';

    const agent = await this.ensureAgent(apiKey, folder.uri.fsPath, modelId);
    if (!agent) return;

    const prompt = `${instructions ? `${instructions}\n\n` : ''}User:\n${trimmed}`;
    this.notifyStatus('Running chat…');
    this.post({ type: 'streamChunk', text: '\n--- chat ---\n' });

    const result = await runPromptWithStreaming(agent, prompt, {
      onTextChunk: (t) => {
        this.post({ type: 'streamChunk', text: t });
      },
    });

    if (result.ok) {
      this.post({ type: 'streamEnd', runId: result.runId ?? '', status: 'finished' });
      this.notifyStatus('Finished.');
    } else {
      this.notifyError(result.errorMessage ?? 'Unknown error');
      this.post({ type: 'streamEnd', runId: result.runId ?? '', status: 'error' });
    }
  }

  async resetSession(): Promise<void> {
    await disposeAgent(this.agent);
    this.agent = undefined;
    this.agentWorkspace = undefined;
    this.agentUseSubagents = undefined;
    this.agentModelId = undefined;
    this.notifyStatus('Session reset.');
    if (!this.view) {
      void vscode.window.showInformationMessage('Mock Stubs: Session reset.');
    }
    this.logger.appendLine('Agent session reset.');
  }

  async dispose(): Promise<void> {
    await disposeAgent(this.agent);
    this.agent = undefined;
    this.agentWorkspace = undefined;
    this.agentUseSubagents = undefined;
    this.agentModelId = undefined;
  }
}
