# Session Management & Review Audit — Design (Phase C)

Status: **Scoping / awaiting approval** — no implementation yet.
Storage decision: **Postgres (new)**. Scope: **list + rename + search + shareable deep links + review audit persistence**.

## Goals
- Persist chat session metadata (title, user, created/updated, last message preview) so users can list, rename, search, and reopen sessions via deep links.
- Persist review audit/outcome history (execution, session, action, reviewer, timestamp, reason) instead of browser-local `localStorage`.
- Keep existing Agent Engine session/message APIs as the source of truth for message content; this store holds app-level metadata/audit only.

## Non-goals (this increment)
- Full end-user authentication/authorization (separate Phase C auth item; this design assumes an interim identity strategy).
- Message content duplication or full-text search over message bodies (search is over titles/metadata unless later extended).
- Multi-tenant org modeling.

## Identity strategy (interim)
Until proper auth ships, identity is derived from the existing optional Basic Auth user (`APP_BASIC_AUTH_USER`) when enabled, otherwise a stable anonymous client id stored in a first-party cookie (`jobbot_uid`, httpOnly, SameSite=Lax). All rows are scoped by `owner_id`. When real auth lands, `owner_id` maps to the authenticated user id; migration is a column rename/backfill.

## Storage
- New Postgres instance (e.g. Neon/Vercel Postgres). Connection via `DATABASE_URL` (server-side only).
- Migrations managed with a lightweight tool. Recommendation: **Drizzle ORM + drizzle-kit** (TypeScript-native, no heavy runtime) — pending approval; alternative Prisma.
- No changes to Atlas Agent Engine MongoDB usage.

## Schema (draft)

### `sessions`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | app session id (not Agent Engine session id) |
| owner_id | text | interim identity |
| agent_session_id | text (nullable, unique) | Agent Engine session id for message history |
| title | text | user-editable, default "New chat" |
| created_at | timestamptz | |
| updated_at | timestamptz | |
| last_message_at | timestamptz (nullable) | |
| archived | boolean default false | soft delete |
| share_token | text (nullable, unique) | for shareable deep links; null = private |

### `session_tags` (optional, deferred)
Deferred to keep first increment small.

### `review_audit`
| column | type | notes |
|---|---|---|
| id | uuid (pk) | |
| owner_id | text | |
| execution_id | text | Agent Engine execution id |
| session_id | text (nullable) | |
| action | text | approve/reject/resume/etc. |
| decision_payload | jsonb (nullable) | resume_map / decision (no secrets) |
| reason | text (nullable) | |
| created_at | timestamptz | |
| status | text | submitted/failed |

Indexes: `sessions(owner_id, updated_at desc)`, `sessions(share_token)`, `review_audit(owner_id, created_at desc)`, `review_audit(execution_id)`.

## API (app routes, server-side)
- `GET /api/sessions` — list owned sessions (paginated, search `?q=`).
- `POST /api/sessions` — create session metadata (links `agent_session_id`).
- `PATCH /api/sessions/:id` — rename / archive / generate share token.
- `GET /api/sessions/:id` — fetch one (owner or valid share token).
- `DELETE /api/sessions/:id` — archive (soft delete).
- `GET /api/reviews/audit` — list review audit entries (owner).
- `POST /api/reviews/audit` — append entry (called after successful resume).

All routes enforce owner scoping; share-token access is read-only and excludes audit.

## UI
- Chat page: session sidebar (list, search box, rename inline, "new chat"), deep-link route `/chat/[sessionId]` or query param `?session=`.
- Shareable link copies `/s/:shareToken` (read-only view of session transcript via Agent Engine history, gated by token).
- Reviews page: "Recent outcomes" panel reads from `/api/reviews/audit` instead of `localStorage`; keep localStorage as offline fallback.

## Search
- Postgres `ILIKE` on title + `agent_session_id` initially; upgrade to `tsvector` if needed. Keep query server-side with parameterized statements (no SQL injection).

## Security / privacy
- `DATABASE_URL` server-only; never exposed to client.
- Share tokens are high-entropy (nanoid 24+), revocable (set null), read-only, no audit access.
- No secrets/tokens in `decision_payload`; redact before persist.
- Rate limit create/rename endpoints (reuse future rate-limit infra or simple in-memory/token bucket).

## Migrations & rollout
- Phase 1: add DB + schema + migration tooling + env (no UI changes), behind `DATABASE_URL` presence; app degrades gracefully (sessions list empty) if unset.
- Phase 2: session sidebar + rename + search.
- Phase 3: shareable deep links.
- Phase 4: review audit persistence + migrate localStorage entries (best-effort, one-time).
- Each phase is a separate PR; no deploy/tag without approval.

## Env additions
- `DATABASE_URL` (required for persistence; optional for degraded mode).
- Optional: `SESSION_SHARE_BASE_URL` (defaults to app origin).

## Open decisions / approvals needed
- Approve storage provider (Neon vs Vercel Postgres vs self-hosted) and account/billing.
- Approve ORM (Drizzle vs Prisma) and migration workflow.
- Approve interim identity strategy (cookie-based anonymous id) vs waiting for real auth.
- Confirm deep-link route shape and whether shared sessions are read-only transcripts.
- Confirm retention policy (e.g., auto-archive after N days).

## Next step
Await approval on the above before implementing Phase 1.
