# Jobbot

A branded Next.js chatbot and human-review UI for [Atlas Agent Engine](https://agentengine.mongodb.com). Jobbot provides streaming chat with session continuity, a suspend/resume human review queue, dark/light theming, and operational hardening—built for trustworthy, accountable AI-assisted workflows.

> **Status:** Phase A/B in progress, Phase C initiated (scoping/readiness). **No deployment/promotion/push without explicit approval.******

## Features

- **Streaming chat** via `/api/chat` with authoritative session handling and suspend/resume awareness.
- **Conversation history** restore/polling, editable User/Session IDs, and visibility-aware session refresh.
- **Human reviews** at `/reviews` for suspended executions (decision reviews and native interrupt `resume_map` resumes), with visibility-aware queue refresh.
- **Health/config check** at `/api/health` with in-app setup guidance (non-sensitive).
- **Brand & UX baseline:** Jobbot identity, warm amber/brown accent, dark/light theme toggle (persisted + system fallback), polished empty/loading/error states.
- **Accessibility baseline:** focus-visible styling, accessible labels, skip link/main landmarks, and status semantics (`aria-live` where appropriate).
- **Observability-lite:** non-sensitive `X-Request-Id` headers on API responses.
- **Optional Basic Auth** for simple gating (`APP_BASIC_AUTH_USER` / `APP_BASIC_AUTH_PASSWORD`).

## Prerequisites

- Node.js 18+ (Node 22 recommended)
- [pnpm](https://pnpm.io/installation) (or use `npx -y pnpm@10.24.0 ...`)
- An Atlas Agent Engine workspace (deployed) or a local agent via `agentengine dev up`

## Quick start

1. **Install dependencies**

   ```bash
   pnpm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env.local` and set values (never commit secrets). See [`docs/ENV_AND_SECRETS.md`](docs/ENV_AND_SECRETS.md) for key definitions, GitHub secrets/variables sync, and deployment configuration.
   - `MONGODB_AGENTIC_API_URL` – workspace `.../invokeStream` URL, or local `http://localhost:<playground-port>/invoke/stream` from `agentengine dev up` (use the **playground UI** port).
   - `MONGODB_AGENTIC_CLIENT_ID` / `MONGODB_AGENTIC_CLIENT_SECRET` – required for deployed endpoints (service account with `AGENT_DEVELOPER`); leave blank for local proxy without auth.
   - Optional: `APP_BASIC_AUTH_USER` / `APP_BASIC_AUTH_PASSWORD` to protect the app when deployed (interim gate only).

3. **Run locally**
****
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) (chat), [http://localhost:3000/reviews](http://localhost:3000/reviews), and [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Scripts

- `pnpm dev` – development server
- `pnpm build` – production build
- `pnpm start` – run production server
- `pnpm lint` – lint
- `pnpm test` – tests (Vitest)

## Project structure

```text
app/
  api/chat/           — message and session-history proxies
  api/reviews/        — review list and resume proxies
  api/health/         — config/health endpoint
  page.tsx            — chat
  reviews/page.tsx    — human review queue
components/           — chat, reviews, theme toggle, UI primitives
lib/                  — Agent Engine API/auth, session & review helpers, request IDs
middleware.ts         — optional HTTP Basic Auth when env vars are set
docs/                 — roadmap, phase logs, release/governance, wiki drafts
```

## Documentation

- **Roadmap & phases:** [`docs/BRAND_AND_ROADMAP.md`](docs/BRAND_AND_ROADMAP.md), [`docs/phases/PHASE_A.md`](docs/phases/PHASE_A.md), [`docs/phases/PHASE_B.md`](docs/phases/PHASE_B.md), [`docs/phases/PHASE_C.md`](docs/phases/PHASE_C.md)
- **Release & governance:** [`CHANGELOG.md`](CHANGELOG.md), [`RELEASE_NOTES.md`](RELEASE_NOTES.md), [`docs/RELEASE_PROCESS.md`](docs/RELEASE_PROCESS.md), [`docs/releases/`](docs/releases/)
- **Environment & secrets:** [`docs/ENV_AND_SECRETS.md`](docs/ENV_AND_SECRETS.md), [`scripts/sync-github-env.ps1`](scripts/sync-github-env.ps1), [`.github/workflows/sync-env.yml`](.github/workflows/sync-env.yml)
- **Contributing & workflow:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Production deployment preparation:** [`docs/PRODUCTION_DEPLOYMENT.md`](docs/PRODUCTION_DEPLOYMENT.md), CI workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml), release helper [`.github/workflows/release.yml`](.github/workflows/release.yml)
- **Repository metadata (description/topics/labels/milestones/tags):** [`docs/REPOSITORY_METADATA.md`](docs/REPOSITORY_METADATA.md)
- **Wiki drafts (publish to GitHub Wiki with approval):** [`docs/wiki/`](docs/wiki/)

## Release, tags & milestones (practice)

- **Versioning:** Semantic Versioning with annotated git tags `vX.Y.Z` on merged, validated `main` commits only (**approval required**).
- **Phases as milestones:** Phase A (Brand & UI Polish), Phase B (Strengthen Existing Implementations), Phase C (New Implementations), plus Release & Governance / Hotfix as needed.
- **Every build/phase increment must update:** changelog, release notes, tags/registry plan, phase docs, README/wiki, and repo metadata (description/topics/labels/milestones) with recorded validation.
- **Git workflow:** reconcile with `origin/main`, work on a **new branch per logical change**, make **atomic commits** (Conventional Commits recommended), open a **PR** with milestone/labels/validation/docs checklist, and merge/tag only with approval. (Prefer atomic, reviewable commits; avoid direct commits to `main`.)

See [`docs/RELEASE_PROCESS.md`](docs/RELEASE_PROCESS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md) for full details.

## Deploy (recommended path)

**Best default for this Next.js app: [Vercel](https://vercel.com/)** — managed Node/edge-compatible hosting, first-class Next.js support, easy environment variable/secret management, preview deployments, HTTPS, and simple rollbacks. Use Vercel unless you have a specific need for self-hosting/containers.

### Vercel (recommended)
1. Ensure code is merged/approved for release and CI is green on the target commit.
2. Import/connect `JawadulHadi/jobbot` in Vercel.
3. Configure environment variables/secrets (`MONGODB_AGENTIC_API_URL`, `MONGODB_AGENTIC_CLIENT_ID`, `MONGODB_AGENTIC_CLIENT_SECRET`, optional `APP_BASIC_AUTH_*`) in Vercel project settings (use `docs/ENV_AND_SECRETS.md` and `scripts/sync-github-env.ps1` for GitHub-side config where applicable).
4. Deploy/redeploy with approval. Build: `pnpm build`, Install: `pnpm install`.

### Docker / self-hosted (portable alternative)
- A production `Dockerfile` (standalone output) and `.dockerignore` are included.
- Build: `docker build -t jobbot .`
- Run: `docker run --rm -p 3000:3000 -e MONGODB_AGENTIC_API_URL=... -e MONGODB_AGENTIC_CLIENT_ID=... -e MONGODB_AGENTIC_CLIENT_SECRET=... jobbot`
- Suitable for Render, Railway, Fly.io, Kubernetes, or any container platform. Configure HTTPS, secrets, and health checks (`/api/health`) per platform.

See [`docs/PRODUCTION_DEPLOYMENT.md`](docs/PRODUCTION_DEPLOYMENT.md) for readiness checklist and operational notes. No deploy/push/tag/release without explicit approval.

## Security notes

- Service-account secrets and access tokens stay in server-side route handlers; request IDs are non-sensitive.
- **This app does not include full end-user authentication/authorization by default.** Enable Basic Auth for a simple gate and/or add proper app auth and authorization to chat and review routes before any public production use.
- Do not commit `.env.local`, credentials, or tokens.

## How it works

The UI sends messages to `/api/chat`, which forwards them to the Atlas Agent Engine streaming endpoint and pipes SSE chunks back via the Vercel AI SDK. The server preserves `X-Session-ID` for session continuity. `/api/reviews` exposes suspended executions and supports decision resumes and native interrupt `resume_map` flows. API responses include `X-Request-Id` for traceability, and polling is visibility-aware to reduce unnecessary background requests.

## Repository

- **Origin:** <https://github.com/JawadulHadi/jobbot.git>
- **Description/topics/milestones/labels/tags:** see [`docs/REPOSITORY_METADATA.md`](docs/REPOSITORY_METADATA.md) (apply via GitHub with approval)
- **Current local note:** working changes and git reconciliation may be required before branching/PR/tag actions; see [`RELEASE_NOTES.md`](RELEASE_NOTES.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).
