# tic-tac-toe

> A production-ready Turborepo monorepo template. Rename `tic-tac-toe` to your project name using `node scripts/init.mjs`.

## Stack

| Layer | Tool |
|-------|------|
| Framework | [React 19](https://react.dev) |
| UI | [Mantine 9](https://mantine.dev) |
| Data fetching | [TanStack Query 5](https://tanstack.com/query) |
| Validation | [Zod 3](https://zod.dev) |
| Build | [Vite 8](https://vite.dev) |
| Docs | [vinext](https://vinext.dev) + [Fumadocs](https://fumadocs.vercel.app) |
| Testing | [Vitest 4](https://vitest.dev) |
| Type checking | [tsgo](https://github.com/microsoft/typescript-go) (`@typescript/native-preview`) |
| Linting | [Oxlint](https://oxc.rs/docs/guide/usage/linter) |
| Formatting | [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) |
| Monorepo | [Turborepo](https://turbo.build) |
| Deployment | [Vercel](https://vercel.com) |
| Search | [Pagefind](https://pagefind.app) |
| LLM automation | [Cursor SDK](https://cursor.com/sdk) |

## Workspace layout

```
apps/
  web/          Vite + React Router SPA
  docs/         vinext + Fumadocs documentation site
packages/
  ui/           Shared component/hook library
  tsconfig/     Shared TypeScript configurations
scripts/        Cursor SDK automation (LLM doc generation)
llm-docs/       Machine-readable project docs (AGENTS.md)
llms.txt        llms.txt for AI assistants
```

## Quick start

### 1. Use this template

Click **Use this template** on GitHub, or clone and run the init script:

```bash
git clone https://github.com/FictionFoxy/tic-tac-toe.git
cd tic-tac-toe
node scripts/init.mjs
```

The init script will prompt for your project name and GitHub URL, replace all `tic-tac-toe` placeholders, and remove itself.

### 2. Install dependencies

```bash
pnpm install
```

> Requires Node >= 24 and pnpm >= 9. Run `corepack enable` if pnpm is not available.

### 3. Develop

```bash
pnpm dev                          # starts all apps in watch mode
pnpm dev --filter=@tic-tac-toe/web    # web app only
pnpm dev --filter=@tic-tac-toe/docs   # docs site only
```

### 4. Type check, lint, test

```bash
pnpm typecheck    # tsgo across all workspaces
pnpm lint         # oxlint from root config
pnpm test         # vitest across all workspaces
pnpm build        # production build
```

### 5. Update LLM docs

```bash
pnpm gen:llms     # regenerates llms.txt via Cursor SDK
pnpm gen:agents   # regenerates llm-docs/AGENTS.md via Cursor SDK
```

## Deployment

Both apps deploy to Vercel independently. Each has a `vercel.json` that routes the Turbo build through the monorepo root.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FFictionFoxy%2Ftic-tac-toe)

## Renaming the template

All placeholder strings to find/replace:

| Placeholder | Replace with |
|-------------|-------------|
| `tic-tac-toe` | your project slug (e.g. `acme-saas`) |
| `FictionFoxy` | your GitHub org/user |
| `Tic Tac Toe` | your display name |

Run `node scripts/init.mjs` for an interactive replacement.

## License

MIT
