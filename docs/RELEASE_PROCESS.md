# Release, Build, Tagging & Documentation Process (Jobbot)

This document defines the **mandatory** practices for every build, phase increment, and release in Jobbot. It covers release notes, changelog, tagging, milestones, wiki/README/repo metadata, branching, commits, and pull requests.

> **Approval gate:** No deployment, remote push, merge, tag, or GitHub metadata mutation without explicit approval.

## 1) Versioning & tags

- **Scheme:** [Semantic Versioning](https://semver.org/) — `MAJOR.MINOR.PATCH` (optionally `-pre.N`).
  - **MAJOR:** breaking changes/contracts or major platform shifts (with migration notes).
  - **MINOR:** backward-compatible features/enhancements (e.g. completed phase increments).
  - **PATCH:** backward-compatible fixes/docs-only corrections as appropriate.
- **Current package version:** see `package.json` (`version`). Keep package version, changelog, release notes, and tags aligned for releases.
- **Tags:** annotated git tags, format `vX.Y.Z` (e.g. `v0.2.0`), created from the **merged, validated commit on `main`** only.
  - Record: tag, target SHA, date, summary, milestone(s), PR(s), validation evidence.
  - Do not move published tags; create a new patch/minor release instead.
- **Build identifiers (optional):** for non-release builds, use PR/commit SHAs and milestone context in notes; avoid ad-hoc tags without approval.

## 2) Phases as milestones (mapping)

GitHub milestones must reflect phases/streams and be kept current.

| Milestone | Scope | Typical deliverables |
|---|---|---|
| **Phase A — Brand & UI Polish** | Visual identity, theming, a11y baseline, copy/UX polish, brand assets baseline | Amber/brown tokens, theme toggle, icon/metadata, landmarks/focus/labels, config guidance, visual QA |
| **Phase B — Strengthen Existing Implementations** | Reliability, error/UX hardening, polling/session/reviews improvements, tests/CI, observability-lite | Request IDs, visibility-aware polling, improved states/errors, expanded tests, CI checks |
| **Phase C — New Implementations** | Higher-value capabilities (scoped/approved) | Authz, session management, review ops, conversation features, ops/observability, brand package |
| **Release & Governance** (recommended) | Release/tagging, docs, wiki, repo hygiene, process compliance | Changelog/release notes, README/wiki/metadata, contribution/release process, labels/templates |
| **Hotfix / Patch** (as needed) | Urgent fixes on released versions | Patch release notes/tag, regression validation |

**Rules:** every PR/commit set must reference its milestone; close/update milestones at phase/release checkpoints with notes and validation links.

## 3) Required artifacts for every build/phase increment

Before merge/tag (and as part of the same change stream/PR where applicable):

1. **CHANGELOG.md** — update `[Unreleased]` or release section (Added/Changed/Fixed/Security/etc.).
2. **RELEASE_NOTES.md** and/or `docs/releases/vX.Y.Z.md` — build/release summary, scope, PRs, commits/tags, validation, risks/known issues.
3. **Phase docs** — update `docs/phases/PHASE_*.md` and `docs/BRAND_AND_ROADMAP.md` with detailed changes/decisions/validation.
4. **README.md** — reflect user-facing behavior/setup changes.
5. **Wiki** — update relevant pages/content draft (see `docs/wiki/` and repo wiki) for user/operator/process docs.
6. **Repository metadata plan** — review/update description, topics/tags, labels, milestones (see `docs/REPOSITORY_METADATA.md`).
7. **Validation evidence** — lint/test/build and any manual QA recorded in PR and release notes.

## 4) Branching strategy (mandatory)

- **Protected base:** `main` is the releaseable branch; do not commit directly to `main` for changes—use PRs.
- **Sync before work:** reconcile local with `origin/main` (prefer `git fetch` + rebase/merge per team decision) before branching.
- **One logical change stream per branch:** create a **new branch for each change/PR** from the updated base.
  - Naming: `<type>/<scope>-<short-desc>` (e.g. `docs/release-governance-v0.2.0`, `fix/reviews-polling-visibility`, `chore/a11y-contrast-audit`).
  - Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`.
- **Granularity:** keep branches/PRs small and reviewable. The project requires changes to be committed on dedicated branches (not directly on `main`) with proper commits/PRs; prefer **atomic commits per logical change**. Line-by-line commit splitting should only be done when explicitly required and still reviewable.

## 5) Commit conventions

- **Format (Conventional Commits recommended):**
  - `type(scope): short imperative summary`
  - Optional body: what/why, risks, validation, refs (milestone/issue/PR)
  - Examples:
    - `docs(release): add changelog and release process for v0.2.0`
    - `feat(chat): add visibility-aware polling for suspended sessions`
    - `fix(api): include X-Request-Id on error responses`
- **Quality rules:**
  - Commit only related changes together; do not mix unrelated refactors.
  - Never commit secrets (`.env.local`, keys/tokens); verify `.gitignore`.
  - Ensure lint/test/build pass for the change set (or document exceptions with approval).
  - Reference milestone/issue in commit body or PR (e.g. `Refs: Phase B`, `Milestone: Phase A`).

## 6) Pull request workflow

1. Push branch (after approval to push) and open PR to `main`.
2. PR must include: **summary**, **scope/files**, **milestone**, **labels**, **linked issues** (if any), **validation results** (lint/test/build/QA), **docs updated** checklist, **screenshots** for UI changes (when available), **risks/rollback**, and **deployment note** (no deploy without approval).
3. Require review/approval per policy; resolve comments; keep history clean (rebase/squash only if agreed).
4. Merge via approved method; delete branch after merge.
5. Post-merge: update release notes/changelog state, tag/release if applicable, update milestone/wiki/metadata.

## 7) Release checklist (tag/build)

- [ ] Base branch synced and reconciled with `origin/main`
- [ ] All scoped PRs merged and milestone status updated
- [ ] `pnpm lint`, `pnpm test`, `pnpm build` pass on release candidate commit
- [ ] CHANGELOG, RELEASE_NOTES/`docs/releases/*`, phase docs, README, wiki, repo metadata updated
- [ ] Version bumped if required (`package.json` and lockfile as applicable)
- [ ] Annotated tag `vX.Y.Z` created on correct commit (**approval required**)
- [ ] Tag pushed and GitHub Release published (**approval required**)
- [ ] No secrets committed; deploy only with explicit approval

## 8) GitHub milestones, labels, and metadata

- Create/maintain milestones per Section 2; assign PRs/issues.
- Recommended labels: `phase:a`, `phase:b`, `phase:c`, `type:feature`, `type:fix`, `type:docs`, `type:chore`, `area:chat`, `area:reviews`, `area:api`, `area:a11y`, `area:branding`, `release`, `needs-approval`, `blocked`.
- Keep repo description, topics, homepage, and social preview aligned (see `docs/REPOSITORY_METADATA.md`).
- Wiki updates: publish from `docs/wiki/` drafts to GitHub wiki (requires wiki git remote/access and approval).

## 9) Current repository notes (action required)

- Local `main` is **behind `origin/main` by 2 commits** (`6b2aacd`, `b33b08a`) and has **uncommitted/untracked local work**. Before branching/PRs: reconcile safely (fetch + rebase/merge decision), preserve local work, and avoid force-push without approval.
- `atlas-agent/` agent assets exist locally and relate to the “atlas-agent agent” naming discussion; confirm rename scope (app UI vs agent directory/config/backend) before committing renames.
- Remote operations (push/PR/merge/tag/release/milestones/labels/wiki) require explicit approval and appropriate permissions.
