import { Anchor, Box, Card, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';

const DEMOS = [
  {
    path: '/examples/taskboard',
    title: 'Task Board',
    description: 'Sortable list + Zod form + autosave — all TypedFrame primitives wired together.',
  },
];

export function HomePage() {
  return (
    <Box p="xl" maw={800} mx="auto">
      <Group justify="space-between" mb="xl">
        <Stack gap={4}>
          <Title order={1}>TypedFrame</Title>
          <Text c="dimmed">
            A thin, type-safe React framework for Mantine, Zod, TanStack Query, and DnD Kit.
          </Text>
        </Stack>
        <ColorSchemeToggle />
      </Group>

      <Title order={3} mb="md">
        Demos
      </Title>
      <Stack>
        {DEMOS.map((demo) => (
          <Card key={demo.path} withBorder shadow="xs" component={Link} to={demo.path}>
            <Text fw={600}>{demo.title}</Text>
            <Text size="sm" c="dimmed" mt={4}>
              {demo.description}
            </Text>
          </Card>
        ))}
      </Stack>

      <Text size="sm" c="dimmed" mt="xl">
        <Anchor href="https://github.com/FictionFoxy/TypedFrame" target="_blank">
          GitHub
        </Anchor>
        {' · '}
        <Anchor href="https://typedframe-docs.vercel.app" target="_blank">
          Docs
        </Anchor>
      </Text>
    </Box>
  );
}
