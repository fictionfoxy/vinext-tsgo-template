import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/app/source';
import type { ReactNode } from 'react';
import 'fumadocs-ui/style.css';

export const metadata = {
  title: {
    template: '%s | My App Docs',
    default: 'My App Docs',
  },
  description: 'Documentation for My App.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DocsLayout
          tree={source.pageTree}
          nav={{ title: 'My App' }}
          githubUrl="https://github.com/my-org/my-app"
        >
          {children}
        </DocsLayout>
      </body>
    </html>
  );
}
