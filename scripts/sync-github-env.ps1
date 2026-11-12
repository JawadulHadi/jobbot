<#
.SYNOPSIS
  Sync environment variables from a local env file to GitHub repository secrets/variables.

.DESCRIPTION
  Reads KEY=VALUE pairs from a local env file (default: .env.local, never committed),
  maps known keys to GitHub Secrets (sensitive) or Variables (non-sensitive/config),
  and applies them via GitHub CLI (`gh`). Supports dry-run, repo targeting, and
  optional GitHub Environment scoping.

  IMPORTANT:
  - Never commit real secret values. Keep .env.local out of git.
  - Requires `gh` authenticated with permissions to manage secrets/variables.
    (repo admin/maintain or appropriate fine-grained permissions; environment secrets
     may require additional access.)
  - Review values before applying. Use -DryRun first.

.PARAMETER EnvFile
  Path to local env file (KEY=VALUE). Default: .env.local

.PARAMETER Repo
  Target repository in owner/name form. Default: current gh repo.

.PARAMETER Environment
  Optional GitHub Environment name (e.g. production, preview). If set, secrets/variables
  are scoped to that environment.

.PARAMETER DryRun
  Show planned actions without writing to GitHub.

.PARAMETER Only
  Optional comma-separated list of keys to sync (e.g. MONGODB_AGENTIC_API_URL,APP_BASIC_AUTH_USER).

.EXAMPLE
  ./scripts/sync-github-env.ps1 -DryRun

.EXAMPLE
  ./scripts/sync-github-env.ps1 -Repo JawadulHadi/jobbot -Environment production

.EXAMPLE
  ./scripts/sync-github-env.ps1 -Only MONGODB_AGENTIC_API_URL,APP_BASIC_AUTH_USER
#>
[CmdletBinding()]
param(
  [string]$EnvFile = ".env.local",
  [string]$Repo = "",
  [string]$Environment = "",
  [switch]$DryRun,
  [string]$Only = ""
)

$ErrorActionPreference = "Stop"

function Require-Gh {
  if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI (gh) is required. Install from https://cli.github.com/ and authenticate with 'gh auth login'."
  }
}

function Get-RepoSlug {
  param([string]$RepoParam)
  if ($RepoParam) { return $RepoParam }
  $slug = (& gh repo view --json nameWithOwner -q .nameWithOwner 2>$null)
  if (-not $slug) { throw "Unable to determine repository. Pass -Repo owner/name." }
  return $slug.Trim()
}

function Parse-EnvFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Env file not found: $Path. Create it locally (e.g. copy .env.example to .env.local) with real values. Do not commit it."
  }
  $map = @{}
  $lines = Get-Content -LiteralPath $Path -Encoding UTF8
  foreach ($line in $lines) {
    $trim = $line.Trim()
    if (-not $trim -or $trim.StartsWith("#")) { continue }
    if ($trim -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') { continue }
    $key = $Matches[1]
    $val = $Matches[2]
    # Strip surrounding quotes if present
    if (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'"))) {
      if ($val.Length -ge 2) { $val = $val.Substring(1, $val.Length - 2) }
    }
    $map[$key] = $val
  }
  return $map
}

# Classification: secret = sensitive credential/token; variable = non-secret config.
# Adjust if your security policy differs (e.g. treat API URL as secret).
$SecretKeys = @(
  "MONGODB_AGENTIC_CLIENT_ID",
  "MONGODB_AGENTIC_CLIENT_SECRET",
  "APP_BASIC_AUTH_USER",
  "APP_BASIC_AUTH_PASSWORD",
  "OPENAI_API_KEY"
)
$VariableKeys = @(
  "MONGODB_AGENTIC_API_URL"
)
$KnownKeys = $SecretKeys + $VariableKeys

Require-Gh
$repoSlug = Get-RepoSlug -RepoParam $Repo
$envMap = Parse-EnvFile -Path $EnvFile

$onlySet = $null
if ($Only) {
  $onlySet = @{}
  foreach ($k in ($Only -split "," | ForEach-Object { $_.Trim() } | Where-Object { $_ })) { $onlySet[$k] = $true }
}

Write-Host "Repo: $repoSlug"
if ($Environment) { Write-Host "Environment: $Environment" }
Write-Host "Env file: $EnvFile"
if ($DryRun) { Write-Host "Mode: DRY RUN (no changes will be made)" }

$planned = @()
foreach ($key in $KnownKeys) {
  if ($onlySet -and -not $onlySet.ContainsKey($key)) { continue }
  if (-not $envMap.ContainsKey($key)) {
    Write-Host "SKIP $key (not present in $EnvFile)" -ForegroundColor Yellow
    continue
  }
  $value = [string]$envMap[$key]
  if ($value -eq "") {
    Write-Host "SKIP $key (empty value)" -ForegroundColor Yellow
    continue
  }
  $kind = if ($SecretKeys -contains $key) { "secret" } else { "variable" }
  $planned += [pscustomobject]@{ Key = $key; Kind = $kind }
}

if ($planned.Count -eq 0) {
  Write-Host "No keys to sync. Ensure $EnvFile contains non-empty values for known keys." -ForegroundColor Yellow
  exit 0
}

foreach ($item in $planned) {
  $key = $item.Key
  $kind = $item.Kind
  $value = [string]$envMap[$key]
  $masked = if ($value.Length -le 4) { "****" } else { ("*" * [Math]::Min(8, $value.Length - 2)) + $value.Substring($value.Length - 2) }
  Write-Host ("PLAN  {0,-28} -> {1}  ({2})" -f $key, $kind, $masked)

  if ($DryRun) { continue }

  if ($kind -eq "secret") {
    $args = @("secret", "set", $key, "--repo", $repoSlug)
    if ($Environment) { $args += @("--env", $Environment) }
    $value | & gh @args
  } else {
    $args = @("variable", "set", $key, "--repo", $repoSlug, "--body", $value)
    if ($Environment) { $args += @("--env", $Environment) }
    & gh @args | Out-Null
  }
  if ($LASTEXITCODE -ne 0) { throw "Failed to set $kind '$key'." }
  Write-Host ("OK    {0} set as {1}" -f $key, $kind) -ForegroundColor Green
}

Write-Host "Done. Verify in GitHub Settings > Secrets and variables (and Environments if used)." 
if (-not $DryRun) {
  Write-Host "Note: Updating secrets/variables does not automatically redeploy running apps; trigger a redeploy/restart as needed."
}
