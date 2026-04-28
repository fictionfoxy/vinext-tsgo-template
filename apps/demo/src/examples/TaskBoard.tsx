import {
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  SortableList,
  createId,
  reorderItems,
  sortItems,
  useAutosave,
  useZodForm,
} from '@typedframe/core';
import { useEffect, useState } from 'react';
import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskId = ReturnType<typeof createId<'Task'>>;

type Task = {
  id: TaskId;
  title: string;
  description: string;
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_TASKS: Task[] = [
  { id: createId<'Task'>('task_1'), title: 'Design system tokens', description: 'Define color, spacing, and typography scales.' },
  { id: createId<'Task'>('task_2'), title: 'Build SortableList', description: 'Wrap DnD Kit with controlled reorder logic.' },
  { id: createId<'Task'>('task_3'), title: 'Wire Zod forms', description: 'Connect Mantine form to Zod schema validation.' },
  { id: createId<'Task'>('task_4'), title: 'Add autosave', description: 'Debounce form changes and persist to server.' },
];

// ─── Mock mutation (simulates server save) ────────────────────────────────────

function useSaveTask() {
  return useMutation<Task, Error, Task>({
    mutationFn: (task) =>
      new Promise((resolve) => setTimeout(() => resolve(task), 400)),
  });
}

// ─── Task row rendered inside SortableList ────────────────────────────────────

function TaskRow({ task, isSelected, onSelect }: { task: Task; isSelected: boolean; onSelect: () => void }) {
  return (
    <Card
      withBorder
      shadow={isSelected ? 'md' : 'xs'}
      mb="xs"
      style={{ cursor: 'pointer', borderColor: isSelected ? 'var(--mantine-color-blue-5)' : undefined }}
      onClick={onSelect}
    >
      <Group justify="space-between">
        <Text fw={isSelected ? 700 : 400}>{task.title}</Text>
        {isSelected && <Badge color="blue">editing</Badge>}
      </Group>
      {task.description && (
        <Text size="sm" c="dimmed" mt={4} lineClamp={1}>
          {task.description}
        </Text>
      )}
    </Card>
  );
}

// ─── Edit form with autosave ───────────────────────────────────────────────────

function TaskEditForm({ task, onSaved }: { task: Task; onSaved: (task: Task) => void }) {
  const saveTask = useSaveTask();
  const queryClient = useQueryClient();

  const form = useZodForm(taskSchema, {
    title: task.title,
    description: task.description,
  });

  // Reset form when the selected task changes.
  useEffect(() => {
    form.setValues({ title: task.title, description: task.description });
    form.resetDirty({ title: task.title, description: task.description });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id]);

  useAutosave<TaskFormValues>({
    values: form.values,
    isDirty: form.isDirty(),
    isValid: form.isValid(),
    delay: 600,
    onSave: async (values) => {
      const saved = await saveTask.mutateAsync({ ...task, ...values });
      onSaved(saved);
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <Card withBorder shadow="sm" p="lg">
      <Stack>
        <Group justify="space-between">
          <Title order={4}>Edit task</Title>
          {saveTask.isPending && <Badge color="yellow">saving…</Badge>}
          {saveTask.isSuccess && !form.isDirty() && <Badge color="green">saved</Badge>}
        </Group>

        <TextInput label="Title" placeholder="Task title" {...form.getInputProps('title')} />
        <Textarea
          label="Description"
          placeholder="What needs to be done?"
          autosize
          minRows={2}
          {...form.getInputProps('description')}
        />

        <Text size="xs" c="dimmed">
          Changes autosave after 600 ms of inactivity — only when the form is dirty and valid.
        </Text>
      </Stack>
    </Card>
  );
}

// ─── Main board ───────────────────────────────────────────────────────────────

function TaskBoardInner() {
  const [tasks, setTasks] = useState(() =>
    sortItems(SEED_TASKS.map((t, i) => ({ id: t.id, rank: (i + 1) * 10, value: t }))),
  );
  const [selectedId, setSelectedId] = useState<TaskId>(SEED_TASKS[0].id);

  const selectedItem = tasks.find((t) => t.id === selectedId);

  function handleSaved(updated: Task) {
    setTasks((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, value: updated } : item)),
    );
  }

  return (
    <Box p="xl" maw={900} mx="auto">
      <Stack mb="xl">
        <Title order={2}>Task Board</Title>
        <Text c="dimmed">
          Drag rows to reorder • Click a row to edit • Changes autosave automatically
        </Text>
      </Stack>

      <Group align="flex-start" gap="xl">
        {/* Sortable list */}
        <Box style={{ flex: 1 }}>
          <Text fw={600} mb="xs">Tasks</Text>
          <SortableList
            items={tasks}
            onReorder={(next) => setTasks(next)}
            renderItem={(item) => (
              <TaskRow
                task={item.value}
                isSelected={item.id === selectedId}
                onSelect={() => setSelectedId(item.id)}
              />
            )}
          />
          <Button
            variant="light"
            size="xs"
            mt="sm"
            onClick={() => {
              const newId = createId<'Task'>(`task_${Date.now()}`);
              const newTask: Task = { id: newId, title: 'New task', description: '' };
              setTasks((prev) => [
                ...prev,
                { id: newId, rank: (prev.length + 1) * 10, value: newTask },
              ]);
              setSelectedId(newId);
            }}
          >
            + Add task
          </Button>
        </Box>

        {/* Edit form */}
        <Box style={{ flex: 1 }}>
          {selectedItem ? (
            <TaskEditForm key={selectedItem.id} task={selectedItem.value} onSaved={handleSaved} />
          ) : (
            <Text c="dimmed">Select a task to edit</Text>
          )}
        </Box>
      </Group>
    </Box>
  );
}

// ─── Export with QueryClient provider ────────────────────────────────────────

const queryClient = new QueryClient();

export function TaskBoard() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskBoardInner />
    </QueryClientProvider>
  );
}
