param(
  [string]$Repo = "JawadulHadi/jobbot",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Invoke-GH([string[]]$GhArgs) {
  if ($DryRun) {
    Write-Host "[dry-run] gh $($GhArgs -join ' ')"
    return $null
  }
  $out = & gh @GhArgs 2>&1
  if ($LASTEXITCODE -ne 0) { throw ($out | Out-String) }
  return $out
}

Write-Host "Configuring GitHub metadata for $Repo"

# Milestones (create if missing by title)
$desiredMilestones = @(
  @{ title = "Phase A — Brand & UI Polish"; description = "Cohesive branded UI without core behavior changes. Tokens/theme, icon/metadata, copy, a11y baseline, visual QA. Exit: theming complete, a11y/visual QA satisfied, docs/validation recorded." },
  @{ title = "Phase B — Strengthen Existing Implementations"; description = "Reliability, UX hardening, maintainability. Error mapping, polling/backoff, reviews UX, tests/CI, request tracing. Exit: hardened flows, expanded coverage/CI, documented validation." },
  @{ title = "Phase C — New Implementations"; description = "Approved higher-value capabilities (scoped). Authz, session management, review ops, conversation features, ops/observability, brand package. Exit: scoped features delivered with security/ops requirements met." },
  @{ title = "Release & Governance"; description = "Release discipline and repo hygiene. Changelog/release notes/tags, process docs, README/wiki, metadata/labels. Exit: every build/phase follows release process; tags/milestones/docs current." },
  @{ title = "Hotfix / Patch"; description = "Urgent corrective releases. Targeted fixes + regression validation. Exit: patch released/tagged with notes and verification." }
)

$milestonePages = gh api "repos/$Repo/milestones?state=all&per_page=100" --paginate --slurp
if ($LASTEXITCODE -ne 0) { throw "Failed to list milestones" }
$existingMilestones = $milestonePages | ConvertFrom-Json | ForEach-Object { $_ }
foreach ($m in $desiredMilestones) {
  $found = $existingMilestones | Where-Object { $_.title -eq $m.title }
  if ($found) {
    Write-Host "Milestone exists: $($m.title)"
  } else {
    Write-Host "Creating milestone: $($m.title)"
    Invoke-GH @("api", "repos/$Repo/milestones", "-f", "title=$($m.title)", "-f", "description=$($m.description)") | Out-Null
  }
}

# Labels (create or update)
$desiredLabels = @(
  @{ name="phase:a"; color="766a03"; description="Phase/milestone alignment" },
  @{ name="phase:b"; color="081c8e"; description="Phase/milestone alignment" },
  @{ name="phase:c"; color="56bd85"; description="Phase/milestone alignment" },
  @{ name="type:feature"; color="a5705b"; description="New user-facing capability" },
  @{ name="type:fix"; color="d73a4a"; description="Bug fix" },
  @{ name="type:docs"; color="0075ca"; description="Documentation/governance" },
  @{ name="type:chore"; color="cfd3d7"; description="Maintenance/tooling" },
  @{ name="type:refactor"; color="fbca04"; description="Internal restructuring" },
  @{ name="type:test"; color="0e8a16"; description="Test additions/improvements" },
  @{ name="area:chat"; color="1d76db"; description="Chat UI/streaming/session UX" },
  @{ name="area:reviews"; color="5319e7"; description="Human review queue/resume flows" },
  @{ name="area:api"; color="0052cc"; description="Route handlers/proxy/auth/health" },
  @{ name="area:a11y"; color="f9d0c4"; description="Accessibility" },
  @{ name="area:branding"; color="e99695"; description="Visual identity/theming/assets" },
  @{ name="area:ops"; color="bfd4f2"; description="CI, observability, deployment readiness" },
  @{ name="release"; color="0b3d91"; description="Release/tag/build tracking" },
  @{ name="needs-approval"; color="87cdfb"; description="Requires explicit approval before merge/deploy/push/tag" },
  @{ name="blocked"; color="b60205"; description="Blocked by dependency/decision" },
  @{ name="security"; color="ee0701"; description="Security-sensitive change" }
)

$labelPages = gh api "repos/$Repo/labels?per_page=100" --paginate --slurp
if ($LASTEXITCODE -ne 0) { throw "Failed to list labels" }
$existingLabels = $labelPages | ConvertFrom-Json | ForEach-Object { $_ }
$existingNames = @($existingLabels | ForEach-Object { $_.name })
foreach ($l in $desiredLabels) {
  if ($existingNames -contains $l.name) {
    Write-Host "Updating label: $($l.name)"
    Invoke-GH @("label", "edit", $l.name, "--repo", $Repo, "--color", $l.color, "--description", $l.description) | Out-Null
  } else {
    Write-Host "Creating label: $($l.name)"
    Invoke-GH @("label", "create", $l.name, "--repo", $Repo, "--color", $l.color, "--description", $l.description) | Out-Null
  }
}

# Repository description/topics (canonical)
$desc = "Jobbot — a branded Next.js chat and human-review UI for Atlas Agent Engine. Streaming chat with session continuity, suspend/resume review queue, theming, accessibility baseline, and operational hardening."
$topics = @("nextjs","react","typescript","chatbot","ai-assistant","atlas-agent-engine","mongodb","human-in-the-loop","streaming","tailwindcss","vercel-ai-sdk","jobbot")

Write-Host "Updating repository description/topics"
if (-not $DryRun) {
  Invoke-GH @("api", "--method", "PATCH", "repos/$Repo", "-f", "description=$desc") | Out-Null
  $topicArgs = @("api", "--method", "PUT", "repos/$Repo/topics", "-H", "Accept: application/vnd.github+json")
  foreach ($t in $topics) { $topicArgs += @("-f", "names[]=$t") }
  & gh @topicArgs | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to update topics" }
} else {
  Write-Host "[dry-run] update description/topics"
}

Write-Host "Done."
