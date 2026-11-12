# Release Notes — Jobbot

This document records release/build notes and tags for Jobbot. **Every build/phase increment must add/update release notes, changelog, tags, milestones, and related documentation** per [docs/RELEASE_PROCESS.md](docs/RELEASE_PROCESS.md). No deploy/push/tag without explicit approval.

## Current state (unreleased, local workspace snapshot)

- **Date:** 2026-11-12
- **Branch (local):** `main` (behind `origin/main` by 2 commits; reconciliation required before release actions)
- **Proposed next version:** `v0.2.0` (pending approval, merge, and validation on target commit)
- **Related milestones:** Phase A — Brand & UI Polish; Phase B — Strengthen Existing Implementations; Phase C — New Implementations (scoping/readiness)
- **Local working tree:** contains uncommitted changes and untracked files (see git status below); must be split into logical, reviewable branches/commits and PRs.

### Git status snapshot (at documentation time)

- Local commits ahead context: `f7038f4`, `03c8360`
- Remote `origin/main` ahead: `6b2aacd` (merge PR #1 `icy-hoverfly`), `b33b08a`
- Modified: `.env.example`, `app/api/chat/history/route.ts`, `app/api/chat/route.ts`, `app/api/health/route.ts`, `app/api/reviews/[executionId]/resume/route.ts`, `app/api/reviews/route.ts`, `components/chat/chat.test.tsx`, `components/chat/chat.tsx`, `components/chat/message.tsx`, `components/chat/messages.tsx`, `components/reviews/reviews.tsx`
- Untracked: `app/icon.svg`, `components/theme-toggle.tsx`, `docs/`, `lib/request-id.ts`
- Existing tags: **none**

### Highlights (included/proposed for next release)

- **Brand & UI (Phase A):** Jobbot branding retained; warm amber/brown accent (replacing green); dark/light theme toggle (persisted + system fallback); branded headers/empty states; `app/icon.svg`; metadata and config/setup guidance; a11y baseline (focus, labels, skip link/landmarks, status semantics); contrast/landmark tuning.
- **Reliability & UX (Phase B):** `X-Request-Id` on API responses; visibility-aware polling (chat suspended/resuming and reviews queue); reviews/chat status/copy/timestamp refinements; restoration/recovery after workspace regression and `.next` cache corruption.
- **Documentation & governance:** Roadmap and detailed phase logs (A/B/C), changelog, release/process/metadata/wiki/contributing artifacts, milestone/label/tag/branch/PR practices.

### Validation evidence (latest recorded)

- Lint: **pass** (`npx -y pnpm@10.24.0 lint`)
- Tests: **pass** — 64/64, 10 files (`npx -y pnpm@10.24.0 test`)
- Build: **pass** (`npx -y pnpm@10.24.0 build`)
- Dev runtime: `/` and `/reviews` returned **200** after recovery (local)

### Known issues / blockers

- “atlas-agent agent” rename requested but not found in app UI source; local agent assets/config exist under `atlas-agent/agents/atlas-agent/` (and related dev-supervisor commit context). Naming/location and preferred replacement must be confirmed before rename.
- Full WCAG contrast audit, complete keyboard-only/responsive/manual visual QA pending (Phase A).
- Phase B hardening and Phase C implementation pending (error mapping/backoff, filtering/sorting/feedback, tests/CI, authz/sessions/ops decisions).
- Git reconciliation required (`main` behind `origin/main`); no push/merge/tag/deploy without approval.

---

## Tag registry

| Tag                 | Target commit     | Date  | Status   | Milestone(s)                      | PR(s) | Notes                                                                                                                                 |
| ------------------- | ----------------- | ----- | -------- | --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| _none yet_          | -                 | -     | -        | -                                 | -     | Create annotated tags from merged, validated commits on `main` after approval (e.g. `v0.1.0` baseline tag if desired, `v0.2.0` next). |
| `v0.2.0` (proposed) | _TBD after merge_ | _TBD_ | Proposed | Phase A, Phase B, Docs/Governance | _TBD_ | Do not create until reconciled, PR-merged, validated, and approved.                                                                   |

### Tagging commands (reference; run only with approval on correct commit)

```bash
# after checkout of merged main at release commit
git tag -a vX.Y.Z -m "Release vX.Y.Z: <summary>"
git push origin vX.Y.Z
# optional: gh release create vX.Y.Z --title "vX.Y.Z" --notes-file docs/releases/vX.Y.Z.md
```

---

## Release note template (use for every build/phase release)

Copy to `docs/releases/vX.Y.Z.md` (or add a section here) for each release:

```md
## vX.Y.Z — YYYY-MM-DD
- **Status:** Draft/Released
- **Type:** Major/Minor/Patch/Pre-release
- **Target commit:** `<sha>`
- **Tag:** `vX.Y.Z` (annotated) — created/pushed: Yes/No (approval required)
- **Milestone(s):** Phase A/B/C/...
- **PR(s):** #...
- **Branch(es):** ...

### Summary
- 

### Added
- 

### Changed
- 

### Fixed
- 

### Security
- 

### Deprecated/Removed
- 

### Documentation & governance
- Release notes/changelog updated, milestones/tags/README/wiki/repo metadata reviewed.

### Validation
- Lint: pass/fail
- Tests: pass/fail (N/M)
- Build: pass/fail
- Manual/QA notes:

### Upgrade/operational notes
- Env/config/migration steps (if any):

### Known issues
- 
```

---

## Per-build/phase practice (mandatory for future phases/builds)

For **every build and every phase increment** (including docs-only governance changes):

1. Work on a **new branch** from up-to-date target base; keep changes scoped and traceable to a milestone/issue.
2. Make **small, logical commits** with clear messages; include docs/validation updates in the same change set when relevant.
3. Update **CHANGELOG.md**, **RELEASE_NOTES.md** (and/or `docs/releases/`), and relevant **phase docs/wiki/README/repo metadata**.
4. Run and record validation (lint/test/build and applicable QA).
5. Open a **Pull Request** with summary, scope, milestone, labels, validation, and risks/rollback notes; obtain review/approval before merge.
6. After merge (and approval), create/push **annotated tag** and publish GitHub Release if applicable; close/update milestone.

> Note on “any single line of change must be commit in new branch”: strict line-by-line commits are generally impractical and harmful to history/readability. The enforced practice is **atomic, reviewable commits per logical change on dedicated branches** (see [CONTRIBUTING.md](CONTRIBUTING.md)); exceptionally granular commits may be used only when explicitly required and reviewable.
