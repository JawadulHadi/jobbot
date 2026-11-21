"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ClipboardListIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";

import { CHAT_SESSION_STORAGE_KEY } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const RECENT_OUTCOMES_KEY = "jobbot.reviews.recentOutcomes.v1";

type ReviewOutcome = {
  execution_id: string;
  action: string;
  at: string;
};

function readRecentOutcomes(): ReviewOutcome[] {
  try {
    const raw = window.localStorage.getItem(RECENT_OUTCOMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ReviewOutcome =>
          typeof item === "object" &&
          item !== null &&
          typeof item.execution_id === "string" &&
          typeof item.action === "string" &&
          typeof item.at === "string"
      )
      .slice(0, 5);
  } catch {
    return [];
  }
}

export function InspectorPanel({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id =
      searchParams.get("session_id") ??
      (typeof window !== "undefined"
        ? window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY)
        : null);
    setActiveSessionId(id);
  }, [searchParams]);

  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<ReviewOutcome[]>([]);

  useEffect(() => {
    let active = true;
    void fetch("/api/reviews", { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) return;
        const body = (await res.json().catch(() => null)) as
          | { executions?: unknown[] }
          | null;
        setPendingCount(Array.isArray(body?.executions) ? body.executions.length : 0);
      })
      .catch(() => {
        if (active) setPendingCount(null);
      });
    setOutcomes(readRecentOutcomes());
    const onChange = () => setOutcomes(readRecentOutcomes());
    window.addEventListener("storage", onChange);
    return () => {
      active = false;
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col gap-3 rounded-2xl glass p-3",
        className
      )}
      aria-label="Inspector"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)]/25 to-[var(--brand)]/5 text-[var(--brand)] ring-1 ring-[var(--brand)]/25">
          <ShieldCheckIcon className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Inspector</h2>
          <p className="text-[11px] text-muted-foreground">Context & reviews</p>
        </div>
      </div>

      <section className="space-y-2 rounded-xl glass-subtle p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Current session
        </h3>
        <p className="break-all font-mono text-[11px] text-foreground">
          {activeSessionId ?? "—"}
        </p>
      </section>

      <section className="space-y-2 rounded-xl glass-subtle p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending reviews
          </h3>
          <span className="rounded-full bg-[var(--brand)]/15 px-2 py-0.5 text-[11px] font-medium text-[var(--brand)]">
            {pendingCount === null ? "—" : pendingCount}
          </span>
        </div>
        <Button asChild size="sm" variant="outline" className="w-full">
          <Link href="/reviews">
            Open review queue
            <ExternalLinkIcon className="ml-1 size-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      <section className="flex-1 space-y-2 overflow-y-auto">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recent outcomes
        </h3>
        {outcomes.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No recent review actions yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {outcomes.map((outcome, idx) => (
              <li
                key={`${outcome.execution_id}-${idx}`}
                className="rounded-lg glass-subtle px-2 py-1.5 text-[11px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{outcome.action}</span>
                  <span className="text-muted-foreground">
                    {new Date(outcome.at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {outcome.execution_id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[10px] text-muted-foreground/70">
        <ClipboardListIcon className="mr-1 inline size-3" aria-hidden="true" />
        Data is browser-local until DB persistence ships.
      </p>
    </aside>
  );
}