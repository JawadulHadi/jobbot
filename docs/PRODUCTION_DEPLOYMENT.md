# Production Deployment Preparation (Jobbot)

> **Status:** Preparation guide. **Do not deploy/push/promote without explicit approval.**

This document describes how to prepare Jobbot for a production environment safely. It complements [README.md](../README.md), [docs/RELEASE_PROCESS.md](RELEASE_PROCESS.md), and [CONTRIBUTING.md](../CONTRIBUTING.md).

## 1) Readiness checklist (pre-deploy)

### Code & quality
- [ ] Branch reconciled with `origin/main`; changes merged via approved PRs
- [ ] `pnpm lint`, `pnpm test`, `pnpm build` pass on release candidate commit
- [ ] CI green (see `.github/workflows/ci.yml`)
- [ ] CHANGELOG, RELEASE_NOTES, phase docs, README/wiki, repo metadata updated
- [ ] Annotated release tag created/pushed **only with approval**

### Configuration & secrets
- [ ] `MONGODB_AGENTIC_API_URL` set to production/deployed Agent Engine `.../invokeStream` endpoint
- [ ] `MONGODB_AGENTIC_CLIENT_ID` / `MONGODB_AGENTIC_CLIENT_SECRET` set (service account with required role, e.g. `AGENT_DEVELOPER`) — **server-side secrets only**
- [ ] Optional app gate: `APP_BASIC_AUTH_USER` / `APP_BASIC_AUTH_PASSWORD` (interim only; not full authz)
- [ ] No secrets committed (`.env.local`, keys/tokens); `.env.example` remains placeholders only
- [ ] Secrets stored in host secret manager (Vercel/Render/Railway/etc.), rotated if previously exposed

### Security & access (required before public/live exposure)
- [ ] HTTPS enforced by platform
- [ ] **Full end-user authentication and authorization** implemented for chat and reviews (Phase C scope) — optional Basic Auth is insufficient for public production
- [ ] Review/approval workflows restricted to authorized users; audit/logging expectations defined
- [ ] Rate limiting / abuse protection and WAF/CDN rules considered per platform
- [ ] Dependency and runtime monitoring plan in place

### Observability & operations
- [ ] Health endpoint `/api/health` monitored (non-secret)
- [ ] `X-Request-Id` propagation used for request tracing/debugging
- [ ] Error monitoring/alerting configured (platform/tooling of choice)
- [ ] Rollback plan documented (previous known-good tag/build)

## 2) Environment variables (production)

See [`docs/ENV_AND_SECRETS.md`](ENV_AND_SECRETS.md) for full definitions, GitHub secrets/variables mapping, and sync tooling.

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_AGENTIC_API_URL` | Yes | Deployed workspace streaming endpoint (or approved target) |
| `MONGODB_AGENTIC_CLIENT_ID` | Yes (deployed endpoints) | Server-side secret |
| `MONGODB_AGENTIC_CLIENT_SECRET` | Yes (deployed endpoints) | Server-side secret |
| `APP_BASIC_AUTH_USER` | Optional | Interim gate only; set with password |
| `APP_BASIC_AUTH_PASSWORD` | Optional | Interim gate only; set with user |
| `OPENAI_API_KEY` | Optional | Only if required by your agent/runtime; not used by this Next.js app directly |

**Tooling:** `scripts/sync-github-env.ps1` (sync local env to GitHub secrets/variables via `gh`, dry-run supported) and `.github/workflows/sync-env.yml` (helper/check workflow). Validate configuration via `GET /api/health` after deploy (without exposing secrets).

## 3) Deployment targets (best path)

### Vercel (recommended)
**Best option for this Next.js App Router app:** managed hosting with native Next.js support, environment/secret management, preview deployments, automatic HTTPS, and easy rollbacks.
- **Install:** `pnpm install`
- **Build:** `pnpm build`
- **Output:** Next.js (App Router); `output: "standalone"` is enabled for portability
- **Env vars/secrets:** configure in Vercel project settings (Production/Preview as needed). Use `docs/ENV_AND_SECRETS.md` and `scripts/sync-github-env.ps1` for GitHub-side secret/variable management.
- **Auth gate:** optional `APP_BASIC_AUTH_*` enforced via `proxy.ts` (interim only; full authz required before public production).
- **Deploy action:** only after explicit approval.

### Docker / self-hosted (portable alternative)
Use for Render, Railway, Fly.io, Kubernetes, or VM/container platforms.
- **Included:** `Dockerfile` (multi-stage, pnpm, standalone runtime) and `.dockerignore`
- **Build:** `docker build -t jobbot .`
- **Run:** `docker run --rm -p 3000:3000 -e MONGODB_AGENTIC_API_URL=... [other env vars] jobbot` (or `--env-file`)
- **Health check:** `GET /api/health`; ensure HTTPS, secret management, logging/monitoring, and rollback per platform.

## 4) CI/CD

- **CI:** `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `lint`, `test`, `build` on pushes/PRs to `main`.
- **Env/secrets helper:** `.github/workflows/sync-env.yml` (manual) documents required keys and can report presence when permissions allow; use `scripts/sync-github-env.ps1` to set values.
- **Release helper:** `.github/workflows/release.yml` (manual, approval-gated) validates tag format and runs quality checks; optional tag/release creation requires `contents: write` and explicit approval.
- Recommended branch protection (apply with approval): require CI checks, require PR review, disallow direct pushes to `main`.

## 5) Post-deploy verification (when deployed)

- [ ] `/` loads and branded UI renders correctly (light/dark)
- [ ] `/api/health` reports expected configured state
- [ ] Chat can connect/stream with valid backend credentials
- [ ] `/reviews` loads and resume flows work for authorized reviewers
- [ ] Basic smoke checks for session restore, suspension/review handoff, and error states
- [ ] Monitor logs/alerts for errors and latency

## 6) Known constraints / follow-ups

- Full authz, session persistence/search, advanced review ops, metrics/alerting, and rate limiting are Phase C/hardening items.
- Atlas Agent naming is standardized in-repo/UI/platform references; confirm external/backend Agent Engine workspace or console labels if you require exact naming there.
- Accessibility/manual visual QA completion remains in progress (Phase A/B).
- Ensure GitHub/deployment secrets are configured (see `docs/ENV_AND_SECRETS.md`) before production use. Merge/tag/release/deploy actions require explicit approval.

## 7) Approval gate

**No deployment, push, merge, or tag/release publication without explicit approval.** Prepare artifacts and validation in advance; execute production actions only when approved.
