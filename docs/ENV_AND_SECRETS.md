# Environment Variables & GitHub Secrets

This document defines required/optional environment configuration for Jobbot and how to manage values safely in GitHub and deployment targets.

> **Never commit real secrets.** Keep `.env.local` local and gitignored. Use placeholders in `.env.example` only.

## Variables

| Key | Type | Required | Purpose |
|---|---|---:|---|
| `MONGODB_AGENTIC_API_URL` | Variable (or secret per policy) | Yes | Atlas Agent Engine workspace streaming endpoint (`.../invokeStream`) or local playground invoke URL (`agentengine dev up`) |
| `MONGODB_AGENTIC_CLIENT_ID` | Secret | For deployed endpoints | Service account client ID used server-side to obtain tokens |
| `MONGODB_AGENTIC_CLIENT_SECRET` | Secret | For deployed endpoints | Service account client secret (server-side only) |
| `APP_BASIC_AUTH_USER` | Secret | Optional | Interim HTTP Basic Auth username (set together with password) |
| `APP_BASIC_AUTH_PASSWORD` | Secret | Optional | Interim HTTP Basic Auth password (interim gate only; not full authz) |
| `OPENAI_API_KEY` | Secret | Optional | Only if your agent/runtime requires it (e.g. local agent dev); not used by the Next.js app runtime directly |

## Local development

1. Copy `.env.example` to `.env.local`.
2. Fill in values for your environment.
3. Run `pnpm dev` and verify `GET /api/health`.

## GitHub (repository secrets/variables)

Store production and CI-related values in **Settings → Secrets and variables → Actions** (and **Environments** if you use environment-scoped protection).

- **Secrets:** credentials/tokens/passwords (`MONGODB_AGENTIC_CLIENT_ID`, `MONGODB_AGENTIC_CLIENT_SECRET`, `APP_BASIC_AUTH_*`, `OPENAI_API_KEY` as applicable)
- **Variables:** non-secret configuration (commonly `MONGODB_AGENTIC_API_URL`; treat as secret if your policy requires)

### Sync script (admin/local)

`scripts/sync-github-env.ps1` syncs known keys from a local env file to GitHub via `gh`:

```powershell
# Preview (no writes)
pwsh -NoProfile -File scripts/sync-github-env.ps1 -DryRun

# Apply to repo (requires gh auth with permission to manage secrets/variables)
pwsh -NoProfile -File scripts/sync-github-env.ps1 -Repo JawadulHadi/jobbot

# Apply to a GitHub Environment scope
pwsh -NoProfile -File scripts/sync-github-env.ps1 -Repo JawadulHadi/jobbot -Environment production

# Sync specific keys only
pwsh -NoProfile -File scripts/sync-github-env.ps1 -Only MONGODB_AGENTIC_API_URL,MONGODB_AGENTIC_CLIENT_ID
```

**Permissions:** you may need repo admin/maintain (or equivalent fine-grained permissions) and appropriate access for environment secrets. If `gh secret set`/`gh variable set` fails with permission errors, grant the required access or run with an authorized account/token.

### Workflow helper

`.github/workflows/sync-env.yml` (`workflow_dispatch`) provides a helper/check summary of required keys and attempts read-only presence checks when token permissions allow. It **does not** and **cannot** safely upload secret values; use the local sync script or GitHub UI for setting values.

## Deployment targets

Configure the same keys in your hosting platform's secret/config store (e.g. Vercel Project Settings → Environment Variables). After updating secrets/variables, trigger a redeploy/restart as required by the platform.

## Security notes

- Rotate credentials if exposed.
- Restrict service account permissions to least privilege.
- Use full end-user authz before public production exposure (Basic Auth is interim only).
- `X-Request-Id` and `/api/health` are designed to avoid leaking secrets, but always review logs and error surfaces.