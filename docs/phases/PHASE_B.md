# Phase B — Strengthen Existing Implementations

**Status:** In progress (started)  
**Deployment:** Not approved / do not deploy  
**Objective:** Improve reliability, clarity, and maintainability of existing chat, history, and review flows.

## Scope / progress

- [~] Harden API error mapping and user-facing messages (config/auth/network/upstream) with consistent UX.
- [~] Improve session/history UX (restore states, polling/backoff, edge-case handling) — **started** (visibility-aware polling).
- [ ] Reviews UX refinements (filtering/sorting cues, timestamps/context readability, submission feedback).
- [ ] Expand automated tests for streaming, history, and review flows; keep lint/build green in CI.
- [~] Optional: simple request logging/trace IDs for easier debugging (no sensitive data) — **started** (`X-Request-Id` headers).

## Parallel workstreams

| Workstream         | Actions                                                     | Status      | Notes                                                   |
| ------------------ | ----------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| API resilience     | Normalize error responses/messages; improve client handling | In progress | Preserve existing contracts/status codes where tested   |
| Session/history    | Better restore/poll behavior and UX states                  | In progress | Visibility-aware polling added; further restore/backoff/edge-case refinements pending |
| Reviews flow       | UX and feedback improvements for resume actions             | Planned     | Keep decision/interrupt support intact                  |
| Quality            | Tests, CI checks, regression coverage                       | Ongoing     | Lint/test/build re-validated after changes              |
| Observability-lite | Non-sensitive diagnostics/log context                       | Started     | Added `X-Request-Id` response headers via shared helper |

## Change log

| Date       | Item                                                | Files                                                                                                                                                                                 | Summary                                                                                                                                                                                                      | Validation                                                                           | Notes                                                                                       |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 2026-11-11 | B1. Request ID headers (observability-lite kickoff) | `lib/request-id.ts`, `app/api/health/route.ts`, `app/api/chat/route.ts`, `app/api/chat/history/route.ts`, `app/api/reviews/route.ts`, `app/api/reviews/[executionId]/resume/route.ts` | Added `createRequestId`/`withRequestId` helper and attached non-sensitive `X-Request-Id` headers to API responses (including error/stream responses) to aid debugging/traceability without exposing secrets. | `pnpm lint`, `pnpm test` (64/64), `pnpm build` all passed after implementation/fixes | Kept existing response payloads/status semantics intact; tests do not assert on request IDs |
| 2026-11-11 | B2. Visibility-aware session polling                | `components/chat/chat.tsx`                                                                                                                                                            | Improved suspended/resuming session polling to skip interval ticks while the document is hidden and trigger an immediate background refresh on visibility regain, reducing unnecessary requests while preserving recovery behavior. | `pnpm lint`, `pnpm test` (64/64), `pnpm build` passed after change                  | Existing polling semantics/tests preserved; further backoff/restore-state refinements can follow |

## Validation log

| Date       | Check | Command                     | Result       | Notes                                                                 |
| ---------- | ----- | --------------------------- | ------------ | --------------------------------------------------------------------- |
| 2026-11-11 | Lint  | `npx -y pnpm@10.24.0 lint`  | Pass         | Post-B1 changes                                                       |
| 2026-11-11 | Tests | `npx -y pnpm@10.24.0 test`  | Pass (64/64) | All existing suites passed                                            |
| 2026-11-11 | Build | `npx -y pnpm@10.24.0 build` | Pass         | Production build succeeded (middleware deprecation warning unchanged) |
| 2026-11-11 | Lint/Test/Build (post B2) | `npx -y pnpm@10.24.0 lint`, `test`, `build` | Pass | Visibility-aware polling change validated; tests 64/64, lint/build clean |

## Decisions & assumptions

- Request IDs are generated per request/response and returned via headers only (no sensitive data logged or embedded in payloads).
- No API contract-breaking changes introduced in this kickoff; further error normalization will be done carefully with test updates as needed.

## Open items / blockers

- Prioritize next B-phase increments (error UX mapping, session/history polling refinements, reviews UX, additional tests/CI wiring).
- Any behavior-changing error/status normalization requires review against existing tests and client expectations.
