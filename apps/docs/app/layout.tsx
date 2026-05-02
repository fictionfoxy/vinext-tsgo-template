import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/app/source';
import type { ReactNode } from 'react';
import 'fumadocs-ui/style.css';

export const metadata = {
  title: {
    template: '%s | Tic Tac Toe Docs',
    default: 'Tic Tac Toe Docs',
  },
  description: 'Documentation for Tic Tac Toe.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocsLayout
          tree={source.pageTree}
          nav={{ title: 'Tic Tac Toe' }}
          githubUrl="https://github.com/FictionFoxy/tic-tac-toe"
        >
          {children}
        </DocsLayout>
      </body>
    </html>
  );
}
