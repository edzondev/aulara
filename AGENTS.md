<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

# Aulara

pnpm + Turborepo monorepo. Package manager is pinned to `pnpm@11.24.0`; never use npm/yarn. Workspaces: `apps/*` (`admin`, `platform`, `web`) and `packages/*` (`ui`, `typescript-config`).

## Commands (run from repo root)

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm format` / `pnpm check-types` — run the matching task across all packages via turbo.
- Scope to one app/package: `pnpm dev --filter=apps-platform` (or `--filter=@aulara/admin`). Use `--filter=<name>` per the `name` field in `package.json`, not the folder name.
- Lint and format are **Biome** (there is no ESLint/Prettier, despite the boilerplate README). `lint` = `biome check --write` (auto-fixes). Style: tab indent, double quotes, trailing commas. Run `pnpm lint` after edits.
- Typecheck per package: `pnpm check-types` (each runs `tsc --noEmit`).

## Apps

- `apps/admin` and `apps/platform` — **Next.js 16.3.2** + React 19 with the **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`). Next 16 has breaking conventions: read the auto-generated warning in `apps/<app>/AGENTS.md` and `node_modules/next/dist/docs/` before writing code (in a monorepo the `next` package may not resolve from the repo root).
- `apps/platform` — primary app. Auth routes live under `src/app/(platform)/`; shell/croma components in `src/components/shell/`. Small pure decision functions (navigation, responsive, preference) are unit-tested.
- `apps/web` — **Astro 7**, unrelated to the Next apps. Start its dev server with `astro dev --background` (manage via `astro dev stop|status|logs`).

## Shared UI package (`@aulara/ui`)

- Tailwind v4 + shadcn (style `base-nova`) + Base UI. **No barrel export** — `src/index.ts` is an empty `export {}`. Import by subpath:
  - components: `@aulara/ui/components/<name>`
  - lib: `@aulara/ui/lib/<name>` (e.g. `sidebar`, `utils`)
  - hooks: `@aulara/ui/hooks/<name>`
  - styles: `@aulara/ui/globals.css`
- **Tailwind gotcha:** the only Tailwind entrypoint is `packages/ui/src/styles/globals.css`, which is imported by each app's root layout (apps do not define their own Tailwind). It scans source via `@source "../../../apps/**/*.{ts,tsx}"`, so new app source files must live under `apps/` to be picked up.
- Use the existing `--aulara-*` oklch design tokens (canvas, surface, accent green, ink) defined in `globals.css` — do not introduce a parallel palette.

## Testing

- Only `apps/platform` has tests: **Vitest + Testing Library** (jsdom, setup in `src/test/setup.ts`). Vitest is **not** wired into turbo root scripts.
- Run tests from the **repo root**: `pnpm --filter=@aulara/platform test` (single run) or `pnpm --filter=@aulara/platform test:watch`. Running `pnpm test` from inside `apps/platform` fails: pnpm v11's deps-status check reads the app-local `pnpm-workspace.yaml` (which has no `packages:` key) and cannot resolve `@aulara/ui@workspace:*`.
- Tests are colocated as `*.test.ts(x)` next to the source. Per project convention, write a failing test before implementing a production function.
