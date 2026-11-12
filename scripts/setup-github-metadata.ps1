param(
  [string]$Repo = "JawadulHadi/jobbot",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Invoke-GH([string[]]$GhArgs) {
  if ($DryRun) {
    Write-Host "[dry-run] gh $($GhArgs -join ' ')"
    return $null
  }
  $out = & gh @GhArgs 2>&1
  if ($LASTEXITCODE -ne 0) { throw (($out | Out-String).TrimEnd()) }
  return $out
}

function Invoke-GHJson([string[]]$GhArgs) {
  $out = & gh @GhArgs 2>&1
  $text = ($out | Out-String)
  if ($LASTEXITCODE -ne 0) {
    throw "gh $($GhArgs -join ' ') failed: $text"
  }
  try {
    if ([string]::IsNullOrWhiteSpace($text)) { return $null }
    return $text | ConvertFrom-Json
  } catch {
    throw "gh $($GhArgs -join ' ') returned invalid JSON: $text"
  }
}

function Get-AllMilestones([string]$TargetRepo) {
  $pages = Invoke-GHJson @("api", "repos/$TargetRepo/milestones?state=all&per_page=100", "--paginate", "--slurp")
  $items = @($pages | ForEach-Object { $_ })
  if ($null -eq $items) { return @() }
  if ($items -isnot [System.Array]) { return @($items) }
  return @($items)
}

function Get-AllLabels([string]$TargetRepo) {
  $pages = Invoke-GHJson @("api", "repos/$TargetRepo/labels?per_page=100", "--paginate", "--slurp")
  $items = @($pages | ForEach-Object { $_ })
  if ($null -eq $items) { return @() }
  if ($items -isnot [System.Array]) { return @($items) }
  return @($items)
}

function Get-MilestoneByTitle([object[]]$Milestones, [string]$Title) {
  $norm = { param($s) (([string]$s) -replace '[\u2012\u2013\u2014\u2015]', '-' -replace '\s+', ' ').Trim() }
  $want = & $norm $Title
  $found = $Milestones | Where-Object { (& $norm $_.title) -eq $want } | Select-Object -First 1
  if ($found) { return $found }
  # Fallback: match by canonical key phrases to tolerate encoding/punctuation differences.
  $keys = @("Phase A", "Phase B", "Phase C", "Release & Governance", "Hotfix / Patch")
  foreach ($k in $keys) {
    if ($want -like "*$k*") {
      $found = $Milestones | Where-Object { (& $norm $_.title) -like "*$k*" } | Select-Object -First 1
      if ($found) { return $found }
    }
  }
  return $null
}

Write-Host "Configuring GitHub metadata for $Repo"

$em = [System.Text.Encoding]::UTF8.GetString([byte[]](226,128,148))

# Milestones (create or update; race-safe recheck before create)
$desiredMilestones = @(
  @{ title = "Phase A $em Brand & UI Polish"; description = "Cohesive branded UI without core behavior changes. Tokens/theme, icon/metadata, copy, a11y baseline, visual QA. Exit: theming complete, a11y/visual QA satisfied, docs/validation recorded." },
  @{ title = "Phase B $em Strengthen Existing Implementations"; description = "Reliability, UX hardening, maintainability. Error mapping, polling/backoff, reviews UX, tests/CI, request tracing. Exit: hardened flows, expanded coverage/CI, documented validation." },
  @{ title = "Phase C $em New Implementations"; description = "Approved higher-value capabilities (scoped). Authz, session management, review ops, conversation features, ops/observability, brand package. Exit: scoped features delivered with security/ops requirements met." },
  @{ title = "Release & Governance"; description = "Release discipline and repo hygiene. Changelog/release notes/tags, process docs, README/wiki, metadata/labels. Exit: every build/phase follows release process; tags/milestones/docs current." },
  @{ title = "Hotfix / Patch"; description = "Urgent corrective releases. Targeted fixes + regression validation. Exit: patch released/tagged with notes and verification." }
)

$existingMilestones = Get-AllMilestones $Repo
foreach ($m in $desiredMilestones) {
  $existingMilestones = Get-AllMilestones $Repo
  $found = Get-MilestoneByTitle $existingMilestones $m.title
  if ($found) {
    $currentDesc = if ($null -eq $found.description) { "" } else { [string]$found.description }
    if ($currentDesc -ne $m.description) {
      Write-Host "Updating milestone: $($m.title)"
      Invoke-GH @("api", "--method", "PATCH", "repos/$Repo/milestones/$($found.number)", "-f", "description=$($m.description)") | Out-Null
    } else {
      Write-Host "Milestone up to date: $($m.title)"
    }
  } else {
    Write-Host "Creating milestone: $($m.title)"
    if ($DryRun) {
      Write-Host "[dry-run] gh api repos/$Repo/milestones -f title=$($m.title) -f description=<desired>"
      continue
    }
    $createOut = & gh api "repos/$Repo/milestones" -f "title=$($m.title)" -f "description=$($m.description)" 2>&1
    $createText = ($createOut | Out-String)
    if ($LASTEXITCODE -ne 0) {
      # Race: recheck before failing; if now exists, update description to desired and continue.
      $recheck = Get-AllMilestones $Repo
      $after = Get-MilestoneByTitle $recheck $m.title
      if ($after) {
        $currentDesc = if ($null -eq $after.description) { "" } else { [string]$after.description }
        if ($currentDesc -ne $m.description) {
          Write-Host "Updating milestone after concurrent create: $($m.title)"
          Invoke-GH @("api", "--method", "PATCH", "repos/$Repo/milestones/$($after.number)", "-f", "description=$($m.description)") | Out-Null
        } else {
          Write-Host "Milestone exists after concurrent create: $($m.title)"
        }
      } else {
        throw "Failed to create milestone '$($m.title)': $createText"
      }
    }
  }
}

# Labels (create or update; race-safe on create)
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

foreach ($l in $desiredLabels) {
  $existingLabels = Get-AllLabels $Repo
  $found = $existingLabels | Where-Object { $_.name -eq $l.name } | Select-Object -First 1
  if ($found) {
    Write-Host "Updating label: $($l.name)"
    Invoke-GH @("label", "edit", $l.name, "--repo", $Repo, "--color", $l.color, "--description", $l.description) | Out-Null
  } else {
    Write-Host "Creating label: $($l.name)"
    if ($DryRun) {
      Write-Host "[dry-run] gh label create $($l.name) --repo $Repo --color $($l.color) --description <desired>"
      continue
    }
    $createOut = & gh label create $l.name --repo $Repo --color $l.color --description $l.description 2>&1
    $createText = ($createOut | Out-String)
    if ($LASTEXITCODE -ne 0) {
      # Concurrent create or existing: treat as update instead of aborting.
      if ($createText -match 'already exists') {
        Write-Host "Label exists after concurrent create, updating: $($l.name)"
        Invoke-GH @("label", "edit", $l.name, "--repo", $Repo, "--color", $l.color, "--description", $l.description) | Out-Null
      } else {
        throw "Failed to create label '$($l.name)': $createText"
      }
    }
  }
}

# Repository description/topics (canonical)
$desc = "Jobbot $em a branded Next.js chat and human-review UI for Atlas Agent Engine. Streaming chat with session continuity, suspend/resume review queue, theming, accessibility baseline, and operational hardening."
$topics = @("nextjs","react","typescript","chatbot","ai-assistant","atlas-agent-engine","mongodb","human-in-the-loop","streaming","tailwindcss","vercel-ai-sdk","jobbot")

Write-Host "Updating repository description/topics"
if (-not $DryRun) {
  Invoke-GH @("api", "--method", "PATCH", "repos/$Repo", "-f", "description=$desc") | Out-Null
  $topicArgs = @("api", "--method", "PUT", "repos/$Repo/topics", "-H", "Accept: application/vnd.github+json")
  foreach ($t in $topics) { $topicArgs += @("-f", "names[]=$t") }
  & gh @topicArgs 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to update repository topics" }
} else {
  Write-Host "[dry-run] update description/topics"
}

Write-Host "Done."
