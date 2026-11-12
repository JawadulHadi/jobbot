# Repository Metadata, Tags, Topics, Labels & Milestones

This document defines the canonical GitHub repository metadata for **Jobbot** (`JawadulHadi/jobbot`). Apply updates via GitHub UI/API/CLI only with explicit approval and appropriate permissions.

## 1) Repository description (About)

**Short description (recommended, <= ~350 chars):**
> Jobbot — a branded Next.js chat and human-review UI for Atlas Agent Engine. Streaming chat with session continuity, suspend/resume review queue, theming, accessibility baseline, and operational hardening.

**Website/Homepage:** set to deployed URL when/if approved and live (leave unset otherwise).

## 2) Topics (GitHub topics/tags)

Recommended topics (add/update as relevant):
- `nextjs`
- `react`
- `typescript`
- `chatbot`
- `ai-assistant`
- `atlas-agent-engine`
- `mongodb`
- `human-in-the-loop`
- `streaming`
- `tailwindcss`
- `vercel-ai-sdk`
- `jobbot`

> Keep topics accurate to implemented capabilities; avoid claiming features not present (e.g. production authz, analytics) until delivered.

## 3) Milestones (phases as milestones)

Create/maintain these milestones and assign all PRs/issues accordingly:

| Milestone | Description | Target scope | Exit criteria (examples) |
|---|---|---|---|
| **Phase A — Brand & UI Polish** | Cohesive branded UI without core behavior changes | Tokens/theme, icon/metadata, copy, a11y baseline, visual QA | Brand/theming complete, a11y/visual QA checklist satisfied, docs/validation recorded |
| **Phase B — Strengthen Existing Implementations** | Reliability, UX hardening, maintainability | Error mapping, polling/backoff, reviews UX, tests/CI, request tracing | Hardened flows, expanded coverage/CI, documented validation |
| **Phase C — New Implementations** | Approved higher-value capabilities | Authz, session mgmt, conversation/review ops, observability/ops, brand package | Scoped features delivered with security/ops requirements met |
| **Release & Governance** | Release discipline and repo hygiene | Changelog/release notes/tags, process docs, README/wiki, metadata/labels | Every build/phase follows release process; tags/milestones/docs current |
| **Hotfix / Patch** (on demand) | Urgent corrective releases | Targeted fixes + regression validation | Patch released/tagged with notes and verification |

## 4) Labels

| Label | Purpose |
|---|---|
| `phase:a`, `phase:b`, `phase:c` | Phase/milestone alignment |
| `type:feature` | New user-facing capability |
| `type:fix` | Bug fix |
| `type:docs` | Documentation/governance |
| `type:chore` | Maintenance/tooling |
| `type:refactor` | Internal restructuring |
| `type:test` | Test additions/improvements |
| `area:chat` | Chat UI/streaming/session UX |
| `area:reviews` | Human review queue/resume flows |
| `area:api` | Route handlers/proxy/auth/health |
| `area:a11y` | Accessibility |
| `area:branding` | Visual identity/theming/assets |
| `area:ops` | CI, observability, deployment readiness |
| `release` | Release/tag/build tracking |
| `needs-approval` | Requires explicit approval before merge/deploy/push/tag |
| `blocked` | Blocked by dependency/decision |
| `security` | Security-sensitive change |

## 5) Release & tag metadata

- **Tags:** annotated `vX.Y.Z` on merged, validated `main` commits only (with approval).
- **GitHub Releases:** title `vX.Y.Z`, body from `docs/releases/vX.Y.Z.md` or `RELEASE_NOTES.md`, attach validation summary and milestone/PR links.
- **Pre-releases:** `vX.Y.Z-rc.N` / `vX.Y.Z-beta.N` if needed (approval required).

## 6) Wiki

- **Home:** project overview, status, quick links (README, roadmap, phases, releases, contributing).
- **Pages (recommended):** Getting Started, Configuration & Environments, Architecture, Human Reviews, Release Process, Phase Logs (or links), Troubleshooting/FAQ.
- Source drafts live in `docs/wiki/`; publish to GitHub wiki repo (`jobbot.wiki.git`) when access/approval available.

## 7) README and repo hygiene

- README must stay accurate for setup, scripts, env vars, deploy guidance, security notes, and docs links.
- Keep `.env.example` non-secret and current; never commit real credentials.
- Social preview image (optional, approved): branded Jobbot image reflecting amber/brown theme.

## 8) Governance checklist (per build/phase/release)

- [ ] Milestone assigned and status updated
- [ ] Labels applied
- [ ] CHANGELOG/RELEASE_NOTES/tags updated
- [ ] README/wiki/metadata reviewed
- [ ] Validation recorded
- [ ] Approvals obtained for remote/deploy actions
