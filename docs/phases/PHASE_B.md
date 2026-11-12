# Phase B — Strengthen Existing Implementations

**Status:** In progress  
**Deployment:** Not approved / do not deploy  
**Started:** 2026-11-11  
**Last updated:** 2026-11-12  
**Objective:** Improve reliability, clarity, and maintainability of existing chat, history, and review flows.

## Scope / progress

- [~] Harden API error mapping and user-facing messages (config/auth/network/upstream) with consistent UX — progressed (`lib/api-errors.ts` helpers now used in chat/reviews client flows and JSON API route catch paths for normalized user-friendly network/timeout fallback messages; shared `fetchWithRetry` added for history/reviews/resume upstream calls. Further route error-shape/status standardization and chat streaming error contract refinements pending).
- [~] Improve session/history UX (restore states, polling/backoff, edge-case handling) — visibility-aware polling in chat and reviews; reviews and chat session background polling now use exponential backoff on consecutive failures (capped) with reset on success/visibility/manual actions. Deeper restore/history edge cases pending.
- [~] Reviews UX refinements (filtering/sorting cues, timestamps/context readability, submission feedback) — progressed (search/filter, wait-time prioritization/sort options, audit/status context, clearer submission/success/filter-empty states, and in-session recent outcome tracking; deeper ops/persistence cues pending).
- [~] Expand automated tests for streaming, history, and review flows; keep lint/build green in CI — progressed (PR #9 added proxy/health, api-errors/fetch-retry, and expanded route coverage; this increment adds reviews prioritization/audit/outcome coverage. Further streaming/history/proxy edge-case and CI hardening pending).
- [~] Optional: simple request logging/trace IDs for easier debugging (no sensitive data) — `X-Request-Id` headers added.

## Parallel workstreams

| Workstream         | Actions                                                     | Status      | Notes                                                               |
| ------------------ | ----------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| API resilience     | Normalize error responses/messages; improve client handling | In progress | Contract/status compatibility preserved where tested                |
| Session/history    | Restore/poll behavior and UX states                         | In progress | Visibility-aware polling added; further backoff/edge cases pending  |
| Reviews flow       | UX and feedback improvements for resume actions             | In progress | Copy/status/timestamps improved; filtering/sorting/feedback pending |
| Quality            | Tests, CI checks, regression coverage                       | Ongoing     | Lint/test/build revalidated after changes; CI workflow added        |
| Observability-lite | Non-sensitive diagnostics/log context                       | Started     | Request IDs on API responses (including stream/error paths)         |

## Detailed change log

### B1. Request ID headers (observability-lite kickoff) — 2026-11-11

- **Files:** `lib/request-id.ts`, `app/api/health/route.ts`, `app/api/chat/route.ts`, `app/api/chat/history/route.ts`, `app/api/reviews/route.ts`, `app/api/reviews/[executionId]/resume/route.ts`
- **Changes:** Added `createRequestId`/`withRequestId` and attached non-sensitive `X-Request-Id` to API responses (JSON, stream, and error paths) for traceability.
- **Validation:** lint/test/build passed (64/64 tests).
- **Notes:** No payload/contract changes; tests do not assert on request IDs.

### B2. Visibility-aware session polling (chat) — 2026-11-11

- **Files:** `components/chat/chat.tsx`
- **Changes:** Suspended/resuming session polling skips interval ticks while document is hidden and triggers immediate background refresh on visibility regain.
- **Validation:** lint/test/build passed (64/64 tests).
- **Notes:** Preserves recovery behavior; further backoff refinements possible.

### B3. Visibility-aware reviews polling + reviews/chat refinements & recovery — 2026-11-12

- **Files:** `components/reviews/reviews.tsx`, `components/chat/chat.tsx`, `lib/request-id.ts`, `app/api/chat/route.ts`, `app/api/chat/history/route.ts`, `app/api/reviews/route.ts`, `app/api/reviews/[executionId]/resume/route.ts`, `app/api/health/route.ts`, `components/chat/chat.test.tsx`
- **Changes:**
  - Added visibility-aware refresh behavior to reviews queue polling.
  - Improved reviews UX copy/status clarity (`aria-live`, helper text) and metadata display (includes Updated timestamp when present).
  - Improved chat setup notice accessibility/readability.
  - Restored reverted request-ID integrations and related UI/test alignments after workspace regression.
- **Validation:** lint/test/build passed (64/64 tests, 10 files).

### B4. Conflict cleanup, Atlas Agent rename alignment, and proxy migration — 2026-11-12

- **Files:** `middleware.ts` → `proxy.ts`, `docs/phases/PHASE_A.md`, `docs/phases/PHASE_B.md`, `docs/phases/PHASE_C.md`, `docs/BRAND_AND_ROADMAP.md`, `.github/workflows/ci.yml`, `docs/PRODUCTION_DEPLOYMENT.md`, related docs/config updates.
- **Changes:**
  - Removed remaining merge/stash conflict markers from phase docs and aligned naming to standardized Atlas Agent references.
  - Migrated deprecated `middleware` convention to Next.js 16 `proxy` file/function convention (same Basic Auth behavior/matcher) to resolve build deprecation warning.
  - Added CI workflow and production deployment preparation documentation (no deploy performed).
- **Validation:** `pnpm lint`, `pnpm test` (64/64), `pnpm build` passed.

### B5. Reviews UX refinement and resilience helper — 2026-11-12

- **Files:** `components/reviews/reviews.tsx`, `lib/api-errors.ts`, `docs/phases/PHASE_B.md`, `docs/BRAND_AND_ROADMAP.md`
- **Changes:**
  - Added reviews search/filter (reason, session, execution, context) and sorting controls (updated/created, newest/oldest).
  - Improved submission feedback and resolved-state messaging; clearer “shown vs total” status and empty-filter states.
  - Added `lib/api-errors.ts` with normalized user-friendly error/abort helpers for future client/API hardening reuse.
  - Preserved existing resume contracts, visibility-aware polling, and accessibility/status semantics.
- **Validation:** `pnpm lint`, `pnpm test` (64/64), `pnpm build` passed. Manual end-to-end review submission QA against a live backend remains pending.

### B6. Client error normalization and reviews polling backoff — 2026-11-12

- **Files:** `components/chat/chat.tsx`, `components/reviews/reviews.tsx`, `lib/api-errors.ts` (adopted), `docs/phases/PHASE_B.md`, `CHANGELOG.md`
- **Changes:**
  - Adopted `normalizeApiErrorMessage`/`isAbortError` in chat history/config flows and reviews load/submit flows for consistent, user-friendly error handling and safe abort behavior.
  - Added exponential backoff for reviews background polling on consecutive load failures (capped), with reset on successful load, visibility regain, and manual refresh.
  - Preserved existing contracts, UI states, and accessibility semantics.
- **Validation:** `pnpm lint` pass; `pnpm test` pass (81/81, 11 files); `pnpm build` pass. Manual end-to-end QA against a live backend remains pending.

### B7. Route-level error normalization/retry and chat session polling backoff — 2026-11-12

- **Files:** `lib/api-errors.ts`, `lib/fetch-with-retry.ts`, `app/api/chat/route.ts`, `app/api/chat/history/route.ts`, `app/api/reviews/route.ts`, `app/api/reviews/[executionId]/resume/route.ts`, `components/chat/chat.tsx`, `components/chat/chat.test.tsx`, `docs/phases/PHASE_B.md`, `CHANGELOG.md`
- **Changes:**
  - Refined `normalizeApiErrorMessage` to preserve specific/custom upstream messages while normalizing low-level network/timeout failures.
  - Added shared server-side `fetchWithRetry` helper and applied retry/backoff to chat history, reviews list, and review resume upstream fetches; chat route now uses shared retry helper.
  - Normalized catch-path error responses in JSON API routes using consistent `{ error }` payloads and safe fallbacks.
  - Refactored chat suspended/resuming session polling to recursive `setTimeout` with exponential backoff on consecutive background restore failures (capped), reset on success/visibility/session changes; updated chat test for timer strategy.
- **Validation:** `pnpm lint` pass; `pnpm test` pass (81/81, 11 files); `pnpm build` pass. Manual end-to-end QA against a live backend remains pending.

## Validation log

| Date       | Check                              | Command                                     | Result | Notes                                                                             |
| ---------- | ---------------------------------- | ------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| 2026-11-11 | Lint/Test/Build (B1, B2)           | `npx -y pnpm@10.24.0 lint`, `test`, `build` | Pass   | Request IDs and chat visibility-aware polling validated                           |
| 2026-11-12 | Lint/Test/Build (B3 + restoration) | `npx -y pnpm@10.24.0 lint`, `test`, `build` | Pass   | Reviews visibility-aware polling, UX refinements, API/UI restoration; 64/64 tests |
| 2026-11-12 | Lint/Test/Build (B4 proxy + B5 reviews UX) | `npx -y pnpm@10.24.0 lint`, `test`, `build` | Pass   | Proxy migration removed middleware deprecation warning; reviews search/sort/feedback added; 64/64 tests, build succeeded |

## Decisions & assumptions

- Keep existing API contracts/status semantics stable unless explicitly approved and covered by updated tests.
- Observability additions must remain non-sensitive (no secrets/tokens in IDs or payloads).
- Polling improvements should reduce unnecessary work without delaying recovery.

### B9. Reviews prioritization, audit cues, and outcome tracking — 2026-11-12

- **Files:** `components/reviews/reviews.tsx`, `components/reviews/reviews.test.tsx`, `docs/phases/PHASE_B.md`, `CHANGELOG.md`
- **Changes:**
  - Added wait-age prioritization cues and sorting: "Waiting (longest/newest first)" sort options (default longest first), per-card waiting-age badge, and wait-time-aware ordering.
  - Added audit/context metadata in review cards (status/interrupt-vs-decision context) and refined timestamp labeling for clearer review state.
  - Added in-session "Recent outcomes" tracking/log for resolved reviews (action, execution/session, reason, timestamp) to improve operator feedback after submissions.
  - Extended reviews tests to cover prioritization/sort default, audit cues, and outcome tracking while preserving existing decision/interrupt/resume behaviors.
- **Validation:** targeted reviews tests passed (8/8); lint/build and broader validation recorded in increment summary (PR pending).

## Open items / blockers

- **PR #9 (open):** https://github.com/JawadulHadi/jobbot/pull/9 includes B8 tests/CI hardening from `feat/phase-b-tests-ci-hardening` and is not merged; this branch/work may be based on `main` and can require rebase/reconciliation after #9 merges.
- Next increments: deeper reviews ops persistence/audit history, further streaming/history/reviews/proxy edge-case coverage, and continued CI/reliability tuning.
- Atlas Agent naming standardized in-repo (`atlas-agent/agents/atlas-agent/`); confirm external/backend labels match if applicable.
- No deployment/push/tag/release/merge without explicit approval.
