"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PlusIcon, SearchIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react";

import { CHAT_SESSION_STORAGE_KEY, SESSION_HISTORY_STORAGE_KEY, readSessionHistory } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TITLES_KEY = "jobbot-session-titles";

type TitlesMap = Record<string, string>;

type SessionRow = {
  dbId: string | null;
  id: string; // agent session id used in URLs
  title: string;
  updatedAt: string;
};

function readTitles(): TitlesMap {
  try {
    const raw = window.localStorage.getItem(TITLES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as TitlesMap) : {};
  } catch {
    return {};
  }
}

function writeTitles(titles: TitlesMap) {
  try {
    window.localStorage.setItem(TITLES_KEY, JSON.stringify(titles));
  } catch {
    // ignore
  }
}

function localRows(): SessionRow[] {
  const titles = readTitles();
  return readSessionHistory().map((e) => ({
    dbId: null,
    id: e.id,
    title: titles[e.id] ?? e.id,
    updatedAt: e.updatedAt,
  }));
}

export function SessionSidebar({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get("session_id");

  const [rows, setRows] = useState<SessionRow[]>([]);
  const [configured, setConfigured] = useState(false);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  const refresh = async (q = "") => {
    try {
      const res = await fetch(`/api/sessions${q ? `?q=${encodeURIComponent(q)}` : ""}`, { cache: "no-store" });
      if (!res.ok) throw new Error("api");
      const body = (await res.json()) as { sessions?: any[]; configured?: boolean };
      if (!body.configured) throw new Error("not configured");
      setConfigured(true);
      const mapped: SessionRow[] = (body.sessions ?? []).map((s) => ({
        dbId: s.id,
        id: s.agentSessionId || s.id,
        title: s.title || s.agentSessionId || s.id,
        updatedAt: s.updatedAt,
      }));
      setRows(mapped);
    } catch {
      setConfigured(false);
      setRows(localRows().filter((r) => (q ? r.title.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()) : true)));
    }
  };

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh(query);
    window.addEventListener("jobbot:session-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("jobbot:session-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void refresh(query), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const filtered = useMemo(() => rows, [rows]);

  const newChat = async () => {
    if (configured) {
      try {
        const newId = crypto.randomUUID();
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "New chat", agentSessionId: newId }),
        });
        if (res.ok) {
          router.push(`/?session_id=${encodeURIComponent(newId)}`);
          void refresh(query);
          return;
        }
      } catch {
        // fall through
      }
    }
    try {
      window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    router.push("/");
  };

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraftTitle(current);
  };

  const saveEdit = async (row: SessionRow) => {
    const trimmed = draftTitle.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }
    if (configured && row.dbId) {
      await fetch(`/api/sessions/${row.dbId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      }).catch(() => null);
    } else {
      const titles = readTitles();
      titles[row.id] = trimmed;
      writeTitles(titles);
    }
    setEditingId(null);
    void refresh(query);
  };

  const removeEntry = async (row: SessionRow) => {
    if (configured && row.dbId) {
      await fetch(`/api/sessions/${row.dbId}`, { method: "DELETE" }).catch(() => null);
    } else {
      const existing = readSessionHistory().filter((e) => e.id !== row.id);
      try {
        window.localStorage.setItem(SESSION_HISTORY_STORAGE_KEY, JSON.stringify(existing));
      } catch {
        // ignore
      }
      const titles = readTitles();
      delete titles[row.id];
      writeTitles(titles);
    }
    if (activeId === row.id) router.push("/");
    void refresh(query);
  };

  return (
    <aside
      className={cn("flex h-full w-full flex-col gap-3 rounded-2xl glass p-3", className)}
      aria-label="Session history"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
        <Button size="sm" variant="outline" onClick={newChat} aria-label="New chat">
          <PlusIcon className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">New</span>
        </Button>
      </div>

      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          aria-label="Search sessions"
          className="pl-9"
          placeholder="Search sessions..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto pr-1" aria-label="Session list">
        {filtered.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            {rows.length === 0
              ? configured
                ? "No sessions yet. Start a chat to create one."
                : "No sessions yet. Start a chat to create one."
              : "No sessions match your search."}
          </p>
        ) : (
          filtered.map((row) => {
            const isActive = activeId === row.id;
            return (
              <div
                key={row.dbId ?? row.id}
                className={cn(
                  "group flex items-center gap-1 rounded-xl px-2 py-2 transition-colors",
                  isActive
                    ? "bg-[var(--brand)]/15 text-foreground ring-1 ring-[var(--brand)]/30"
                    : "hover:bg-[var(--glass-bg)] text-muted-foreground hover:text-foreground"
                )}
              >
                {editingId === row.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      aria-label="Session title"
                      className="h-7 text-xs"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveEdit(row);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button
                      aria-label="Save title"
                      className="rounded-md p-1 hover:bg-[var(--glass-bg-strong)]"
                      onClick={() => void saveEdit(row)}
                      type="button"
                    >
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      aria-label="Cancel edit"
                      className="rounded-md p-1 hover:bg-[var(--glass-bg-strong)]"
                      onClick={() => setEditingId(null)}
                      type="button"
                    >
                      <XIcon className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      className="flex-1 truncate text-xs font-medium"
                      href={`/?session_id=${encodeURIComponent(row.id)}`}
                      title={row.id}
                    >
                      {row.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        aria-label="Rename session"
                        className="rounded-md p-1 hover:bg-[var(--glass-bg-strong)]"
                        onClick={() => startEdit(row.id, row.title)}
                        type="button"
                      >
                        <PencilIcon className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        aria-label="Delete session"
                        className="rounded-md p-1 hover:bg-destructive/15 hover:text-destructive"
                        onClick={() => void removeEntry(row)}
                        type="button"
                      >
                        <Trash2Icon className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </nav>

      <p className="text-[10px] text-muted-foreground/70">
        {configured ? "Synced with database" : "Stored locally"} · {rows.length} session{rows.length === 1 ? "" : "s"}
      </p>
    </aside>
  );
}