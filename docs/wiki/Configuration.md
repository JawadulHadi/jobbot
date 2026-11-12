# Configuration & Environments

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_AGENTIC_API_URL` | Yes (for functional chat/reviews) | Agent Engine streaming/invoke target (deployed workspace `.../invokeStream` or local playground stream URL) |
| `MONGODB_AGENTIC_CLIENT_ID` | Deployed endpoints | Service account client ID (server-side only) |
| `MONGODB_AGENTIC_CLIENT_SECRET` | Deployed endpoints | Service account client secret (server-side only) |
| `APP_BASIC_AUTH_USER` | Optional | Enables HTTP Basic Auth when paired with password |
| `APP_BASIC_AUTH_PASSWORD` | Optional | Enables HTTP Basic Auth when paired with user |

Reference: `.env.example` (keep non-secret and up to date).

## Health/config endpoint

- `GET /api/health` reports configuration state (and mode when configured) without exposing secrets.
- UI surfaces setup guidance when backend is not configured or reports configuration issues.

## Security guidance

- Keep all Agent Engine credentials and tokens server-side in route handlers/libs.
- **Never commit** `.env.local` or any secrets.
- Optional Basic Auth is a simple gate only; full end-user authentication/authorization is required before public/live use (Phase C scope).

## Operational notes

- API responses include non-sensitive `X-Request-Id` for traceability.
- Streaming/chat and reviews polling are designed to be resilient (including visibility-aware polling); monitor validation and phase docs for behavior details.
