export function normalizeApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) {
    const msg = error.message.trim();
    // Map common network/fetch errors to user-friendly messages
    if (msg.toLowerCase().includes("fetch failed") || msg.toLowerCase().includes("network")) {
      return "Network error while contacting the server. Check your connection and try again.";
    }
    if (msg.toLowerCase().includes("timeout") || msg.toLowerCase().includes("aborted")) {
      return "The request timed out. Please try again.";
    }
    return msg;
  }
  return fallback;
}

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  if (error instanceof Error && error.name === "AbortError") return true;
  return false;
}
