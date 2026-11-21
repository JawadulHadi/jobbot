import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { restoreEnvironmentVariable } from "@/test/environment";

const originalUser = process.env.APP_BASIC_AUTH_USER;
const originalPass = process.env.APP_BASIC_AUTH_PASSWORD;

function makeRequest(path = "/", authHeader?: string, cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers.authorization = authHeader;
  if (cookie) headers.cookie = `${cookie}`;
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

afterEach(() => {
  restoreEnvironmentVariable("APP_BASIC_AUTH_USER", originalUser);
  restoreEnvironmentVariable("APP_BASIC_AUTH_PASSWORD", originalPass);
});

describe("proxy basic auth", () => {
  it("passes through when auth env vars are not configured", () => {
    delete process.env.APP_BASIC_AUTH_USER;
    delete process.env.APP_BASIC_AUTH_PASSWORD;
    const res = proxy(makeRequest());
    expect(res.status).toBe(200);
  });

  it("redirects unauthenticated page requests to /login", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const res = proxy(makeRequest("/"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
  });

  it("returns 401 for unauthenticated API requests", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const res = proxy(makeRequest("/api/chat"));
    expect(res.status).toBe(401);
  });

  it("returns 401 for invalid basic credentials on API routes", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const token = Buffer.from("user:wrong").toString("base64");
    const res = proxy(makeRequest("/api/chat", `Basic ${token}`));
    expect(res.status).toBe(401);
  });

  it("allows valid basic credentials", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const token = Buffer.from("user:pass").toString("base64");
    const res = proxy(makeRequest("/", `Basic ${token}`));
    expect(res.status).toBe(200);
  });

  it("allows a valid session cookie", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const token = Buffer.from("user:pass").toString("base64");
    const res = proxy(makeRequest("/", undefined, `jobbot_auth=${token}`));
    expect(res.status).toBe(200);
  });

  it("allows access to /login and auth endpoints without credentials", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    expect(proxy(makeRequest("/login")).status).toBe(200);
    expect(proxy(makeRequest("/api/auth/login")).status).toBe(200);
  });
});