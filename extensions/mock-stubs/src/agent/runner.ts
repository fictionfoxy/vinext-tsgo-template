import type { SDKAgent } from '@cursor/sdk';
import { buildMockStubSubagents } from './subagents.js';

/**
 * @param useSubagents When true, registers the five workflow subagents; when false, single agent (matches `mockStubs.futureUserSubagentMode`: `subagents` vs `singleAgent`).
 */
export async function createAgent(
  apiKey: string,
  modelId: string,
  cwd: string,
  useSubagents: boolean,
): Promise<SDKAgent> {
  const { Agent } = await import('@cursor/sdk');
  const agents = useSubagents ? buildMockStubSubagents() : undefined;
  return Agent.create({
    apiKey,
    model: { id: modelId },
    local: { cwd },
    agents,
  });
}

export type StreamHandlers = {
  onTextChunk: (text: string) => void;
};

/**
 * Sends a prompt, streams assistant text to the handler, then waits for the terminal result.
 * Disposes the agent with Symbol.asyncDispose when done if disposeWhenDone is true (default false — caller may reuse).
 */
export async function runPromptWithStreaming(
  agent: SDKAgent,
  prompt: string,
  handlers: StreamHandlers,
): Promise<{ ok: boolean; errorMessage?: string; runId?: string }> {
  try {
    const run = await agent.send(prompt);
    if (run.supports('stream')) {
      for await (const msg of run.stream()) {
        if (msg.type === 'assistant') {
          for (const block of msg.message.content) {
            if (block.type === 'text') {
              handlers.onTextChunk(block.text);
            }
          }
        } else if (msg.type === 'thinking' && msg.text) {
          handlers.onTextChunk(msg.text);
        }
      }
    }
    const result = await run.wait();
    const terminalId = result.id;
    if (result.status === 'error') {
      return {
        ok: false,
        errorMessage: result.result ?? 'Run finished with error status.',
        runId: terminalId,
      };
    }
    if (result.status === 'cancelled') {
      return { ok: false, errorMessage: 'Run was cancelled.', runId: terminalId };
    }
    return { ok: true, runId: terminalId };
  } catch (err) {
    const { CursorAgentError } = await import('@cursor/sdk');
    if (err instanceof CursorAgentError) {
      return { ok: false, errorMessage: `${err.message} (retryable=${err.isRetryable})` };
    }
    return { ok: false, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

export async function disposeAgent(agent: SDKAgent | undefined): Promise<void> {
  if (!agent) return;
  await agent[Symbol.asyncDispose]();
}
