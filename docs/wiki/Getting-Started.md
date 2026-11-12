# Getting Started

## Prerequisites
- Node.js 18+ (Node 22 recommended)
- pnpm 10.x (or `npx -y pnpm@10.24.0 ...`)
- Atlas Agent Engine workspace (deployed) or local agent via `agentengine dev up`

## Install & configure
```bash
pnpm install
cp .env.example .env.local
```

Set required variables in `.env.local`:
- `MONGODB_AGENTIC_API_URL` — deployed `.../invokeStream` URL or local playground invoke/stream URL
- `MONGODB_AGENTIC_CLIENT_ID`, `MONGODB_AGENTIC_CLIENT_SECRET` — for deployed endpoints (service account, e.g. `AGENT_DEVELOPER`)
- Optional: `APP_BASIC_AUTH_USER`, `APP_BASIC_AUTH_PASSWORD`

## Run
```bash
pnpm dev
```
- Chat: http://localhost:3000
- Reviews: http://localhost:3000/reviews
- Health/config: http://localhost:3000/api/health

## Quality checks
```bash
pnpm lint
pnpm test
pnpm build
```

## Notes
- Do not commit secrets (`.env.local`, credentials, keys).
- If `.next` becomes corrupted during dev/build, stop dev server, remove `.next`, and rebuild/restart.
- No deploy/push without explicit approval. See [Release & Governance](Release-and-Governance.md).
