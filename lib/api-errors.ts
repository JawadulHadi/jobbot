export function normalizeApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) {
    const msg = error.message.trim();
    const lower = msg.toLowerCase();
    // Map low-level fetch/network failures to user-friendly messages while preserving
    // specific upstream/application messages (including test-provided/custom errors).
    if (
      lower === "fetch failed" ||
      lower.includes("failed to fetch") ||
      lower.includes("networkerror") ||
      lower.includes("econnrefused") ||
      lower.includes("enotfound") ||
      lower.includes("eai_again") ||
      lower.includes("etimedout") ||
      lower.includes("network request failed")
    ) {
      return "Network error while contacting the server. Check your connection and try again.";
    }
    if (lower.includes("timed out") || lower.includes("timeout")) {
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
