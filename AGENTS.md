<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Jobbot AGENTS.md

Compact, repo-specific guidance for OpenCode sessions. Trust executable sources (package.json, CI, configs) over prose.

## Repo shape
- Root is a Next.js 16 App Router chatbot + human-review UI (pnpm). Entry points: `app/page.tsx` (chat), `app/reviews/page.tsx`, `app/api/*` proxies, `proxy.ts`.
- `atlas-agent/agents/atlas-agent` is a separate Python ADK agent (uv, `agentengine` CLI). Treat as its own project; never edit its `.agentengine/` (generated). Consult `.agents/skills/atlas-agent-engine/SKILL.md` before touching it.
- Major dirs: `app/`, `components/`, `lib/`, `hooks/`, `test/`, `scripts/`, `docs/`.

## Commands (root, Next.js)
- Install: `pnpm install` (CI: `pnpm install --frozen-lockfile`). pnpm 10.24.0, Node 22 in CI.
- Dev: `pnpm dev` (port 3000). Build: `pnpm build`. Start: `pnpm start`.
- Lint: `pnpm lint` (eslint-config-next). Test: `pnpm test` (`vitest run`).
- No dedicated typecheck script; `pnpm build` runs tsc. CI order: lint → test → build.
- Single test file: `pnpm vitest run path/to/file.test.ts` (or `pnpm test -- <file>`).
- Python agent (run from `atlas-agent/agents/atlas-agent`): `uv sync --group dev`; checks `uv run ruff check src`, `uv run ruff format --check src`, `uv run pyright`, `python -m compileall -q src`; dev via `agentengine dev up` / `agentengine dev down`.
- Database (Phase C, optional): `pnpm db:generate` (Drizzle), `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`. Requires `DATABASE_URL`; app degrades gracefully when unset. Migrations live in `drizzle/`.
- pnpm-workspace sets `minimumReleaseAge: 10080` (7 days); a dependency published within the last week may be rejected by install.

## Testing quirks
- Vitest: jsdom env, setup `test/setup.ts` (mocks `IntersectionObserver`, cleans up after each test). Alias `@` → repo root.
- `server-only` is aliased to `test/server-only.ts` (empty module) so server-only code is unit-testable; do not remove.
- Test files match `**/*.{test,spec}.{ts,tsx,mts,cts}` anywhere, including `scripts/setup-github-metadata.test.ts` (runs under node via `@vitest-environment node` and spawns `pwsh`). Requires PowerShell on PATH.
- Tests may use `@vitest-environment node` pragma.

## Environment / config
- Copy `.env.example` → `.env.local`. Required: `MONGODB_AGENTIC_API_URL`. Deployed endpoints also need `MONGODB_AGENTIC_CLIENT_ID`/`_SECRET`. Optional `APP_BASIC_AUTH_USER`/`_PASSWORD`.
- Local dev: point `MONGODB_AGENTIC_API_URL` at the **playground UI** port printed by `agentengine dev up` (`.../invoke/stream`), not the orchestration engine port — reviews/history 404 otherwise (chat still works).
- Auth gating lives in `proxy.ts` (Next 16 convention; docs/wiki may say `middleware.ts`, but the file is `proxy.ts`). Do not rename.
- Target resolution (local vs deployed) is derived from the URL path/loopback in `lib/agent-engine-api.ts`.
- `next.config.ts`: `output: "standalone"`, security headers. Docker builds produce standalone output.

## Architecture notes
- API routes proxy to Agent Engine and exchange tokens server-side; never expose secrets or log credentials.
- `X-Request-Id` on API responses; visibility-aware polling in UI.
- Secrets flow: `.env.local` local; GitHub Actions secrets/variables in CI; Vercel/hosting env in prod. Sync via `scripts/sync-github-env.ps1`.

## Git / release constraints
- No push, merge, tag, deploy, or release without explicit user approval.
- Reconcile with `origin/main` first; new branch per logical change; atomic Conventional Commits.
- Every build/phase increment updates `CHANGELOG.md`, `RELEASE_NOTES.md`, phase docs, README/wiki, metadata (see `CONTRIBUTING.md`, `docs/RELEASE_PROCESS.md`).
- Python agent: `agent.yaml` owns identity/flags; local-only settings (ports, MongoDB toggle) belong in `dev.yaml`; never commit `.agentengine/`.

## Verification
- Run `pnpm lint` → `pnpm test` → `pnpm build` (matches CI). For Python agent: ruff check/format → pyright → compileall.

## Instruction sources to consult
- `CLAUDE.md` just imports this file. Skills: `.agents/skills/` and `.claude/skills/` (atlas-agent-engine, atlas-agent-engine-docs).
- Docs: `docs/ENV_AND_SECRETS.md`, `CONTRIBUTING.md`, `docs/RELEASE_PROCESS.md`, `docs/PRODUCTION_DEPLOYMENT.md`, `docs/wiki/*`.
