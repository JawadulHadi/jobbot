import { describe, expect, it } from "vitest";
import { isAbortError, normalizeApiErrorMessage } from "@/lib/api-errors";

describe("normalizeApiErrorMessage", () => {
  it("returns trimmed string errors", () => {
    expect(normalizeApiErrorMessage("  bad request  ", "fallback")).toBe("bad request");
  });

  it("preserves specific error messages", () => {
    expect(normalizeApiErrorMessage(new Error("Access denied"), "fallback")).toBe("Access denied");
    expect(normalizeApiErrorMessage(new Error("Network unavailable"), "fallback")).toBe(
      "Network unavailable"
    );
  });

  it("maps low-level network and timeout failures to friendly messages", () => {
    expect(normalizeApiErrorMessage(new Error("fetch failed"), "fallback")).toContain(
      "Network error"
    );
    expect(normalizeApiErrorMessage(new Error("Failed to fetch"), "fallback")).toContain(
      "Network error"
    );
    expect(normalizeApiErrorMessage(new Error("ETIMEDOUT"), "fallback")).toContain(
      "Network error"
    );
    expect(normalizeApiErrorMessage(new Error("Request timed out"), "fallback")).toContain(
      "timed out"
    );
  });

  it("falls back for unknown values", () => {
    expect(normalizeApiErrorMessage({ nope: true }, "fallback")).toBe("fallback");
  });
});

describe("isAbortError", () => {
  it("detects DOMException and Error aborts", () => {
    expect(isAbortError(new DOMException("aborted", "AbortError"))).toBe(true);
    const err = new Error("aborted");
    err.name = "AbortError";
    expect(isAbortError(err)).toBe(true);
    expect(isAbortError(new Error("nope"))).toBe(false);
  });
});
