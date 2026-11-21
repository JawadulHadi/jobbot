const SAFE_SESSION_ID = /^[A-Za-z0-9_-]{1,128}$/;

export const CHAT_SESSION_STORAGE_KEY = "mongodb-agent-engine-chat-session-id";
export const SUSPENDED_CHAT_RESPONSE = "This request is waiting for human review.";

export type ChatHistoryMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatHistory = {
  messages: ChatHistoryMessage[];
  latestStatus: string | null;
  historyStatus: "ready" | "warming" | "unsupported";
};

export const SESSION_HISTORY_STORAGE_KEY = "jobbot-session-history";

export type SessionHistoryEntry = {
  id: string;
  updatedAt: string;
};

export function isSafeSessionId(sessionId: string): boolean {
  return SAFE_SESSION_ID.test(sessionId);
}

export function readSessionHistory(): SessionHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SESSION_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is SessionHistoryEntry =>
          typeof entry === "object" &&
          entry !== null &&
          typeof entry.id === "string" &&
          isSafeSessionId(entry.id) &&
          typeof entry.updatedAt === "string"
      )
      .slice(0, 50);
  } catch {
    return [];
  }
}

export function recordSessionHistory(sessionId: string): void {
  if (typeof window === "undefined" || !isSafeSessionId(sessionId)) return;
  try {
    const now = new Date().toISOString();
    const existing = readSessionHistory().filter((entry) => entry.id !== sessionId);
    const next: SessionHistoryEntry[] = [{ id: sessionId, updatedAt: now }, ...existing].slice(0, 50);
    window.localStorage.setItem(SESSION_HISTORY_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(
      new CustomEvent("jobbot:session-changed", { detail: { sessionId } })
    );
  } catch {
    // Storage may be disabled; ignore.
  }
}
