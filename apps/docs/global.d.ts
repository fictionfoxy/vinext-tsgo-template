declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Generated at build time by the fumadocs-mdx Vite plugin. This stub keeps
// typecheck green before the first build runs; the real file is richer.
declare module '@/.source' {
  import type { PageData, MetaData } from 'fumadocs-core/source';
  interface _FileInfo {
    path: string;
    absolutePath: string;
  }
  type DocEntry = PageData & { _file: _FileInfo; body: unknown; toc: unknown[] };
  type MetaEntry = MetaData & { _file: _FileInfo };
  export declare const docs: DocEntry[];
  export declare const meta: MetaEntry[];
}
