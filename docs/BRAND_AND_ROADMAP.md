# Jobbot — Brand & Enhancement Roadmap

<<<<<<< Updated upstream
> **Status:** In progress (UI polishing started). **No deployment until explicitly approved.**

## 1 Brand foundation (build first)
=======
> **Status:** In progress (Phase A/B active, Phase C initiated). **No deployment until explicitly approved.**  
> **Brand name:** kept as **Jobbot** (no rename).

## 1) Brand foundation (build first)
>>>>>>> Stashed changes

### Positioning

- **Product:** Jobbot — an AI assistant experience for job/workflow conversations with human-in-the-loop review.
- **Promise:** Clear, trustworthy help with transparent handoff when human review is needed.
- **Audience:** Teams/operators using Atlas Agent Engine workflows; end users who need fast answers with accountability.

### Voice & messaging

- **Tone:** Professional, calm, helpful, direct. Avoid hype; explain states clearly (e.g. “Waiting for review”, “Connection/config needed”).
- **Core messages:** “Assist with confidence.” “Human review when it matters.” “Session continuity you can trust.”
- **UX copy principles:** Action-oriented labels, plain-language errors, visible next steps (especially for suspended/review states).

<<<<<<< Updated upstream
### Visual identity (realistic baseline)

- **Name/mark:** “Jobbot” wordmark + simple bot/spark mark used consistently in headers, favicon/app icons (next step), and empty states.
- **Color:** Neutral surfaces with a single **warm amber/brown brand accent** (replacing earlier green) for focus/primary actions and status highlights; maintain strong contrast in light/dark modes. User-selectable light/dark theme toggle supported.
- **Typography:** Geist sans/mono (existing) with clear hierarchy (H1/product, section labels, body, metadata).
- **Components:** Consistent cards, badges, spacing, and motion (subtle, purposeful).
- **Trust cues:** Clear session identifiers, review state visibility, and honest configuration/health feedback.

## 2) Current state (existing implementation)

**Working today**

- Streaming chat UI with session/user controls, persistence/restore, and suspension signaling.
- Server proxies: `/api/chat`, `/api/chat/history`, `/api/reviews`, `/api/reviews/[executionId]/resume`.
- Human review queue UI with polling and decision/interrupt resume flows.
- Agent Engine target/auth helpers, session safety/normalization, basic tests.
- Recent baseline: `/api/health`, optional HTTP Basic Auth middleware, deploy/docs scaffolding, clean repo on `main`.

**Gaps / opportunities**

- Brand is minimal (starter naming replaced, but no distinct identity system/assets).
- Empty/loading/error states are functional but not “product-grade”.
- Limited onboarding/config guidance in-product when backend is not configured.
- No persistent session list, rich message actions, analytics, or full end-user auth/authorization.
- Accessibility, performance tuning, and broader test coverage can be deepened.
=======
### Visual identity (current baseline)

- **Name/mark:** “Jobbot” wordmark + bot/spark mark used consistently in headers, `app/icon.svg`, and key empty states.
- **Color:** Neutral surfaces with a **warm amber/brown brand accent** (replaced earlier green) for focus/primary actions and status highlights; tuned for better contrast in light/dark modes.
- **Theming:** Manual **dark/light theme toggle** with persisted preference and system fallback (in addition to CSS-variable dark mode support).
- **Typography:** Geist sans/mono with clear hierarchy (H1/product, section labels, body, metadata).
- **Components:** Consistent cards, badges, spacing, and subtle motion.
- **Trust cues:** Clear session identifiers, review state visibility, setup/config guidance, and request tracing headers (`X-Request-Id`).

## 2) Current state (existing implementation)

_*Working today*

- Streaming chat UI with session/user controls, persistence/restore, suspension signaling, visibility-aware polling, and setup/config notice (`/api/health`).
- Server proxies: `/api/chat`, `/api/chat/history`, `/api/reviews`, `/api/reviews/[executionId]/resume`, plus `/api/health`.
- Human review queue UI with polling (visibility-aware), decision/interrupt resume flows, improved status/timestamp copy.
- Agent Engine target/auth helpers, session/review safety/normalization, request IDs on API responses, optional Basic Auth middleware, tests.
- Branding/UI polish baseline: amber/brown tokens, theme toggle, branded headers/empty states, accessibility improvements (focus, labels, skip link/landmarks).
- Local dev/build/test workflows functional; `.next` cache corruption recovered when encountered.

_*Gaps / opportunities*

- “atlas-agent agent” rename requested but **not found in repo source** (may be backend/Agent Engine naming); needs clarification to apply consistently.
- Full WCAG contrast audit (all states), complete keyboard-only and responsive/manual visual QA still pending.
- Session/history and reviews UX can be further hardened (deeper error mapping, backoff/restore refinements, filtering/sorting/feedback).
- No persistent session list, rich message actions, analytics, or full end-user auth/authorization.
- Broader automated test coverage and CI hardening remain.
>>>>>>> Stashed changes

## 3) Realistic enhancement roadmap

### Phase A — Brand & UI polish (in progress, pre-approval)

*Goal: make the existing experience feel coherent, clear, and branded without changing core behavior.*

- [x] Unified Jobbot header/brand mark and consistent navigation (chat/reviews).
- [x] Polished empty states, message presentation, composer/header styling, and subtle visual system (accent, surfaces).
<<<<<<< Updated upstream
- [x] Branded favicon/app icons and social/metadata assets (baseline: `app/icon.svg`, metadata; palette updated to amber/brown).
- [x] In-product configuration/help hints (non-sensitive) and refined status/error copy (baseline).
- [x] Manual dark/light theme toggle with persisted preference (in addition to system-aware theming).
- [~] Accessibility pass (focus states, contrast checks, labels, keyboard flow) — focus/labels/toggle improved; contrast & full keyboard/QA pending.
- [~] Visual QA in light/dark modes and responsive layouts (runtime checks done; full manual pass pending).
=======
- [x] Branded favicon/app icons and metadata baseline (`app/icon.svg`, layout metadata; amber/brown palette).
- [x] In-product configuration/help hints (non-sensitive) and refined status/error copy (baseline).
- [x] Manual dark/light theme toggle with persisted preference and system fallback.
- [~] Accessibility pass (focus states, contrast checks, labels, keyboard flow) — focus/labels/skip link/landmarks improved; full contrast/keyboard audit pending.
- [~] Visual QA in light/dark modes and responsive layouts — runtime checks done; full manual pass pending.

### Phase B — Strengthen existing implementations (in progress)

*Goal: reliability, clarity, and maintainability of what already exists.*

- [~] Harden API error mapping and user-facing messages (config/auth/network/upstream) with consistent UX — helper/UX improvements started (`lib/api-errors.ts`, clearer reviews feedback); broader normalization pending.
- [~] Improve session/history UX (restore states, polling/backoff, edge-case handling) — visibility-aware polling added (chat/reviews); retry/backoff refinements pending.
- [~] Reviews UX refinements (filtering/sorting cues, timestamps/context readability, submission feedback) — progressed (search/filter, sorting, shown-vs-total status, improved submission/success/filter-empty states).
- [~] Production/compatibility hardening — migrated `middleware` to Next.js 16 `proxy`, added CI workflow and production deployment prep docs (no deploy without approval).
- [ ] Expand automated tests for streaming, history, and review flows; keep lint/build green in CI.
- [~] Optional: simple request logging/trace IDs for easier debugging (no sensitive data) — `X-Request-Id` on API responses.

### Phase C — New implementations (initiated: scoping/readiness; implementation pending approvals)

*Goal: higher-value capabilities, added realistically.*

- [ ] **Proper app authentication & authorization** (required before public/live use) with role-aware access to chat/reviews.
- [ ] **Session management:** history/sidebar, rename, search, and shareable deep links (with access controls).
- [ ] **Conversation quality:** message actions (copy/regenerate where supported), richer rendering, attachments if agent supports.
- [ ] **Review operations:** prioritization/filters, audit metadata, notifications/integrations as needed.
- [ ] **Observability & ops:** health/readiness details (non-secret), metrics, alerting, rate limiting/abuse protection.
- [ ] **Brand assets package:** logo variants, color/type tokens, usage guidelines.

## 4) Working principles

- **No deploy until approved:** prepare configs/docs and validate locally; do not promote to production environments without sign-off.
- **Incremental & reversible:** ship small, testable UI/logic improvements; avoid breaking existing flows.
- **Security-first:** keep secrets server-side, never commit credentials, and treat auth/authorization as a prerequisite for public exposure.
- **Honest UX:** clearly communicate configuration and review states; never imply connectivity or capabilities that aren’t available.
<<<<<<< Updated upstream

## 5) Immediate next actions (parallel) — progress

1. **UI polishing across chat and reviews:** in progress/completed in baseline passes (headers, empty states, avatars, controls, reviews layout, theme toggle); accessibility and visual QA remain.  
2. **Brand assets & tokenized accent:** baseline completed and refined (`app/icon.svg`, metadata, amber/brown `--brand` tokens, contrast tuning); additional assets (apple-touch/OG) optional.  
3. **Copy and in-app guidance for unconfigured/back-end states:** baseline completed (health-driven setup notice, refined microcopy).  
4. **Validation:** `pnpm lint`, `pnpm build`, and `pnpm test` (64/64) passing after latest changes (contrast/landmarks, theme toggle, request IDs, visibility-aware polling); continue validating as changes land.  
5. **Approval gate:** no deployment/promotion; local changes not pushed.

**Detailed execution logs:** `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md` (all phases documented).
=======
- **Document everything:** every phase/action/change/validation is recorded in phase docs.

## 5) Immediate next actions (parallel) — progress

1. **UI polishing & a11y:** baseline completed and refined (headers, empty states, theme toggle, focus/labels/landmarks, contrast tuning); full contrast/keyboard/manual visual QA remains.  
2. **Brand assets & tokenized accent:** amber/brown tokens + `app/icon.svg` + metadata in place; optional assets (apple-touch/OG) pending.  
3. **Config guidance & copy:** health-driven setup notice and clearer status/review copy in place; continue refinement as needed.  
4. **Validation:** `pnpm lint`, `pnpm build`, and `pnpm test` (64/64) passing after latest recovery/refinements; continue validating changes.  
5. **Stability & Phase B:** dev/build recovery handled (`.next` cleanup when needed), request IDs and visibility-aware polling applied; continue hardening.  
6. **Approval gate:** no deployment/promotion/push; local changes uncommitted on `main`.

**Detailed execution logs (all phases):** `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md`.
>>>>>>> Stashed changes
