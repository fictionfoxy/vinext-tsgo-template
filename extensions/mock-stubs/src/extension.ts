import * as vscode from 'vscode';
import { SECRET_CURSOR_API_KEY } from './constants.js';
import { MockStubsLogger } from './logging/logger.js';
import { MockStubsViewProvider } from './providers/MockStubsViewProvider.js';

export { SECRET_CURSOR_API_KEY };

let provider: MockStubsViewProvider | undefined;
let logger: MockStubsLogger | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  logger = new MockStubsLogger(context);
  context.subscriptions.push(logger);

  provider = new MockStubsViewProvider(
    context.extensionUri,
    context,
    logger,
    () => {
      logger?.appendLine('Model list refresh requested');
    },
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(MockStubsViewProvider.viewId, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('mockStubs.runOnActiveFile', async () => {
      await provider?.runOnActiveFile();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mockStubs.resetSession', async () => {
      await provider?.resetSession();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mockStubs.openLogFile', async () => {
      if (!logger) return;
      const doc = await vscode.workspace.openTextDocument(logger.logFileUri);
      await vscode.window.showTextDocument(doc);
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('mockStubs.refreshModels', async () => {
      await provider?.refreshModelsList();
    }),
  );

  context.subscriptions.push({
    dispose: () => {
      void provider?.dispose();
    },
  });
}

export function deactivate(): void {
  void provider?.dispose();
  provider = undefined;
  logger = undefined;
}
