# Release & Governance

This page summarizes mandatory practices. See [docs/RELEASE_PROCESS.md](../RELEASE_PROCESS.md) for the full policy.

## Phases as milestones
- **Phase A — Brand & UI Polish**
- **Phase B — Strengthen Existing Implementations**
- **Phase C — New Implementations** (scoped/approved)
- **Release & Governance** (recommended for docs/process hygiene)
- **Hotfix / Patch** (as needed)

Every PR/commit stream must be tied to a milestone and kept current.

## Required for every build/phase increment
1. **Changelog** (`CHANGELOG.md`) updated
2. **Release notes** (`RELEASE_NOTES.md` / `docs/releases/vX.Y.Z.md`) updated with scope, commits/PRs, tags, validation, known issues
3. **Phase docs** (`docs/phases/PHASE_*.md`) and roadmap updated
4. **README** and **wiki** updated for behavior/process changes
5. **Repo metadata** reviewed (description, topics, labels, milestones, tags/releases)
6. **Validation recorded** (lint/test/build + QA as applicable)

## Versioning & tags
- Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Annotated tags `vX.Y.Z` created from merged, validated `main` commits only
- **No tag/push/release/deploy without explicit approval**

## Branch, commit, PR workflow
- Sync with `origin/main` before work; never commit directly to `main`
- **New branch per logical change/PR** (e.g. `docs/...`, `feat/...`, `fix/...`)
- **Atomic, logical commits** with clear messages (Conventional Commits recommended)
- PR must include summary, scope, milestone, labels, validation, docs checklist, risks/rollback
- Merge only with approval; update milestones/notes/tags post-merge as applicable

> Granularity note: prefer atomic, reviewable commits per logical change. Line-by-line commits are only for exceptional cases when explicitly required.

## Current repo considerations
- Reconcile local `main` with `origin/main` before release operations (divergence/uncommitted work may exist).
- Remote actions (push/PR/tag/release/wiki/milestones/labels/deploy) require explicit approval.
- “atlas-agent agent” rename source/location needs clarification before applying consistently.
