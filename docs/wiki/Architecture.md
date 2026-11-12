# Architecture (High-level)

## Stack
- **Framework:** Next.js (App Router), React, TypeScript
- **UI:** Tailwind-based components, dark/light theme toggle, branded Jobbot styling
- **AI/streaming:** Vercel AI SDK UI transport/streams
- **Backend integration:** Atlas Agent Engine invoke/stream, session history, reviews/resume APIs via server-side proxies

## Key areas

| Area | Location | Responsibility |
|---|---|---|
| Chat UI | `components/chat/*`, `app/page.tsx` | Messaging, session/user controls, restore/suspension states, setup guidance |
| Reviews UI | `components/reviews/*`, `app/reviews/page.tsx` | Pending suspended executions, decision/interrupt resume |
| API proxies | `app/api/chat/*`, `app/api/reviews/*`, `app/api/health/route.ts` | Forward to Agent Engine, normalize responses, attach request IDs |
| Agent Engine integration | `lib/agent-engine-api.ts`, `lib/agent-engine-auth.ts` | Target resolution, auth, URL building, normalization/safety |
| Shared helpers | `lib/session.ts`, `lib/reviews.ts`, `lib/request-id.ts`, `lib/utils.ts` | Session/review parsing, request IDs, utilities |
| Middleware | `middleware.ts` | Optional HTTP Basic Auth when configured |
| Theming/brand | `app/globals.css`, `app/layout.tsx`, `components/theme-toggle.tsx`, `app/icon.svg` | Tokens, theme behavior, metadata/icon |

## Request flow (simplified)
1. User sends message from chat UI → `POST /api/chat`.
2. Server forwards to Agent Engine stream endpoint, preserves/returns session context, streams UI message chunks.
3. Suspensions surface in chat and/or reviews queue (`GET /api/reviews`).
4. Reviewer submits decision or interrupt `resume_map` → resume endpoints proxy continuation.

## Non-functional practices
- Non-sensitive `X-Request-Id` tracing on API responses.
- Visibility-aware polling to reduce unnecessary requests while preserving recovery.
- No secrets in client; optional Basic Auth only as interim protection.
- All phases/builds documented and validated per release process.
