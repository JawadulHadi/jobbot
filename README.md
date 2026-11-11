# Jobbot

A Next.js chatbot and human-review UI for [Atlas Agent Engine](https://agentengine.mongodb.com). Same core idea as the Agent Engine chatbot starter, packaged and enhanced for a deployable “jobbot” experience: streaming chat, session continuity, and a workspace-scoped review queue.

## Features

- **Streaming chat** via `/api/chat` with authoritative session handling and suspend/resume awareness.
- **Conversation history** restore/polling and editable User/Session IDs.
- **Human reviews** at `/reviews` for suspended executions (decision reviews and native interrupt resumes).
- **Health/config check** at `/api/health`.
- **Optional Basic Auth** for live deployments (`APP_BASIC_AUTH_USER` / `APP_BASIC_AUTH_PASSWORD`).

## Prerequisites

- Node.js 18+ (Node 22 recommended)
- [pnpm](https://pnpm.io/installation) (or use `npx pnpm@10.24.0 ...`)
- An Atlas Agent Engine workspace (deployed) or a local agent via `agentengine dev up`

## Quick start

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   Copy `.env.example` to `.env.local` and set:
   - `MONGODB_AGENTIC_API_URL` – workspace `.../invokeStream` URL, or local `http://localhost:<playground-port>/invoke/stream` from `agentengine dev up` (use the **playground UI** port).
   - `MONGODB_AGENTIC_CLIENT_ID` / `MONGODB_AGENTIC_CLIENT_SECRET` – required for deployed endpoints (service account with `AGENT_DEVELOPER`); leave blank for local proxy without auth.
   - Optional: `APP_BASIC_AUTH_USER` / `APP_BASIC_AUTH_PASSWORD` to protect the app when deployed.

3. **Run locally**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) (chat) and [http://localhost:3000/reviews](http://localhost:3000/reviews).

## Scripts

- `pnpm dev` – development server
- `pnpm build` – production build
- `pnpm start` – run production server
- `pnpm lint` – lint
- `pnpm test` – tests (Vitest)

## Project structure

```
app/
  api/chat/           — message and session-history proxies
  api/reviews/        — review list and resume proxies
  api/health/         — config/health endpoint
  page.tsx            — chat
  reviews/page.tsx    — human review queue
components/           — chat, reviews, UI primitives
lib/                  — Agent Engine API/auth, session & review helpers
middleware.ts         — optional HTTP Basic Auth when env vars are set
```

## Deploy (make live)

### Vercel (recommended for Next.js)
1. Push this repo to GitHub (`https://github.com/JawadulHadi/jobbot.git`).
2. Import the project in [Vercel](https://vercel.com/new).
3. Set **Environment Variables**: `MONGODB_AGENTIC_API_URL`, and for deployed endpoints `MONGODB_AGENTIC_CLIENT_ID`, `MONGODB_AGENTIC_CLIENT_SECRET`. Optionally set `APP_BASIC_AUTH_USER`/`APP_BASIC_AUTH_PASSWORD`.
4. Deploy (build command `pnpm build`, install `pnpm install`).

### Other hosts (Render, Railway, Fly.io, etc.)
- Build: `pnpm install && pnpm build`
- Start: `pnpm start` (respect `PORT` if provided)
- Configure the same environment variables and enable HTTPS.

## Security notes

- Service-account secrets and access tokens stay in server-side route handlers.
- **This app does not include full end-user authentication/authorization by default.** Enable Basic Auth for a simple gate and/or add proper app auth and authorization to chat and review routes before any public production use.
- Do not commit `.env.local` or secrets.

## How it works

The UI sends messages to `/api/chat`, which forwards them to the Atlas Agent Engine streaming endpoint and pipes SSE chunks back via the Vercel AI SDK. The server preserves `X-Session-ID` for session continuity. `/api/reviews` exposes suspended executions and supports decision resumes and native interrupt `resume_map` flows.
