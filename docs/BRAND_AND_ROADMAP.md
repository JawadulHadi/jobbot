# Jobbot — Brand & Enhancement Roadmap

> **Status:** In progress (UI polishing started). **No deployment until explicitly approved.**

## 1 Brand foundation (build first)

### Positioning

- **Product:** Jobbot — an AI assistant experience for job/workflow conversations with human-in-the-loop review.
- **Promise:** Clear, trustworthy help with transparent handoff when human review is needed.
- **Audience:** Teams/operators using Atlas Agent Engine workflows; end users who need fast answers with accountability.

### Voice & messaging

- **Tone:** Professional, calm, helpful, direct. Avoid hype; explain states clearly (e.g. “Waiting for review”, “Connection/config needed”).
- **Core messages:** “Assist with confidence.” “Human review when it matters.” “Session continuity you can trust.”
- **UX copy principles:** Action-oriented labels, plain-language errors, visible next steps (especially for suspended/review states).

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

## 3) Realistic enhancement roadmap

### Phase A — Brand & UI polish (in progress, pre-approval)

*Goal: make the existing experience feel coherent, clear, and branded without changing core behavior.*

- [x] Unified Jobbot header/brand mark and consistent navigation (chat/reviews).
- [x] Polished empty states, message presentation, composer/header styling, and subtle visual system (accent, surfaces).
- [x] Branded favicon/app icons and social/metadata assets (baseline: `app/icon.svg`, metadata; palette updated to amber/brown).
- [x] In-product configuration/help hints (non-sensitive) and refined status/error copy (baseline).
- [x] Manual dark/light theme toggle with persisted preference (in addition to system-aware theming).
- [~] Accessibility pass (focus states, contrast checks, labels, keyboard flow) — focus/labels/toggle improved; contrast & full keyboard/QA pending.
- [~] Visual QA in light/dark modes and responsive layouts (runtime checks done; full manual pass pending).

### Phase B — Strengthen existing implementations (in progress)

*Goal: reliability, clarity, and maintainability of what already exists.*

- [~] Harden API error mapping and user-facing messages (config/auth/network/upstream) with consistent UX.
- [ ] Improve session/history UX (clear restore states, better polling/backoff, edge-case handling).
- [ ] Reviews UX refinements (filtering/sorting cues, timestamps/context readability, submission feedback).
- [ ] Expand automated tests for streaming, history, and review flows; keep lint/build green in CI.
- [~] Optional: simple request logging/trace IDs for easier debugging (no sensitive data) — `X-Request-Id` added to API responses.

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

## 5) Immediate next actions (parallel) — progress

1. **UI polishing across chat and reviews:** in progress/completed in baseline passes (headers, empty states, avatars, controls, reviews layout, theme toggle); accessibility and visual QA remain.  
2. **Brand assets & tokenized accent:** baseline completed and refined (`app/icon.svg`, metadata, amber/brown `--brand` tokens, contrast tuning); additional assets (apple-touch/OG) optional.  
3. **Copy and in-app guidance for unconfigured/back-end states:** baseline completed (health-driven setup notice, refined microcopy).  
4. **Validation:** `pnpm lint`, `pnpm build`, and `pnpm test` (64/64) passing after latest changes (contrast/landmarks, theme toggle, request IDs, visibility-aware polling); continue validating as changes land.  
5. **Approval gate:** no deployment/promotion; local changes not pushed.

**Detailed execution logs:** `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md` (all phases documented).
