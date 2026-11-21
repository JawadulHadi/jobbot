# Auth & Billing Design (Phase C)

Status: **Scoping / awaiting approval** — no implementation yet.
Scope: proper authentication/authorization + paid subscription billing, with **Paddle** as the proposed billing provider.

## Goals
- Replace interim Basic Auth with real user accounts and role-aware access to chat/reviews.
- Gate features by subscription entitlement (free/pro/enterprise).
- Collect revenue via Paddle (Merchant of Record) with tax/VAT handled.

## Auth

### Provider options
- **Auth.js (NextAuth)** — self-hosted, flexible, supports email/password + OAuth (GitHub/Google), stores sessions in our Postgres via Drizzle adapter. Lower cost, more code.
- **Clerk** — hosted, fastest to ship, built-in UI, RBAC, webhooks. Monthly cost, vendor lock-in.
- **Custom** — email/password + JWT cookies. Most control, most work, security risk.

Recommendation: **Auth.js** to reuse our Postgres + keep costs low; revisit Clerk if speed matters more than cost. (Decision needed.)

### Identity & roles
- `users`: id, email, name, password_hash (if credentials), created_at.
- `memberships`: user_id, workspace_id, role (`owner`, `admin`, `member`, `reviewer`).
- Roles:
  - `member`: chat only.
  - `reviewer`: chat + review queue.
  - `admin`/`owner`: full access + billing management.
- Interim: map existing Basic Auth user to an `owner` account on first login.

### Route protection
- `proxy.ts` checks session cookie (Auth.js) instead of Basic Auth; unauthenticated → `/login`.
- Server components/API routes use `auth()` to get session; return 401/redirect if missing.
- Review endpoints require `reviewer`+ role.

### Session storage
- Auth.js database sessions in Postgres (`sessions`, `accounts`, `verification_tokens` tables) — separate from our app `sessions` (chat). Rename app table to `chat_sessions` to avoid collision. (Migration needed.)

## Billing — Paddle

### Why Paddle
- **Merchant of Record**: handles global tax/VAT/GST, invoicing, compliance. Reduces legal/accounting burden for a small team.
- Supports subscriptions, one-time payments, free trials, proration, dunning.
- Hosted checkout + customer portal; webhooks for lifecycle events.
- Good fit for SaaS; slightly higher fees than Stripe but less ops.

### Alternatives
- **Stripe**: lower fees, more control, but you own tax compliance (Stripe Tax available for extra fee). Better if you need fine-grained usage metering or complex invoicing.
- **Lemon Squeezy**: similar MoR to Paddle, simpler for small teams.

### Data model (Postgres)
- `plans`: id, paddle_price_id, name, tier, price_cents, interval.
- `subscriptions`: id, user_id/workspace_id, paddle_subscription_id, status, current_period_end, cancel_at_period_end.
- `entitlements`: derived from active subscription tier (cached on user/workspace).

### Flow
1. User signs up → free tier by default.
2. Upgrade → redirect to Paddle hosted checkout (price_id). On success, Paddle redirects to `/billing/success`.
3. Paddle webhook (`subscription.created/updated/canceled`) → `/api/billing/webhook` verifies signature, upserts subscription, updates entitlements.
4. App checks entitlements server-side before gated features (e.g., reviews, history, advanced models).
5. Customer portal link for self-serve cancel/upgrade.

### Webhook security
- Verify Paddle signature (public key) on every webhook.
- Idempotent processing by event id.

### Gating
- Free tier: limited chat messages/month, no review audit persistence, no session history beyond N.
- Pro: unlimited chat, session history, review audit, priority support.
- Enterprise: SSO, RBAC, audit export, SLA.

## API routes (app)
- `POST /api/auth/*` (Auth.js handlers).
- `POST /api/billing/checkout` — create Paddle checkout URL.
- `POST /api/billing/webhook` — Paddle webhooks.
- `GET /api/billing/portal` — customer portal URL.
- `GET /api/entitlements` — current tier/features.

## Env additions
- `AUTH_SECRET` (Auth.js), `AUTH_URL`.
- OAuth client IDs/secrets (if using OAuth).
- `PADDLE_API_KEY`, `PADDLE_WEBHOOK_SECRET`, `PADDLE_ENV` (sandbox/production).
- `PADDLE_PRICE_ID_PRO`, `PADDLE_PRICE_ID_ENTERPRISE`.

## Rollout (separate PRs)
- Phase 0 (done): Interim login screen replacing the browser Basic Auth popup — cookie-based session (`jobbot_auth`), `/login`, `/api/auth/login`, `/api/auth/logout`, proxy redirect. Keeps Basic Auth backward-compatible.
- Phase 1: Auth.js (credentials + optional OAuth) with Postgres-backed users and JWT sessions, signup, route protection. (No billing.)
- Phase 2: Paddle sandbox integration + checkout + webhook + entitlements.
- Phase 3: Gating + customer portal + tier UI.
- Phase 4: Migrate interim cookie users, deprecate Basic Auth/cookie interim.

## Open decisions / approvals needed
- Auth provider: Auth.js vs Clerk.
- Billing provider: Paddle (recommended) vs Stripe vs Lemon Squeezy.
- Pricing tiers and limits.
- Whether to support annual billing and trials.
- Legal: ToS, privacy policy, refund policy (Paddle requires these for checkout).

## Next step
Await approval on provider choices and pricing before Phase 1 implementation.
