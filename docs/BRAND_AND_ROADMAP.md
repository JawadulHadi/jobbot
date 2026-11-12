# Jobbot — Brand & Enhancement Roadmap

> **Status:** In progress (Phase A/B active, Phase C initiated/scoping). **No deployment until explicitly approved.**  
> **Brand name:** kept as **Jobbot** (no rename).

## 1) Brand foundation

### Positioning
- **Product:** Jobbot — an AI assistant experience for job/workflow conversations with human-in-the-loop review.
- **Promise:** Clear, trustworthy help with transparent handoff when human review is needed.
- **Audience:** Teams/operators using Atlas Agent Engine workflows; end users who need fast answers with accountability.

### Voice & messaging
- **Tone:** Professional, calm, helpful, direct. Avoid hype; explain states clearly (e.g. “Waiting for review”, “Connection/config needed”).
- **Core messages:** “Assist with confidence.” “Human review when it matters.” “Session continuity you can trust.”
- **UX copy principles:** Action-oriented labels, plain-language errors, visible next steps (especially for suspended/review states).

### Visual identity (current baseline)
- **Name/mark:** “Jobbot” wordmark + bot/spark mark used consistently in headers, `app/icon.svg`, and key empty states.
- **Color:** Neutral surfaces with a **warm amber/brown brand accent** for focus/primary actions and status highlights; tuned for contrast in light/dark modes.
- **Theming:** Manual **dark/light theme toggle** with persisted preference and system fallback.
- **Typography:** Geist sans/mono with clear hierarchy.
- **Trust cues:** Clear session identifiers, review state visibility, setup/config guidance, and request tracing headers (`X-Request-Id`).

## 2) Current state (existing implementation)

**Working today**
- Streaming chat UI with session/user controls, persistence/restore, suspension signaling, visibility-aware polling/backoff, and setup/config notice (`/api/health`).
- Server proxies: `/api/chat`, `/api/chat/history`, `/api/reviews`, `/api/reviews/[executionId]/resume`, plus `/api/health`.
- Human review queue UI with polling (visibility-aware/backoff), prioritization/sorting cues, decision/interrupt resume flows, audit/status context, and lightweight browser-local recent outcome persistence.
- Agent Engine target/auth/helpers, session/review safety/normalization, request IDs, optional Basic Auth (`proxy.ts`), and expanded automated tests.
- Branding/UI baseline, accessibility improvements (focus, labels, landmarks, contrast tuning), CI workflow, and production-prep artifacts (Docker/standalone, security headers baseline, env/secrets sync tooling, release helper workflow, deploy docs).

**Gaps / opportunities**
- Full WCAG contrast audit (all states), complete keyboard-only and responsive/manual visual QA still pending.
- Live-backend end-to-end QA pending (requires configured environment/credentials).
- No backend-persisted review audit history, full end-user auth/authorization, session management features, or advanced ops/observability (Phase C).
- External/backend Atlas Agent Engine workspace/console naming should be confirmed if exact consistency is required outside this repo.

## 3) Realistic enhancement roadmap

### Phase A — Brand & UI polish (in progress)
*Goal: make the existing experience feel coherent, clear, and branded without changing core behavior.*
- [x] Unified Jobbot header/brand mark and consistent navigation (chat/reviews).
- [x] Polished empty states, message presentation, composer/header styling, and subtle visual system.
- [x] Branded favicon/app icon and metadata baseline; amber/brown palette and theme toggle.
- [x] In-product configuration/help hints (non-sensitive) and refined status/error copy.
- [~] Accessibility pass — focus/labels/landmarks/contrast improvements done; full manual keyboard/screen-reader and responsive visual QA pending.
- [~] Visual QA in light/dark and responsive layouts — runtime/build checks and static audits done; full manual pass pending.

### Phase B — Strengthen existing implementations (in progress)
*Goal: reliability, clarity, and maintainability of what already exists.*
- [~] Harden API error mapping and user-facing messages with consistent UX and retries where appropriate.
- [~] Improve session/history UX (restore states, visibility-aware polling/backoff, edge cases).
- [~] Reviews UX refinements (search/sort/prioritization, audit cues, submission feedback, local outcome persistence).
- [~] Production/compatibility hardening — `proxy.ts`, CI hardening, expanded tests, Docker/standalone, env/secrets/release tooling, deploy guidance.
- [~] Expand automated tests and keep lint/build green; continue integration-like edge-case coverage.
- [~] Request IDs for traceability (non-sensitive).

### Phase C — New implementations (initiated: scoping/readiness; implementation pending approvals)
*Goal: higher-value capabilities, added realistically.*
- [ ] Proper app authentication & authorization with role-aware access to chat/reviews (required before public/live use).
- [ ] Session management: history/sidebar, rename, search, shareable deep links (with access controls).
- [ ] Conversation quality: message actions, richer rendering, attachments if supported.
- [ ] Review operations: backend-persisted audit history, prioritization/filters, notifications/integrations.
- [ ] Observability & ops: health/readiness details (non-secret), metrics, alerting, rate limiting/abuse protection.
- [ ] Brand assets package: logo variants, color/type tokens, usage guidelines.

## 4) Working principles
- **Approval gates:** no deploy/tag/release/merge without explicit approval.
- **Incremental & reversible:** small, testable improvements; preserve existing behavior/contracts where possible.
- **Security-first:** keep secrets server-side, never commit credentials; treat authz as prerequisite for public exposure.
- **Honest UX:** clearly communicate configuration, connectivity, and review states.
- **Document everything:** record phase actions, validation, decisions, and blockers.

## 5) Best deployment path (current recommendation)
- **Recommended:** **Vercel** for managed Next.js hosting (builds, env/secret management, HTTPS, previews, rollbacks). Configure required env vars/secrets and deploy only with approval.
- **Alternative:** Docker/self-host via included `Dockerfile`/`.dockerignore` (standalone output) on Render/Railway/Fly.io/Kubernetes/VM with platform-managed HTTPS, secrets, monitoring, and rollback.
- **Before public production:** implement proper end-user authz (Phase C), configure secrets/monitoring, complete QA, and follow `docs/PRODUCTION_DEPLOYMENT.md` and `docs/ENV_AND_SECRETS.md`.

## 6) Progress snapshot (2026-11-13)
- **Phase A:** ~85% (UI/brand/a11y baseline and static QA fixes done; manual keyboard/screen-reader and responsive visual QA pending).
- **Phase B:** ~75% (reliability hardening, reviews UX, expanded tests/CI, and follow-up coverage increments; open PRs/checks may remain).
- **Phase C:** ~15% (scoping/readiness plus production-prep artifacts: Docker/standalone, env/secrets sync tooling/workflows, release helper, deploy guidance; feature implementation blocked on approved decisions).
- **Overall:** ~70% toward a production-ready v1 baseline (code/docs/tooling), excluding approved merge/tag/release/deploy actions and Phase C authz/persistence/ops implementation.

**Detailed logs:** `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md`.
