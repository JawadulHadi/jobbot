# Jobbot Wiki (Draft)

> **Status:** Draft content for GitHub Wiki. Publish/sync to the repository wiki with approval and appropriate access.  
> **Project:** Jobbot — Next.js chat and human-review UI for Atlas Agent Engine  
> **Repo:** <https://github.com/JawadulHadi/jobbot.git>

## Overview

Jobbot provides a branded, trustworthy interface for Atlas Agent Engine workflows:

- **Streaming chat** with session continuity and suspend/resume awareness
- **Human review queue** for decision and interrupt-based resumes
- **Configuration health guidance** and operational hardening (request IDs, visibility-aware polling)
- **Theming & accessibility baseline** (dark/light toggle, amber/brown brand accent, landmarks/focus/labels)

**Current status:** Phase A/B in progress, Phase C initiated (scoping/readiness). **No deployment without explicit approval.**

## Quick links

- [README](../../README.md) — setup, scripts, env vars, deploy/security notes
- [Brand & Roadmap](../BRAND_AND_ROADMAP.md) — vision, current state, phased plan
- [Phase A log](../phases/PHASE_A.md) — Brand & UI Polish
- [Phase B log](../phases/PHASE_B.md) — Strengthen Existing Implementations
- [Phase C log](../phases/PHASE_C.md) — New Implementations (scoping)
- [Release Process](../RELEASE_PROCESS.md) — mandatory build/release/tag/docs practices
- [Release Notes](../../RELEASE_NOTES.md) and [Changelog](../../CHANGELOG.md)
- [Contributing](../../CONTRIBUTING.md) — branching, commits, PR workflow
- [Repository Metadata](../REPOSITORY_METADATA.md) — description, topics/tags, labels, milestones

## Documentation map

| Page                                              | Purpose                                          |
| ------------------------------------------------- | ------------------------------------------------ |
| [Getting Started](Getting-Started.md)             | Local setup and first run                        |
| [Configuration](Configuration.md)                 | Environment variables and health checks          |
| [Architecture](Architecture.md)                   | High-level app/API/agent flow                    |
| [Human Reviews](Human-Reviews.md)                 | Suspended executions and resume flows            |
| [Release & Governance](Release-and-Governance.md) | Versioning, tags, milestones, required artifacts |
| [Troubleshooting](Troubleshooting.md)             | Common issues and recovery steps                 |

## Release & governance summary

- **Phases are milestones:** Phase A (Brand & UI Polish), Phase B (Strengthen Existing Implementations), Phase C (New Implementations), plus Release & Governance.
- **Every build/phase must update:** changelog, release notes, tags plan/registry, phase docs, README/wiki, and repo metadata (milestones/labels/topics/description as applicable).
- **Git workflow:** new branch per logical change, atomic commits (Conventional Commits recommended), PR with validation/milestone/labels, no direct commits to `main`.
- **Tags:** annotated SemVer tags (`vX.Y.Z`) on merged, validated `main` commits only — **approval required** before create/push.

## Known notes

- Local/remote git reconciliation may be required before release actions (`origin/main` divergence and local uncommitted work can exist).
- “atlas-agent agent” rename requires clarification of source (app UI vs `atlas-agent/agents/atlas-agent/` local agent assets vs backend/Agent Engine naming) and preferred brand-aligned name.
- Optional Basic Auth is not a substitute for full end-user authentication/authorization for public/live use.
