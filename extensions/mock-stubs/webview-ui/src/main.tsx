/// <reference types="vite/client" />
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import type { HostToWebviewMessage, InitPayload } from './messages';
import { isHostToWebviewMessage } from './messages';
import { hasVsCodeApi, postReady } from './vscode';

function mergeInit(prev: InitPayload, msg: HostToWebviewMessage): InitPayload {
  switch (msg.type) {
    case 'trackedFiles':
      return { ...prev, trackedFiles: msg.paths };
    case 'models':
      return {
        ...prev,
        models: msg.models,
        selectedModelId: msg.selectedModelId ?? prev.selectedModelId,
      };
    case 'status':
      return { ...prev, statusText: msg.text };
    case 'streamChunk':
      return { ...prev, streamLog: (prev.streamLog ?? '') + msg.text };
    case 'streamEnd':
      return { ...prev, streamLog: (prev.streamLog ?? '') + `\n[run ${msg.status}]` };
    case 'error':
      return { ...prev, statusText: msg.message };
    default:
      return prev;
  }
}

function Root() {
  const [init, setInit] = useState<InitPayload | null>(null);

  const onHostMessage = useCallback((data: unknown) => {
    if (!isHostToWebviewMessage(data)) return;
    if (data.type === 'init') {
      setInit(data.payload);
      return;
    }
    setInit((prev) => (prev ? mergeInit(prev, data) : prev));
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      onHostMessage(event.data);
    };
    window.addEventListener('message', onMessage);
    postReady();
    return () => window.removeEventListener('message', onMessage);
  }, [onHostMessage]);

  const devFallback = useMemo(
    (): InitPayload => ({
      theme: 'system',
      showSubagentRoadmapNote: true,
      trackedFiles: ['src/example.ts', 'README.md'],
      models: [
        { id: 'composer-2', label: 'composer-2' },
        { id: 'gpt-5', label: 'gpt-5' },
      ],
      selectedModelId: 'composer-2',
      statusText: hasVsCodeApi() ? undefined : 'Dev preview (outside VS Code webview)',
      streamLog: '',
    }),
    [],
  );

  const effective = init ?? (import.meta.env.DEV ? devFallback : null);

  if (!effective) {
    return (
      <MantineProvider defaultColorScheme="auto">
        <div style={{ padding: 12, fontFamily: 'var(--mantine-font-family)' }}>Loading…</div>
      </MantineProvider>
    );
  }

  const tp = effective.theme;
  return (
    <StrictMode>
      <MantineProvider
        defaultColorScheme={tp === 'system' ? 'auto' : tp}
        forceColorScheme={tp === 'system' ? undefined : tp}
      >
        <App init={effective} />
      </MantineProvider>
    </StrictMode>
  );
}

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(<Root />);
}
