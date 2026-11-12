import { afterEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { restoreEnvironmentVariable } from "@/test/environment";

const originalApiUrl = process.env.MONGODB_AGENTIC_API_URL;

afterEach(() => {
  restoreEnvironmentVariable("MONGODB_AGENTIC_API_URL", originalApiUrl);
});

describe("GET /api/health", () => {
  it("reports unconfigured when API URL is missing", async () => {
    delete process.env.MONGODB_AGENTIC_API_URL;
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.configured).toBe(false);
    expect(body.message).toContain("MONGODB_AGENTIC_API_URL");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("reports configured mode for valid local target", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      configured: true,
      mode: "local",
    });
  });

  it("reports configuration error for invalid URL", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://example.com/invoke/stream";
    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.configured).toBe(true);
    expect(body.error).toContain("must use https");
  });
});
