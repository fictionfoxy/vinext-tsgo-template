import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';
import type { ExtensionContext, OutputChannel } from 'vscode';

const CHANNEL_NAME = 'Mock Stubs';

export class MockStubsLogger implements vscode.Disposable {
  readonly channel: OutputChannel;
  private readonly logUri: vscode.Uri;

  constructor(private readonly context: ExtensionContext) {
    this.channel = vscode.window.createOutputChannel(CHANNEL_NAME);
    this.logUri = vscode.Uri.joinPath(context.globalStorageUri, 'mock-stubs.log');
    try {
      fs.mkdirSync(path.dirname(this.logUri.fsPath), { recursive: true });
      if (!fs.existsSync(this.logUri.fsPath)) {
        fs.writeFileSync(this.logUri.fsPath, '', 'utf8');
      }
    } catch {
      /* best-effort */
    }
  }

  get logFileUri(): vscode.Uri {
    return this.logUri;
  }

  appendLine(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}`;
    this.channel.appendLine(line);
    try {
      fs.mkdirSync(path.dirname(this.logUri.fsPath), { recursive: true });
      fs.appendFileSync(this.logUri.fsPath, `${line}\n`, 'utf8');
    } catch (err) {
      this.channel.appendLine(`[mock-stubs] failed to append log file: ${String(err)}`);
    }
  }

  dispose(): void {
    this.channel.dispose();
  }
}
