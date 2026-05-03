import { Accordion, Alert, Button, Group, Paper, Select, Stack, Text, Textarea, Title } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { InitPayload, ThemePreference } from './messages';
import { postChat, postRefreshModels, postRun, postSelectModel } from './vscode';

type AppProps = {
  init: InitPayload;
};

function useResolvedColorScheme(theme: ThemePreference): 'light' | 'dark' {
  const systemScheme = useColorScheme();
  if (theme === 'system') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return theme;
}

function AppContent({
  chat,
  setChat,
  selectedModelId,
  trackedFiles,
  models,
  statusText,
  streamLog,
  showSubagentNote,
  themePreference,
  onModelChange,
  onRefreshModels,
  onRun,
  onSendChat,
}: {
  chat: string;
  setChat: (v: string) => void;
  selectedModelId: string;
  trackedFiles: string[];
  models: InitPayload['models'];
  statusText: string | undefined;
  streamLog: string | undefined;
  showSubagentNote: boolean;
  themePreference: ThemePreference;
  onModelChange: (value: string | null) => void;
  onRefreshModels: () => void;
  onRun: () => void;
  onSendChat: () => void;
}) {
  const resolvedScheme = useResolvedColorScheme(themePreference);

  const modelData = useMemo(
    () =>
      models.map((m) => ({
        value: m.id,
        label: m.label || m.id,
      })),
    [models],
  );

  return (
    <Stack gap="sm" p="md" style={{ minHeight: '100vh' }}>
      <Title order={4}>Mock Stubs</Title>
      {statusText ? (
        <Text size="sm" c="dimmed">
          {statusText}
        </Text>
      ) : null}

      {showSubagentNote ? (
        <Alert title="Subagent mode" color="blue" variant="light">
          Use VS Code setting <strong>Mock Stubs: Future user subagent mode</strong> (<code>mockStubs.futureUserSubagentMode</code>
          ): <code>subagents</code> registers five SDK workflow agents (symbolScanner, placementPlanner, mockImplementer,
          barrelExports, importCoordinator); <code>singleAgent</code> runs one agent with no delegation. Changing the
          setting recreates the agent on the next run.
        </Alert>
      ) : null}

      <Accordion variant="contained" radius="sm">
        <Accordion.Item value="files">
          <Accordion.Control>Git-tracked context ({trackedFiles.length} files)</Accordion.Control>
          <Accordion.Panel>
            <Stack gap={4}>
              {trackedFiles.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No paths yet.
                </Text>
              ) : (
                trackedFiles.map((path) => (
                  <Text key={path} size="sm" style={{ wordBreak: 'break-all' }}>
                    {path}
                  </Text>
                ))
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>

      <Select
        label="Model"
        placeholder="Select model"
        data={modelData}
        value={selectedModelId}
        onChange={onModelChange}
        searchable
        comboboxProps={{ withinPortal: false }}
      />
      <Group gap="xs">
        <Button variant="light" size="xs" onClick={onRefreshModels}>
          Refresh models
        </Button>
      </Group>

      <Textarea
        label="Message"
        placeholder="Instructions or follow-up for the agent…"
        minRows={4}
        value={chat}
        onChange={(e) => setChat(e.currentTarget.value)}
      />
      <Group gap="sm">
        <Button onClick={onSendChat}>Send</Button>
        <Button variant="filled" color={resolvedScheme === 'dark' ? 'teal' : 'blue'} onClick={onRun}>
          Run
        </Button>
      </Group>

      {streamLog ? (
        <Paper withBorder p="sm" radius="sm">
          <Text size="xs" fw={600} mb={4}>
            Output
          </Text>
          <Text
            component="pre"
            size="xs"
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: 240, overflow: 'auto' }}
          >
            {streamLog}
          </Text>
        </Paper>
      ) : null}
    </Stack>
  );
}

export function App({ init }: AppProps) {
  const [chat, setChat] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(init.selectedModelId);
  const [trackedFiles, setTrackedFiles] = useState(init.trackedFiles);
  const [models, setModels] = useState(init.models);
  const [statusText, setStatusText] = useState(init.statusText);
  const [streamLog, setStreamLog] = useState(init.streamLog);
  const [themePreference, setThemePreference] = useState<ThemePreference>(init.theme);
  const [showSubagentNote, setShowSubagentNote] = useState(init.showSubagentRoadmapNote);

  useEffect(() => {
    setSelectedModelId(init.selectedModelId);
    setTrackedFiles(init.trackedFiles);
    setModels(init.models);
    setStatusText(init.statusText);
    setStreamLog(init.streamLog);
    setThemePreference(init.theme);
    setShowSubagentNote(init.showSubagentRoadmapNote);
  }, [init]);

  const onRun = useCallback(() => {
    postRun();
  }, []);

  const onSendChat = useCallback(() => {
    const text = chat.trim();
    if (!text) return;
    postChat(text);
    setChat('');
  }, [chat]);

  const onModelChange = useCallback((value: string | null) => {
    if (!value) return;
    setSelectedModelId(value);
    postSelectModel(value);
  }, []);

  const onRefreshModels = useCallback(() => {
    postRefreshModels();
  }, []);

  return (
    <AppContent
      chat={chat}
      setChat={setChat}
      selectedModelId={selectedModelId}
      trackedFiles={trackedFiles}
      models={models}
      statusText={statusText}
      streamLog={streamLog}
      showSubagentNote={showSubagentNote}
      themePreference={themePreference}
      onModelChange={onModelChange}
      onRefreshModels={onRefreshModels}
      onRun={onRun}
      onSendChat={onSendChat}
    />
  );
}
