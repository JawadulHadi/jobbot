# Phase C — New Implementations (Incremental)

**Status:** Initiated (scoping/readiness; implementation pending approvals)  
**Deployment:** Not approved / do not deploy  
**Started:** 2026-11-11  
**Last updated:** 2026-11-12  
**Objective:** Deliver higher-value capabilities on top of a stable, branded foundation.

## Scope / progress

- [ ] Proper app authentication & authorization (required before public/live use) with role-aware access to chat/reviews.
- [ ] Session management: history/sidebar, rename, search, and shareable deep links (with access controls).
- [ ] Conversation quality: message actions (copy/regenerate where supported), richer rendering, attachments if agent supports.
- [ ] Review operations: prioritization/filters, audit metadata, notifications/integrations as needed.
- [ ] Observability & ops: health/readiness details (non-secret), metrics, alerting, rate limiting/abuse protection.
- [ ] Brand assets package: logo variants, color/type tokens, usage guidelines.

## Parallel workstreams (scoping)

| Workstream         | Actions                                              | Status  | Notes                                                                         |
| ------------------ | ---------------------------------------------------- | ------- | ----------------------------------------------------------------------------- |
| Authz              | Select and design access control for UI/API routes   | Scoping | Prerequisite for public exposure; current optional Basic Auth is interim only |
| Sessions           | Define persistence model and session UX enhancements | Scoping | Depends on storage and access-control decisions                               |
| Conversation       | Capability-aligned UX/features                       | Scoping | Must reflect actual agent capabilities                                        |
| Reviews ops        | Workflow, prioritization, audit/notifications        | Scoping | Build on existing queue/resume flows                                          |
| Ops & brand system | Monitoring, protection, formal brand assets          | Scoping | Production-readiness and consistency                                          |

## Change log

| Date       | Item                                     | Files                                                                                                     | Summary                                                                                                                                                                                                            | Validation          | Notes                                                                |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------------------- |
| 2026-11-11 | C0. Phase initiation (scoping/readiness) | `docs/phases/PHASE_C.md`, `docs/BRAND_AND_ROADMAP.md`                                                     | Marked Phase C as initiated for scoping/readiness while deferring implementation pending priorities, architecture choices, and approvals. No runtime behavior changes.                                             | N/A (documentation) | Prevents premature high-impact changes without approved requirements |
| 2026-11-12 | C0.1 Scoping context refresh             | `docs/phases/PHASE_C.md`, `docs/BRAND_AND_ROADMAP.md`, `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md` | Reconfirmed Phase C scope/dependencies alongside Phase A/B progress (branding, theme toggle, a11y baseline, request IDs, polling/UX refinements, recovery, Atlas Agent rename, production prep). Implementation remains blocked on approvals/decisions. | N/A (documentation) | Ensures all phases remain fully documented and aligned               |
| 2026-11-13 | C0.2 Production-readiness/env sync prep  | `Dockerfile`, `.dockerignore`, `next.config.ts`, `docs/ENV_AND_SECRETS.md`, `scripts/sync-github-env.ps1`, `.github/workflows/sync-env.yml`, `.github/workflows/release.yml`, deployment/docs | Added container/standalone deployment artifacts, baseline security headers, env/secrets sync tooling and release-helper workflow, and clarified Vercel-vs-Docker deploy path. No Phase C authz/persistence/ops implementation and no deployment performed. | lint/build pass (increment) | Secrets must be set by authorized user; merge/tag/release/deploy require explicit approval/permissions |

## Decisions & assumptions

- No Phase C implementation work that affects security, persistence, or integrations without explicit scoping and approval.
- Public/live readiness requires proper authentication and authorization beyond optional Basic Auth.
- Brand and UX changes should remain consistent with established Jobbot identity/tokens.

## Open items / blockers

- Approved auth strategy/provider and role model.
- Data/storage decisions for sessions/reviews metadata and retention.
- Target integrations/notifications and observability stack choices.
- Deployment target/approval and production security requirements.
- Confirm any external/backend Agent Engine naming/labels match standardized Atlas Agent naming.
