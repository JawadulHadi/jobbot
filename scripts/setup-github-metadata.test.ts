// @vitest-environment node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const scriptPath = fileURLToPath(new URL("./setup-github-metadata.ps1", import.meta.url));
const repo = "JawadulHadi/jobbot";
const milestones = [
  "Phase A — Brand & UI Polish",
  "Phase B — Strengthen Existing Implementations",
  "Phase C — New Implementations",
  "Release & Governance",
  "Hotfix / Patch",
];
const labels = [
  "phase:a", "phase:b", "phase:c", "type:feature", "type:fix", "type:docs",
  "type:chore", "type:refactor", "type:test", "area:chat", "area:reviews",
  "area:api", "area:a11y", "area:branding", "area:ops", "release",
  "needs-approval", "blocked", "security",
];
const topics = [
  "nextjs", "react", "typescript", "chatbot", "ai-assistant", "atlas-agent-engine",
  "mongodb", "human-in-the-loop", "streaming", "tailwindcss", "vercel-ai-sdk", "jobbot",
];

type Options = {
  repo?: string;
  dryRun?: boolean;
  milestones?: string[];
  labels?: string[];
  failAt?: "milestone" | "label" | "description" | "topics";
  malformed?: "milestones" | "labels";
  runs?: number;
};
type Result = { calls: string[][]; error: string | null };

// Run the real script with an in-process gh substitute. The substitute records
// argument boundaries, maintains synthetic state, and never invokes the real CLI.
function runScript(options: Options = {}): Result {
  const fixture = Buffer.from(JSON.stringify(options)).toString("base64");
  const command = `
$ErrorActionPreference = 'Stop'
$fixture = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${fixture}')) | ConvertFrom-Json
$global:metadataCalls = [Collections.Generic.List[object]]::new()
$global:metadataMilestones = @($fixture.milestones | ForEach-Object { @{ title = $_; number = 1 } })
$global:metadataLabels = @($fixture.labels | ForEach-Object { @{ name = $_ } })
function global:gh {
  $call = @($args | ForEach-Object { [string]$_ })
  $global:metadataCalls.Add($call)
  $global:LASTEXITCODE = 0
  if ($call[0] -eq 'api' -and $call[1] -like '*/milestones?*') {
    if ($fixture.malformed -eq 'milestones') { return 'not json' }
    return ConvertTo-Json -InputObject @(@(@{ title = "Unrelated milestone"; number = 99 }), @($global:metadataMilestones)) -Depth 10 -Compress
  }
  if ($call[0] -eq 'api' -and $call[1] -like '*/labels?*') {
    if ($fixture.malformed -eq 'labels') { return 'not json' }
    return ConvertTo-Json -InputObject @(@(@{ name = "unrelated-label" }), @($global:metadataLabels)) -Depth 10 -Compress
  }
  $stage = if ($call[0] -eq 'label') { 'label' }
    elseif ($call[1] -like '*/milestones') { 'milestone' }
    elseif ($call -contains 'PUT') { 'topics' } else { 'description' }
  if ($fixture.failAt -eq $stage) {
    $global:LASTEXITCODE = 1
    return "synthetic $stage failure"
  }
  if ($stage -eq 'milestone') {
    $global:metadataMilestones += @{ title = $call[3].Substring(6) }
  }
  if ($stage -eq 'label' -and $call[1] -eq 'create') {
    $global:metadataLabels += @{ name = $call[2] }
  }
  return '{}'
}
$failure = $null
try {
  $parameters = @{}
  if ($fixture.repo) { $parameters.Repo = $fixture.repo }
  if ($fixture.dryRun) { $parameters.DryRun = $true }
  $runs = if ($fixture.runs) { $fixture.runs } else { 1 }
  for ($i = 0; $i -lt $runs; $i++) { & $env:METADATA_SCRIPT_UNDER_TEST @parameters }
} catch { $failure = $_.Exception.Message }
@{ calls = @($global:metadataCalls.ToArray()); error = $failure } | ConvertTo-Json -Depth 10 -Compress
`;
  const child = spawnSync(process.env.PWSH_PATH ?? "pwsh", [
    "-NoLogo", "-NoProfile", "-NonInteractive", "-EncodedCommand",
    Buffer.from(command, "utf16le").toString("base64"),
  ], {
    encoding: "utf8",
    timeout: 30_000,
    env: { ...process.env, METADATA_SCRIPT_UNDER_TEST: scriptPath },
  });
  if (child.error) throw child.error;
  expect(child.status, child.stderr).toBe(0);
  const lastLine = child.stdout.trim().split(/\r?\n/).at(-1)!;
  return JSON.parse(lastLine) as Result;
}

function labelCalls(result: Result, action: "create" | "edit") {
  return result.calls.filter((call) => call[0] === "label" && call[1] === action);
}
function milestoneCalls(result: Result, target = repo) {
  return result.calls.filter((call) => call[1] === `repos/${target}/milestones`);
}
function expectSuccess(result: Result) {
  expect(result.error).toBeNull();
}

describe("setup-github-metadata", () => {
  it("queries all pages of milestones and labels in the default repository", () => {
    const result = runScript();
    expectSuccess(result);
    expect(result.calls[0]).toEqual(["api", `repos/${repo}/milestones?state=all&per_page=100`, "--paginate", "--slurp"]);
    expect(result.calls).toContainEqual(["api", `repos/${repo}/labels?per_page=100`, "--paginate", "--slurp"]);
  });

  it("creates all missing milestones with intact Unicode titles and descriptions", () => {
    const result = runScript();
    expectSuccess(result);
    const calls = milestoneCalls(result);
    expect(calls.map((call) => call[3])).toEqual(milestones.map((title) => `title=${title}`));
    for (const call of calls) {
      expect(call).toHaveLength(6);
      expect(call[2]).toBe("-f");
      expect(call[4]).toBe("-f");
      expect(call[5]).toMatch(/^description=.+Exit: .+\.$/);
    }
  });

  it("creates every missing label with a color and a nonempty description", () => {
    const result = runScript();
    expectSuccess(result);
    const calls = labelCalls(result, "create");
    expect(calls.map((call) => call[2])).toEqual(labels);
    expect(labelCalls(result, "edit")).toEqual([]);
    for (const call of calls) {
      expect(call).toHaveLength(9);
      expect(call.slice(3, 6)).toEqual(["--repo", repo, "--color"]);
      expect(call[6]).toMatch(/^[0-9a-f]{6}$/);
      expect(call[7]).toBe("--description");
      expect(call[8].length).toBeGreaterThan(0);
    }
    expect(calls.find((call) => call[2] === "type:fix")?.slice(5)).toEqual([
      "--color", "d73a4a", "--description", "Bug fix",
    ]);
  });

  it("matches existing milestones on later pages and edits existing labels using the desired definitions", () => {
    const result = runScript({ milestones, labels });
    expectSuccess(result);
    expect(milestoneCalls(result)).toEqual([]);
    expect(labelCalls(result, "create")).toEqual([]);
    expect(labelCalls(result, "edit").map((call) => call[2])).toEqual(labels);
    expect(labelCalls(result, "edit").find((call) => call[2] === "type:fix")?.slice(5)).toEqual([
      "--color", "d73a4a", "--description", "Bug fix",
    ]);
  });

  it("handles singleton responses and leaves unrelated metadata alone", () => {
    const result = runScript({ milestones: [milestones[0]], labels: [labels[0]] });
    expectSuccess(result);
    expect(milestoneCalls(result).map((call) => call[3])).toEqual(milestones.slice(1).map((title) => `title=${title}`));
    expect(labelCalls(result, "edit").map((call) => call[2])).toEqual([labels[0]]);
    expect(labelCalls(result, "create").map((call) => call[2])).toEqual(labels.slice(1));
  });

  it("preserves milestone key matching and exact label matching without deleting unrelated entries", () => {
    const result = runScript({ milestones: ["Phase A"], labels: ["phase", "unrelated"] });
    expectSuccess(result);
    expect(milestoneCalls(result).map((call) => call[3])).toEqual(milestones.slice(1).map((title) => `title=${title}`));
    expect(labelCalls(result, "create")).toHaveLength(labels.length);
    expect(result.calls.flat()).not.toContain("delete");
    expect(labelCalls(result, "edit")).toEqual([]);
  });

  it("is repeatable without creating duplicate milestones or labels", () => {
    const result = runScript({ runs: 2 });
    expectSuccess(result);
    expect(milestoneCalls(result)).toHaveLength(milestones.length);
    expect(labelCalls(result, "create")).toHaveLength(labels.length);
    expect(labelCalls(result, "edit").map((call) => call[2])).toEqual(labels);
  });

  it("sets the canonical description and replaces topics with separate form arguments", () => {
    const result = runScript();
    expectSuccess(result);
    expect(result.calls.at(-2)).toEqual([
      "api", "--method", "PATCH", `repos/${repo}`, "-f",
      "description=Jobbot — a branded Next.js chat and human-review UI for Atlas Agent Engine. Streaming chat with session continuity, suspend/resume review queue, theming, accessibility baseline, and operational hardening.",
    ]);
    expect(result.calls.at(-1)).toEqual([
      "api", "--method", "PUT", `repos/${repo}/topics`, "-H", "Accept: application/vnd.github+json",
      ...topics.flatMap((topic) => ["-f", `names[]=${topic}`]),
    ]);
  });

  it("routes every read and write to an explicitly selected repository", () => {
    const customRepo = "example/metadata-sandbox";
    const result = runScript({ repo: customRepo });
    expectSuccess(result);
    expect(milestoneCalls(result, customRepo)).toHaveLength(milestones.length);
    for (const call of result.calls) {
      expect(call.join(" ")).not.toContain(repo);
      if (call[0] === "label") expect(call[call.indexOf("--repo") + 1]).toBe(customRepo);
      else expect(call.some((arg) => arg.startsWith(`repos/${customRepo}`))).toBe(true);
    }
  });

  it.each([false, true])("dry-run reads metadata but makes no writes (existing=%s)", (existing) => {
    const result = runScript({ dryRun: true, milestones: existing ? milestones : [], labels: existing ? labels : [] });
    expectSuccess(result);
    expect(result.calls).toHaveLength(25);
    for (const call of result.calls) {
      expect(call[0]).toBe("api");
      expect(call[1]).toMatch(/\/(milestones|labels)\?/);
      expect(call.slice(2)).toEqual(["--paginate", "--slurp"]);
    }
  });

  it.each(["milestone", "label", "description", "topics"] as const)("reports a %s write failure", (stage) => {
    const result = runScript({ failAt: stage });
    expect(result.error).toContain(stage === "topics" ? "Failed to update repository topics" : `synthetic ${stage} failure`);
    if (stage === "milestone") expect(result.calls).toHaveLength(4);
    if (stage === "description") expect(result.calls.flat()).not.toContain("PUT");
    if (stage === "label") {
      expect(labelCalls(result, "create")).toHaveLength(1);
      expect(result.calls.flat()).not.toContain("PATCH");
    }
  });

  it.each(["milestones", "labels"] as const)("rejects malformed %s JSON before subsequent writes", (malformed) => {
    const result = runScript({ malformed });
    expect(result.error).toBeTruthy();
    expect(labelCalls(result, "create")).toEqual([]);
    expect(result.calls.flat()).not.toContain("PATCH");
    if (malformed === "milestones") expect(result.calls).toHaveLength(1);
  });
});
