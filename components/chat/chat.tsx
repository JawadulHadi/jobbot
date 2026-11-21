"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { BotIcon, DicesIcon, ShieldCheckIcon } from "lucide-react";
import Link from "next/link";
import { generateUUID } from "@/lib/utils";
import { isAbortError, normalizeApiErrorMessage } from "@/lib/api-errors";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CHAT_SESSION_STORAGE_KEY,
  SUSPENDED_CHAT_RESPONSE,
  recordSessionHistory,
  isSafeSessionId,
  type ChatHistory,
} from "@/lib/session";
import { Messages } from "./messages";
import { ChatInput } from "./chat-input";
import { ThemeToggle } from "@/components/theme-toggle";

const SESSION_POLL_INTERVAL_MS = 3_000;

type SessionProgress = "suspended" | "resuming" | null;

function persistSessionId(sessionId: string) {
  try {
    window.localStorage.setItem(CHAT_SESSION_STORAGE_KEY, sessionId);
    recordSessionHistory(sessionId);
  } catch {
    // Browsers may disable storage. The active tab still keeps the session.
  }
}

function readPersistedSessionId(): string | null {
  try {
    const sessionId = window.localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    return sessionId && isSafeSessionId(sessionId) ? sessionId : null;
  } catch {
    return null;
  }
}

function readRequestedSessionId(): string | null {
  const sessionId = new URLSearchParams(window.location.search)
    .get("session_id")
    ?.trim();
  return sessionId && isSafeSessionId(sessionId) ? sessionId : null;
}

function isChatHistory(value: unknown): value is ChatHistory {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const history = value as Partial<ChatHistory>;
  return (
    Array.isArray(history.messages) &&
    (history.historyStatus === "ready" ||
      history.historyStatus === "warming" ||
      history.historyStatus === "unsupported")
  );
}

function toUIMessages(history: ChatHistory, sessionId: string): UIMessage[] {
  const messages = history.messages.map(
    (message): UIMessage => ({
      id: message.id,
      role: message.role,
      parts: [{ type: "text", text: message.content }],
    })
  );

  if (history.latestStatus === "suspended") {
    messages.push({
      id: `suspension-${sessionId}`,
      role: "assistant",
      parts: [
        { type: "text", text: SUSPENDED_CHAT_RESPONSE },
        { type: "data-suspension", data: {} },
      ],
    } as UIMessage);
  }

  return messages;
}

function sessionProgress(history: ChatHistory): SessionProgress {
  if (history.latestStatus === "suspended") return "suspended";
  if (
    history.historyStatus === "warming" ||
    history.latestStatus === "pending" ||
    history.latestStatus === "running" ||
    history.latestStatus === "resuming" ||
    (history.latestStatus === "completed" &&
      history.messages.at(-1)?.role !== "assistant")
  ) {
    return "resuming";
  }
  return null;
}

function composerPlaceholder(
  isRestoring: boolean,
  progress: SessionProgress,
  sessionChanged: boolean
): string {
  if (isRestoring) return "Loading conversation...";
  if (progress === "resuming") return "Waiting for the agent's response...";
  if (progress === "suspended") return "Complete the human review to continue";
  if (sessionChanged) return "Apply the session ID to continue";
  return "Ask anything...";
}

async function fetchChatHistory(
  sessionId: string,
  signal: AbortSignal
): Promise<ChatHistory> {
  const response = await fetch(
    `/api/chat/history?session_id=${encodeURIComponent(sessionId)}`,
    { cache: "no-store", signal }
  );
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Unable to load conversation history.";
    throw new Error(
      normalizeApiErrorMessage(message, "Unable to load conversation history.")
    );
  }
  if (!isChatHistory(body)) {
    throw new Error("Conversation history returned an invalid response.");
  }
  if (body.historyStatus === "unsupported") {
    throw new Error("Conversation history is not available for this agent.");
  }
  return body;
}

export function Chat() {
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("default-user-id");
  const [sessionId, setSessionId] = useState("");
  const [sessionInput, setSessionInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(true);
  const [progress, setProgress] = useState<SessionProgress>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const historyRequest = useRef<AbortController | null>(null);
  const initialSession = useRef<{ id: string; restore: boolean } | null>(null);
  const pollFailureCount = useRef(0);

  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      })
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    generateId: generateUUID,
    transport,
    onData: (dataPart) => {
      if (
        dataPart.type === "data-session" &&
        typeof dataPart.data === "object" &&
        dataPart.data !== null &&
        "session_id" in dataPart.data &&
        typeof dataPart.data.session_id === "string"
      ) {
        const authoritativeSessionId = dataPart.data.session_id;
        setSessionId(authoritativeSessionId);
        setSessionInput(authoritativeSessionId);
        persistSessionId(authoritativeSessionId);
      } else if (dataPart.type === "data-suspension") {
        setProgress("suspended");
      }
    },
  });

  const restoreSession = useCallback(
    async (nextSessionId: string, foreground = true): Promise<boolean> => {
      historyRequest.current?.abort();
      const controller = new AbortController();
      historyRequest.current = controller;
      if (foreground) {
        setIsRestoring(true);
        setHistoryError(null);
      }

      let ok = false;
      try {
        const history = await fetchChatHistory(
          nextSessionId,
          controller.signal
        );
        if (!controller.signal.aborted) {
          setMessages(toUIMessages(history, nextSessionId));
          setProgress(sessionProgress(history));
          setHistoryError(null);
          pollFailureCount.current = 0;
          ok = true;
        }
      } catch (error) {
        if (!controller.signal.aborted && !isAbortError(error)) {
          if (foreground) {
            setMessages([]);
            const message = normalizeApiErrorMessage(
              error,
              "Unable to load conversation history."
            );
            setHistoryError(`${message} You can continue with this session.`);
          } else {
            pollFailureCount.current += 1;
          }
        }
      } finally {
        if (historyRequest.current === controller) {
          historyRequest.current = null;
          if (foreground) setIsRestoring(false);
        }
      }
      return ok;
    },
    [setMessages]
  );

  useEffect(() => {
    if (!initialSession.current) {
      const existingSessionId =
        readRequestedSessionId() ?? readPersistedSessionId();
      initialSession.current = existingSessionId
        ? { id: existingSessionId, restore: true }
        : { id: generateUUID(), restore: false };
    }

    const session = initialSession.current;
    setSessionId(session.id);
    setSessionInput(session.id);
    persistSessionId(session.id);
    if (session.restore) {
      void restoreSession(session.id);
    } else {
      setIsRestoring(false);
    }

    return () => historyRequest.current?.abort();
  }, [restoreSession]);

  useEffect(() => {
    if (!progress || !sessionId || isRestoring) return;

    let stopped = false;
    let timer: number | undefined;

    const nextDelay = () => {
      const failures = pollFailureCount.current;
      if (failures <= 0) return SESSION_POLL_INTERVAL_MS;
      return Math.min(
        SESSION_POLL_INTERVAL_MS * 2 ** Math.min(failures, 4),
        60_000
      );
    };

    const schedule = () => {
      if (stopped) return;
      timer = window.setTimeout(async () => {
        if (!stopped && document.visibilityState !== "hidden") {
          await restoreSession(sessionId, false);
        }
        schedule();
      }, nextDelay());
    };

    const onVisibilityChange = () => {
      if (stopped || document.visibilityState !== "visible") return;
      pollFailureCount.current = 0;
      void restoreSession(sessionId, false);
    };

    pollFailureCount.current = 0;
    schedule();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isRestoring, progress, restoreSession, sessionId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "test") return;
    let active = true;
    void fetch("/api/health", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as
          | { configured?: boolean; ok?: boolean; error?: string; message?: string }
          | null;
        if (!active) return;
        if (!body) return;
        if (body.configured === false) {
          setConfigNotice(
            body.message ||
              "Backend not configured. Set MONGODB_AGENTIC_API_URL (and credentials for deployed endpoints) to enable chat and reviews."
          );
          return;
        }
        if (body.ok === false && body.error) {
          setConfigNotice(
            `Configuration issue: ${normalizeApiErrorMessage(body.error, body.error)}`
          );
          return;
        }
        setConfigNotice(null);
      })
      .catch((error) => {
        if (!active || isAbortError(error)) return;
        // Health check is best-effort; avoid noisy UI on transient failures.
        setConfigNotice(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const applySessionInput = useCallback(() => {
    const nextSessionId = sessionInput.trim();
    if (!isSafeSessionId(nextSessionId)) {
      setHistoryError(
        "Session IDs may contain only letters, numbers, hyphens, and underscores."
      );
      return;
    }
    if (nextSessionId === sessionId) return;

    setSessionId(nextSessionId);
    setSessionInput(nextSessionId);
    persistSessionId(nextSessionId);
    void restoreSession(nextSessionId);
  }, [restoreSession, sessionId, sessionInput]);

  const startNewSession = useCallback(() => {
    historyRequest.current?.abort();
    historyRequest.current = null;
    pollFailureCount.current = 0;
    const nextSessionId = generateUUID();
    setSessionId(nextSessionId);
    setSessionInput(nextSessionId);
    persistSessionId(nextSessionId);
    setMessages([]);
    setProgress(null);
    setHistoryError(null);
    setIsRestoring(false);
  }, [setMessages]);

  const handleSendMessage = useCallback(
    (text: string) => {
      void sendMessage(
        { text },
        {
          body: {
            user_id: userId,
            session_id: sessionId,
            thread_id: sessionId,
          },
        }
      );
    },
    [sendMessage, sessionId, userId]
  );

  const sessionChanged = sessionInput.trim() !== sessionId;
  const composerIsDisabled =
    isRestoring || progress !== null || sessionChanged;

  return (
    <div className="flex h-dvh w-full flex-col bg-transparent">
      <header className="sticky top-0 z-20 mx-2 mt-2 rounded-2xl glass-strong md:mx-4 md:mt-3">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-4 py-3 md:px-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-[oklch(from_var(--brand)_l_c_h_/_0.7)] text-[var(--brand-foreground)] shadow-[0_8px_24px_-8px_oklch(from_var(--brand)_l_c_h_/_0.6)] ring-1 ring-white/30 dark:ring-white/10">
                <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm" aria-hidden="true" />
                <BotIcon className="relative size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-semibold tracking-tight text-foreground">
                  Jobbot
                </h1>
                <p className="truncate text-xs text-muted-foreground">
                  Glass-mode AI assistant with human review · Atlas Agent Engine
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground/90 transition-all hover:bg-[var(--glass-bg-strong)] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                href="/reviews"
              >
                <ShieldCheckIcon className="size-3.5 text-[var(--brand)]" aria-hidden="true" />
                Reviews
              </Link>
              <button
                className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1.5 text-xs font-medium text-foreground/90 transition-all hover:bg-[var(--glass-bg-strong)] hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
                  window.location.href = "/login";
                }}
                type="button"
              >
                Sign out
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl glass-subtle px-3 py-2.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" htmlFor="user-id">
                User
              </label>
              <Input
                className="h-8 w-36 text-xs"
                id="user-id"
                onChange={(e) => setUserId(e.target.value)}
                value={userId}
              />
              <Button
                aria-label="Randomize user ID"
                onClick={() => setUserId(`user-${generateUUID().slice(0, 8)}`)}
                size="icon-xs"
                variant="outline"
                className="h-8 w-8"
              >
                <DicesIcon className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
            <div className="h-5 w-px bg-border/70 hidden sm:block" aria-hidden="true" />
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap" htmlFor="session-id">
                Session
              </label>
              <Input
                className="h-8 w-52 text-xs font-mono"
                id="session-id"
                onBlur={applySessionInput}
                onChange={(event) => {
                  setSessionInput(event.target.value);
                  setHistoryError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
                value={sessionInput}
              />
              <Button
                aria-label="Randomize session ID"
                onClick={startNewSession}
                size="icon-xs"
                variant="outline"
                className="h-8 w-8"
              >
                <DicesIcon className="size-3.5" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <Messages
        emptyState={
          isRestoring
            ? "Loading conversation..."
            : progress === "resuming"
              ? "Waiting for the agent's response..."
              : "Ask anything..."
        }
        messages={messages}
        status={status}
      />
      <div className="sticky bottom-0 z-10 mx-auto flex w-full max-w-4xl gap-2 px-3 pb-4 pt-2 md:px-4 md:pb-5">
        <div className="w-full rounded-2xl glass-strong p-2.5 md:p-3">
          {configNotice ? (
            <div
              className="mb-2 rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/10 px-3 py-2 text-sm text-foreground backdrop-blur-md"
              role="status"
              aria-live="polite"
            >
              <p className="font-medium text-foreground">Setup needed</p>
              <p className="mt-0.5 text-muted-foreground">{configNotice}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Check <code className="font-mono">/api/health</code> and update{" "}
                <code className="font-mono">.env.local</code> as described in README.
              </p>
            </div>
          ) : null}
          {historyError ? (
            <p className="mb-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" aria-live="assertive">
              {historyError}
            </p>
          ) : null}
          <ChatInput
            disabled={composerIsDisabled}
            input={input}
            onSendMessage={handleSendMessage}
            placeholder={composerPlaceholder(
              isRestoring,
              progress,
              sessionChanged
            )}
            setInput={setInput}
            status={status}
            stop={stop}
          />
        </div>
      </div>
    </div>
  );
}
