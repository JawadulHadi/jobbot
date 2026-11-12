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

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_AGENTIC_API_URL` | Yes | Deployed workspace streaming endpoint (or approved target) |
| `MONGODB_AGENTIC_CLIENT_ID` | Yes (deployed endpoints) | Server-side secret |
| `MONGODB_AGENTIC_CLIENT_SECRET` | Yes (deployed endpoints) | Server-side secret |
| `APP_BASIC_AUTH_USER` | Optional | Interim gate only; set with password |
| `APP_BASIC_AUTH_PASSWORD` | Optional | Interim gate only; set with user |

Validate configuration via `GET /api/health` after deploy (without exposing secrets).

## 3) Deployment targets

### Vercel (recommended for Next.js)
- **Install:** `pnpm install`
- **Build:** `pnpm build`
- **Output:** Next.js (App Router)
- **Env vars:** configure all required secrets in project settings (Production/Preview/Development as appropriate)
- **Middleware/proxy:** Next.js 16 deprecates `middleware` convention in favor of `proxy` (warning observed during build) — plan migration in a future approved change; current behavior remains functional but should be tracked.
- **Deploy action:** only after explicit approval

### Other hosts (Render/Railway/Fly.io/Docker hosts)
- **Build:** `pnpm install && pnpm build`
- **Start:** `pnpm start` (bind to provided `PORT`)
- Ensure Node 18+ (22 recommended), HTTPS, and secret management.
- If using containers, create/maintain a Dockerfile aligned with pnpm/Next.js output and platform requirements (not included by default; add via approved PR).

## 4) CI/CD

- GitHub Actions workflow: `.github/workflows/ci.yml` runs `pnpm install --frozen-lockfile`, `lint`, `test`, `build` on pushes/PRs to `main`.
- Recommended branch protection (apply with approval): require CI checks, require PR review, disallow direct pushes to `main`.
- Release automation (tag/release publish) should be approval-gated.

## 5) Post-deploy verification (when deployed)

- [ ] `/` loads and branded UI renders correctly (light/dark)
- [ ] `/api/health` reports expected configured state
- [ ] Chat can connect/stream with valid backend credentials
- [ ] `/reviews` loads and resume flows work for authorized reviewers
- [ ] Basic smoke checks for session restore, suspension/review handoff, and error states
- [ ] Monitor logs/alerts for errors and latency

## 6) Known constraints / follow-ups

- Full authz, session persistence/search, advanced review ops, metrics/alerting, and rate limiting are Phase C/hardening items.
- “atlas-agent agent” naming may require rename in local agent assets (`atlas-agent/agents/atlas-agent/`) and/or backend/Agent Engine configuration (clarification needed).
- Accessibility/manual visual QA completion remains in progress (Phase A/B).
- Local git reconciliation (local `main` behind `origin/main`) and approved branch/PR/merge flow must be completed before production release actions.

## 7) Approval gate

**No deployment, push, merge, or tag/release publication without explicit approval.** Prepare artifacts and validation in advance; execute production actions only when approved.
