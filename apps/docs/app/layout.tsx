import { Footer, Layout, Navbar } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import 'nextra-theme-docs/style.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TypedFrame',
  description: 'A thin, type-safe React framework for Mantine, Zod, TanStack Query, and DnD Kit',
};

const navbar = (
  <Navbar
    logo={<strong>TypedFrame</strong>}
    projectLink="https://github.com/FictionFoxy/TypedFrame"
  />
);

const footer = (
  <Footer>
    MIT {new Date().getFullYear()} © TypedFrame.
  </Footer>
);

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/FictionFoxy/TypedFrame/tree/master/apps/docs"
          footer={footer}
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
