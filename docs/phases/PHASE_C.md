# Phase C — New Implementations (Incremental)

**Status:** Initiated (scoping/readiness; implementation pending approvals)  
**Deployment:** Not approved / do not deploy  
**Objective:** Deliver higher-value capabilities on top of a stable, branded foundation.

## Scope / progress
- [ ] Proper app authentication & authorization (required before public/live use) with role-aware access to chat/reviews.
- [ ] Session management: history/sidebar, rename, search, and shareable deep links (with access controls).
- [ ] Conversation quality: message actions (copy/regenerate where supported), richer rendering, attachments if agent supports.
- [ ] Review operations: prioritization/filters, audit metadata, notifications/integrations as needed.
- [ ] Observability & ops: health/readiness details (non-secret), metrics, alerting, rate limiting/abuse protection.
- [ ] Brand assets package: logo variants, color/type tokens, usage guidelines.

## Parallel workstreams
| Workstream | Actions | Status | Notes |
|---|---|---|---|
| Authz | Design/implement access control for UI and APIs | Scoping | Prerequisite for public exposure; requires approved approach |
| Sessions | Persistent/session UX enhancements | Scoping | Depends on storage/auth decisions |
| Conversation | UX/features aligned with agent capabilities | Scoping | Capability-driven; avoid unsupported claims |
| Reviews ops | Workflow and visibility improvements | Scoping | Build on existing queue |
| Ops/brand system | Monitoring, protection, formal brand assets | Scoping | Production-readiness focus |

## Change log
| Date | Item | Files | Summary | Validation | Notes |
|---|---|---|---|---|---|
| 2026-11-11 | C0. Phase initiation (documentation/scoping) | `docs/phases/PHASE_C.md`, `docs/BRAND_AND_ROADMAP.md` | Marked Phase C as initiated for scoping/readiness while deferring implementation until priorities, architecture choices (auth/storage/integrations), and approvals are confirmed. No runtime behavior changes. | N/A (documentation) | Prevents premature implementation of high-impact features without approved requirements |

## Validation log
| Date | Check | Command | Result | Notes |
|---|---|---|---|---|
| 2026-11-11 | Documentation consistency | Manual review | Pass | Phase C status aligned with "start pending phases" (scoped initiation) and approval constraints |

## Decisions & assumptions
- Phase C work that impacts security, data persistence, or external integrations will only be implemented with explicit scoping and approval.
- Interim live protection remains limited to optional Basic Auth already available; full authz is a Phase C priority.

## Open items / blockers
- Approved auth strategy/provider, data model/storage for sessions/reviews metadata, target integrations, and rollout plan.
