"use client";

import Link from "next/link";
import { FilterIcon, RefreshCwIcon, SearchIcon, ShieldCheckIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  REVIEW_POLL_INTERVAL_MS,
  getPendingInterrupts,
  initialResumeMap,
  isRecord,
  parseResumeMap,
  type PendingReview,
  type ResumeReviewRequest,
} from "@/lib/reviews";
import { isAbortError, normalizeApiErrorMessage } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

type SortMode =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc"
  | "waiting_desc"
  | "waiting_asc";

type ReviewOutcome = {
  execution_id: string;
  session_id?: string;
  action: string;
  at: string;
  reason?: string;
};

function waitingMs(review: PendingReview): number {
  const base = reviewTimestamp(review, "created_at") || reviewTimestamp(review, "updated_at");
  return base > 0 ? Math.max(0, Date.now() - base) : 0;
}

function formatWaitAge(review: PendingReview): string | null {
  const ms = waitingMs(review);
  if (!ms) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

function allowedDecisions(review: PendingReview): string[] {
  const decisions = review.suspend_context?.allowed_decisions;
  if (!Array.isArray(decisions)) return ["approve", "reject"];
  const valid = decisions.filter(
    (decision): decision is string => typeof decision === "string" && Boolean(decision.trim())
  );
  return valid.length > 0 ? valid : ["approve", "reject"];
}

function contextEntries(review: PendingReview): [string, unknown][] {
  return Object.entries(review.suspend_context ?? {}).filter(
    ([key]) => !["interrupts", "allowed_decisions", "resume_schema"].includes(key)
  );
}

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function reviewStateKey(review: PendingReview): string {
  return JSON.stringify([
    review.execution_id,
    review.session_id,
    review.updated_at,
    getPendingInterrupts(review)?.map((interrupt) => interrupt.id),
  ]);
}

function reviewTimestamp(review: PendingReview, field: "updated_at" | "created_at"): number {
  const raw = review[field];
  if (!raw) return 0;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function matchesQuery(review: PendingReview, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystacks = [
    review.execution_id,
    review.session_id ?? "",
    review.suspend_reason ?? "",
    JSON.stringify(review.suspend_context ?? {}),
  ];
  return haystacks.some((v) => v.toLowerCase().includes(q));
}

async function submitReview(
  executionId: string,
  request: ResumeReviewRequest
): Promise<void> {
  const response = await fetch(
    `/api/reviews/${encodeURIComponent(executionId)}/resume`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }
  );
  if (response.ok) return;

  const result = await response.json().catch(() => null);
  const message =
    isRecord(result) && typeof result.error === "string"
      ? result.error
      : `Review submission failed with HTTP ${response.status}.`;
  throw new Error(normalizeApiErrorMessage(message, "Review submission failed."));
}

function ReviewCard({
  review,
  onResolved,
}: {
  review: PendingReview;
  onResolved: (review: PendingReview, action: string) => void;
}) {
  const interrupts = getPendingInterrupts(review);
  const [decision, setDecision] = useState(allowedDecisions(review)[0]);
  const [notes, setNotes] = useState("");
  const [resumeMap, setResumeMap] = useState(() =>
    interrupts ? initialResumeMap(interrupts) : "{}"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    let request: ResumeReviewRequest;
    if (interrupts) {
      const parsed = parseResumeMap(resumeMap, interrupts);
      if ("error" in parsed) {
        setError(parsed.error);
        return;
      }
      if (!review.session_id) {
        setError("This review has no session ID and cannot be resumed.");
        return;
      }
      request = {
        type: "interrupt",
        session_id: review.session_id,
        resume_map: parsed.resumeMap,
      };
    } else {
      request = {
        type: "decision",
        decision,
        ...(notes ? { reviewer_notes: notes } : {}),
      };
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitReview(review.execution_id, request);
      const action =
        request.type === "decision"
          ? `Decision: ${request.decision}`
          : `Interrupt resumed (${Object.keys(request.resume_map).length} answer${
              Object.keys(request.resume_map).length === 1 ? "" : "s"
            })`;
      onResolved(review, action);
    } catch (submissionError) {
      if (isAbortError(submissionError)) return;
      setError(
        normalizeApiErrorMessage(submissionError, "Unable to resume this review.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">
            {review.suspend_reason?.replaceAll("_", " ") || "Human review"}
          </h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {review.execution_id}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {formatWaitAge(review) ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              Waiting {formatWaitAge(review)}
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            Suspended
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        {review.session_id ? (
          <div>
            <dt className="text-xs text-muted-foreground">Session</dt>
            <dd className="mt-1 break-all font-mono text-xs">{review.session_id}</dd>
          </div>
        ) : null}
        {review.created_at ? (
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="mt-1">{new Date(review.created_at).toLocaleString()}</dd>
          </div>
        ) : null}
        {review.updated_at ? (
          <div>
            <dt className="text-xs text-muted-foreground">Updated</dt>
            <dd className="mt-1">{new Date(review.updated_at).toLocaleString()}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-muted-foreground">Audit</dt>
          <dd className="mt-1 text-xs text-muted-foreground">
            Status: suspended
            {interrupts ? ` · ${interrupts.length} interrupt${interrupts.length === 1 ? "" : "s"}` : " · decision review"}
          </dd>
        </div>
      </dl>

      {contextEntries(review).length > 0 ? (
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Context
          </h3>
          <dl className="mt-2 space-y-2 text-sm">
            {contextEntries(review).map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium">{key.replaceAll("_", " ")}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap break-words text-muted-foreground">
                  {displayValue(value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="mt-5 space-y-3">
        {interrupts ? (
          <>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Pending interrupts</h3>
              {interrupts.map((interrupt) => (
                <p className="text-sm text-muted-foreground" key={interrupt.id}>
                  <code>{interrupt.id}</code>: {displayValue(interrupt.value)}
                </p>
              ))}
            </div>
            <label className="block text-sm font-medium" htmlFor={`resume-${review.execution_id}`}>
              Resume map
            </label>
            <textarea
              className="min-h-36 w-full rounded-lg border bg-background p-3 font-mono text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id={`resume-${review.execution_id}`}
              onChange={(event) => setResumeMap(event.target.value)}
              spellCheck={false}
              value={resumeMap}
            />
            <p className="text-xs text-muted-foreground">
              Replace each null with an answer matching the response schema above. Keep every interrupt ID as a top-level key.
            </p>
          </>
        ) : (
          <>
            <label className="block text-sm font-medium" htmlFor={`decision-${review.execution_id}`}>
              Decision
            </label>
            <select
              className="h-9 w-full rounded-lg border bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id={`decision-${review.execution_id}`}
              onChange={(event) => setDecision(event.target.value)}
              value={decision}
            >
              {allowedDecisions(review).map((option) => (
                <option key={option} value={option}>
                  {option.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <label className="block text-sm font-medium" htmlFor={`notes-${review.execution_id}`}>
              Reviewer notes <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="min-h-24 w-full rounded-lg border bg-background p-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id={`notes-${review.execution_id}`}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </>
        )}

        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        <Button disabled={submitting} onClick={() => void handleSubmit()}>
          {submitting ? "Submitting…" : interrupts ? "Continue execution" : "Submit decision"}
        </Button>
      </div>
    </article>
  );
}

export function Reviews() {
  const [reviews, setReviews] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedReview, setResolvedReview] = useState<PendingReview | null>(null);
  const [recentOutcomes, setRecentOutcomes] = useState<ReviewOutcome[]>([]);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("waiting_desc");
  const activeRequest = useRef<AbortController | null>(null);
  const failureCount = useRef(0);

  const loadReviews = useCallback(async (showLoading = false) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/reviews", {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (activeRequest.current !== controller) return;
      if (!response.ok) {
        const message =
          isRecord(result) && typeof result.error === "string"
            ? result.error
            : `Unable to load reviews (HTTP ${response.status}).`;
        throw new Error(normalizeApiErrorMessage(message, "Unable to load reviews."));
      }
      const nextReviews =
        isRecord(result) && Array.isArray(result.reviews)
          ? (result.reviews as PendingReview[])
          : [];
      setReviews(nextReviews);
      failureCount.current = 0;
      setError(null);
    } catch (loadError) {
      if (controller.signal.aborted || isAbortError(loadError)) return;
      failureCount.current += 1;
      setError(normalizeApiErrorMessage(loadError, "Unable to load reviews."));
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    const nextDelay = () => {
      const failures = failureCount.current;
      if (failures <= 0) return REVIEW_POLL_INTERVAL_MS;
      const backoff = Math.min(
        REVIEW_POLL_INTERVAL_MS * 2 ** Math.min(failures, 4),
        60_000
      );
      return backoff;
    };

    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(async () => {
        if (!stopped && document.visibilityState !== "hidden") {
          await loadReviews();
        }
        schedule();
      }, nextDelay());
    };

    const onVisibilityChange = () => {
      if (!stopped && document.visibilityState === "visible") {
        failureCount.current = 0;
        void loadReviews();
      }
    };

    void Promise.resolve().then(() => loadReviews());
    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      const request = activeRequest.current;
      activeRequest.current = null;
      request?.abort();
    };
  }, [loadReviews]);

  const handleResolved = useCallback((review: PendingReview, action: string) => {
    const request = activeRequest.current;
    activeRequest.current = null;
    request?.abort();
    setResolvedReview(review);
    setRecentOutcomes((current) => [
      {
        execution_id: review.execution_id,
        ...(review.session_id ? { session_id: review.session_id } : {}),
        ...(review.suspend_reason ? { reason: review.suspend_reason } : {}),
        action,
        at: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 10));
    setReviews((current) =>
      current.filter((item) => item.execution_id !== review.execution_id)
    );
  }, []);

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((review) => matchesQuery(review, query));
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortMode) {
        case "updated_asc":
          return reviewTimestamp(a, "updated_at") - reviewTimestamp(b, "updated_at");
        case "created_desc":
          return reviewTimestamp(b, "created_at") - reviewTimestamp(a, "created_at");
        case "created_asc":
          return reviewTimestamp(a, "created_at") - reviewTimestamp(b, "created_at");
        case "waiting_desc":
          return waitingMs(b) - waitingMs(a);
        case "waiting_asc":
          return waitingMs(a) - waitingMs(b);
        case "updated_desc":
        default:
          return reviewTimestamp(b, "updated_at") - reviewTimestamp(a, "updated_at");
      }
    });
    return sorted;
  }, [query, reviews, sortMode]);

  return (
    <main id="main-content" className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <Link
              className="inline-flex items-center rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              href="/"
            >
              ← Back to chat
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] ring-1 ring-[var(--brand)]/20">
                <ShieldCheckIcon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Human reviews</h1>
                <p className="mt-0.5 text-sm text-muted-foreground" aria-live="polite">
                  {loading && reviews.length === 0
                    ? "Checking for suspended executions…"
                    : `${visibleReviews.length} of ${reviews.length} suspended execution${reviews.length === 1 ? "" : "s"} shown.`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Queue refreshes automatically when visible. Prioritize by wait time, use search/sort, and track recent outcomes below.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ThemeToggle />
            <Button
              aria-label="Refresh reviews"
              disabled={loading}
              onClick={() => {
                failureCount.current = 0;
                void loadReviews(true);
              }}
              variant="outline"
            >
              <RefreshCwIcon className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </header>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border/50 bg-card/30 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search reviews"
              className="pl-9"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by reason, session, execution, or context..."
              value={query}
            />
          </div>
          <div className="flex items-center gap-2">
            <FilterIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <label className="sr-only" htmlFor="review-sort">Sort reviews</label>
            <select
              className="h-9 rounded-lg border bg-background px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              id="review-sort"
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              value={sortMode}
            >
              <option value="waiting_desc">Waiting (longest first)</option>
              <option value="waiting_asc">Waiting (newest first)</option>
              <option value="updated_desc">Updated (newest)</option>
              <option value="updated_asc">Updated (oldest)</option>
              <option value="created_desc">Created (newest)</option>
              <option value="created_asc">Created (oldest)</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
            {error}
          </div>
        ) : null}

        {resolvedReview ? (
          <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm" role="status">
            <p className="font-medium text-foreground">Review submitted successfully.</p>
            <p className="mt-1 text-muted-foreground">
              The execution will continue based on your input. It may take a moment to update.
            </p>
            {resolvedReview.session_id ? (
              <p className="mt-2">
                <Link
                  className="rounded-sm font-medium text-primary underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  href={`/?session_id=${encodeURIComponent(resolvedReview.session_id)}`}
                >
                  View the resumed conversation
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        {recentOutcomes.length > 0 ? (
          <section aria-label="Recent review outcomes" className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-foreground">Recent outcomes (this session)</h2>
              <span className="text-xs text-muted-foreground">{recentOutcomes.length} tracked</span>
            </div>
            <ul className="mt-3 space-y-2">
              {recentOutcomes.map((outcome) => (
                <li key={`${outcome.execution_id}-${outcome.at}`} className="rounded-lg border bg-background/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-foreground">{outcome.action}</p>
                    <time className="text-xs text-muted-foreground" dateTime={outcome.at}>
                      {new Date(outcome.at).toLocaleString()}
                    </time>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                    {outcome.execution_id}
                    {outcome.session_id ? ` · session ${outcome.session_id}` : ""}
                  </p>
                  {outcome.reason ? (
                    <p className="mt-1 text-xs text-muted-foreground">Reason: {outcome.reason.replaceAll("_", " ")}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {loading && reviews.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground" role="status">Loading reviews…</p>
        ) : null}

        {!loading && !error && reviews.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-card/30 p-10 text-center">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
              <ShieldCheckIcon className="size-6" aria-hidden="true" />
            </div>
            <h2 className="font-medium text-foreground">No pending reviews</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              When an execution is suspended for human input, it will appear here for action.
            </p>
          </div>
        ) : null}

        {!loading && !error && reviews.length > 0 && visibleReviews.length === 0 ? (
          <div className="mt-8 rounded-xl border bg-card/30 p-8 text-center">
            <h2 className="font-medium text-foreground">No reviews match your filters</h2>
            <p className="mt-1 text-sm text-muted-foreground">Try clearing the search or changing sort options.</p>
            <Button className="mt-4" variant="outline" onClick={() => setQuery("")}>Clear search</Button>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {visibleReviews.map((review) => (
            <ReviewCard
              key={reviewStateKey(review)}
              onResolved={handleResolved}
              review={review}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
