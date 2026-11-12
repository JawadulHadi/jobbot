# Contributing to Jobbot

Thank you for contributing to **Jobbot**. This project follows strict, documented practices for branching, commits, pull requests, releases, and documentation. **No deployment or remote push/merge/tag without explicit approval.**

## Prerequisites

- Node.js 18+ (Node 22 recommended)
- pnpm 10.x (or `npx -y pnpm@10.24.0 ...`)
- Git and (for remote operations, when approved) GitHub CLI (`gh`) with appropriate access
- Atlas Agent Engine workspace or local `agentengine dev up` for end-to-end chat/review flows

## Local setup

```bash
pnpm install
cp .env.example .env.local
# configure MONGODB_AGENTIC_* (and optional APP_BASIC_AUTH_*). Never commit secrets.
pnpm dev
```

Useful checks before submitting changes:

```bash
pnpm lint
pnpm test
pnpm build
```

## Workflow (required)

### 1. Sync and branch
- `git fetch origin` and reconcile with `origin/main` before starting work.
- Create a **new branch for each logical change/PR** (do not work directly on `main`):
  - `docs/release-governance-v0.2.0`
  - `feat/chat-session-sidebar`
  - `fix/reviews-visibility-polling`
- Keep scope focused and tied to a **milestone** (Phase A/B/C, Release & Governance, etc.).

### 2. Commits
- Make **small, atomic, logical commits** with clear messages (Conventional Commits recommended):
  - `type(scope): summary` (e.g. `docs(release): add changelog and tag registry`)
- Commit only related files together; include relevant docs/validation updates in the same PR/change set.
- **Do not commit secrets** (`.env*` except `.env.example`, tokens/keys). Ensure `.gitignore` is respected.
- Granularity policy: the project requires dedicated branches and proper commits/PRs per change. Prefer atomic logical commits; split further only when explicitly required and still reviewable.

### 3. Documentation & release hygiene (every build/phase)
For every build/phase increment, update as applicable:
- `CHANGELOG.md` and `RELEASE_NOTES.md` / `docs/releases/*`
- `docs/phases/PHASE_*.md` and `docs/BRAND_AND_ROADMAP.md`
- `README.md`, `docs/wiki/*` (and publish to GitHub wiki when approved)
- `docs/REPOSITORY_METADATA.md` (description/topics/tags/labels/milestones)
- Validation evidence (lint/test/build/QA)

See [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md) for full requirements.

### 4. Pull requests
- Open PR to `main` with: summary, scope, milestone, labels, validation results, docs-updated checklist, UI screenshots when relevant, risks/rollback, and “no deploy without approval” note.
- Address review feedback; merge only with approval. Delete branch after merge.

### 5. Releases & tags
- Bump/version, update notes/changelog, validate, then create **annotated tags** (`vX.Y.Z`) on the merged commit and publish release **only with explicit approval**.

## Milestones & labels

- **Phases are milestones:** Phase A (Brand & UI Polish), Phase B (Strengthen Existing Implementations), Phase C (New Implementations), plus Release & Governance / Hotfix as needed.
- Suggested labels: `phase:a|b|c`, `type:feature|fix|docs|chore`, `area:chat|reviews|api|a11y|branding`, `release`, `needs-approval`, `blocked`.

## Security

- Keep credentials and tokens server-side; never expose secrets in code, logs, docs, commits, or screenshots.
- Public/live use requires proper authentication/authorization beyond optional Basic Auth (see README and Phase C).

## Questions / approvals needed

- Remote push/merge/tag/release, GitHub milestones/labels/wiki updates, and deployments require explicit approval.
- “atlas-agent agent” rename requires clarification of source/location (UI vs `atlas-agent/agents/atlas-agent/` assets vs backend/Agent Engine) and preferred name.
- Local `main` is currently behind `origin/main` with uncommitted work; coordinate reconciliation strategy before executing branch/commit/PR operations.
