# Troubleshooting

## App shows “Setup needed” or backend not configured
- Verify `.env.local` has `MONGODB_AGENTIC_API_URL` (and credentials for deployed endpoints).
- Check `GET /api/health` for configuration status/error (non-secret).
- Restart dev server after env changes.

## Dev server/build errors related to `.next`
- Symptoms: Turbopack/SST cache corruption, compaction/write errors, or invalid generated types (e.g. `.next/dev/types/validator.ts`).
- Recovery: stop dev server, delete `.next`, then rerun `pnpm dev` or `pnpm build`.

## Reviews/history not loading
- Confirm Agent Engine target URL/credentials and service account permissions.
- Inspect response status and `X-Request-Id` header for traceability.
- Ensure using correct local endpoint (playground UI port for local dev where applicable).

## Git/release workflow issues
- `main` behind remote: `git fetch origin` and reconcile (rebase/merge) before branching.
- Uncommitted local work: stash or commit on a dedicated branch in logical chunks; never commit secrets.
- Do not push/tag/merge/deploy without explicit approval.

## “atlas-agent agent” rename
- Not found in app UI source; local agent assets may exist under `atlas-agent/agents/atlas-agent/`. Confirm whether rename target is UI copy, local agent project naming/config, or backend/Agent Engine configuration before changes.
