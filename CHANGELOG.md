# Changelog

All notable changes to **Jobbot** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for tagged releases (see [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md)).

> **Release/build practice:** Every phase/build/release must update release notes, changelog, tags, milestones, and related documentation (README/wiki/repo metadata) as applicable before merge/tag. No deployment or remote push without explicit approval.

## [Unreleased]

### Added
- Brand/UI baseline: Jobbot identity retained, warm amber/brown accent tokens, branded headers/empty states, and `app/icon.svg` metadata.
- Manual dark/light theme toggle with persisted preference and system fallback (`components/theme-toggle.tsx`).
- In-product setup/config guidance driven by `/api/health`.
- Accessibility improvements: focus-visible styling, accessible labels, skip link and main landmarks, status semantics (`aria-live` where appropriate).
- Observability-lite: non-sensitive `X-Request-Id` headers on API responses (`lib/request-id.ts` and API routes).
- Visibility-aware polling for suspended/resuming chat sessions and reviews queue refresh.
- Comprehensive phase/roadmap documentation: `docs/BRAND_AND_ROADMAP.md`, `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md`.
- GitHub metadata automation script and tests: `scripts/setup-github-metadata.ps1`, `scripts/setup-github-metadata.test.ts` (milestones/labels/description/topics).

### Changed
- Chat and reviews UI/UX refinements (copy, status/helper text, timestamps, layout polish) while preserving core behavior and API contracts.
- Test alignment for restored UI labels (`components/chat/chat.test.tsx`).
- Client-side error normalization in chat and reviews via `lib/api-errors.ts` (`normalizeApiErrorMessage`, `isAbortError`) for clearer, safer user-facing messages and abort handling.
- Reviews background polling now applies exponential backoff on consecutive load failures (reset on success, visibility regain, or manual refresh) to reduce request churn during transient issues.

### Fixed
- Recovery from `.next` Turbopack cache corruption during local dev/build (documented operational recovery).
- Restoration of reverted/missing enhanced UI/API/theme/request-id files in local working state.

### Security
- Non-sensitive request tracing only; no secrets/tokens exposed in request IDs or responses.

### Validation (latest recorded)
- `pnpm lint` — pass
- `pnpm test` — pass (81/81, 11 files)
- `pnpm build` — pass
- Local dev/runtime checks previously recorded for `/` and `/reviews`; manual end-to-end backend QA pending where applicable

### Notes
- **Not released/tagged yet.** Local `main` includes uncommitted work and is behind `origin/main` by 2 commits; reconciliation and approval required before branching/PR/merge/tag/push.
- “atlas-agent agent” rename requested but source appears external to app UI source (local agent assets exist under `atlas-agent/agents/atlas-agent/`; naming clarification required for consistent rename).

## [0.2.0] - proposed (pending approval & merge)

_Proposed release aggregating Phase A baseline, Phase B reliability/UX increments, and governance/docs practices. Do **not** create/push tag until approved, reconciled with remote, validated, and merged via PR._

- Scope: branding/theming/a11y baseline, request IDs, visibility-aware polling, reviews/chat UX refinements, docs/governance.
- Milestones: Phase A (Brand & UI Polish), Phase B (Strengthen Existing Implementations), Phase C (Scoping/Readiness) — see [docs/REPOSITORY_METADATA.md](docs/REPOSITORY_METADATA.md).

## [0.1.0] - 2026-11-11 (baseline, recorded)

### Added
- Initial enhanced Jobbot baseline: streaming chat, session/history handling, human review queue (decision/interrupt resumes), `/api/health`, optional Basic Auth, deploy/docs guidance.
- Initial project documentation and environment configuration examples.

### Git references (recorded)
- `03c8360` Initial Jobbot: enhanced chat/reviews, health check, optional basic auth, deploy docs
- `f7038f4` Dev supervisor for the local app container (local history)
- Remote `origin/main` also includes: `b33b08a` Atlas Agent Engine SDK starter for Google ADK 2, `6b2aacd` Merge pull request #1 from JawadulHadi/icy-hoverfly (reconciliation required locally)

---

## Tagging & release record guidance
- Use annotated tags for releases (e.g. `v0.1.0`, `v0.2.0`) created from the merged, validated commit on `main`.
- Record tag name, target commit SHA, date, summary, validation evidence, and PR/milestone links in [RELEASE_NOTES.md](RELEASE_NOTES.md) and/or `docs/releases/`.
- Never tag or push without explicit approval.
