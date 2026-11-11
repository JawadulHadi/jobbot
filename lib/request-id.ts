import "server-only";

export function createRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function withRequestId(headers?: HeadersInit): Headers {
  const h = new Headers(headers);
  if (!h.has("X-Request-Id")) h.set("X-Request-Id", createRequestId());
  return h;
}
