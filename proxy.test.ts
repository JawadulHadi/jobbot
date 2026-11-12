import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";
import { proxy } from "@/proxy";
import { restoreEnvironmentVariable } from "@/test/environment";

const originalUser = process.env.APP_BASIC_AUTH_USER;
const originalPass = process.env.APP_BASIC_AUTH_PASSWORD;

function makeRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers.authorization = authHeader;
  return new NextRequest("http://localhost:3000/", { headers });
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
    expect(res.headers.get("www-authenticate")).toBeNull();
  });

  it("returns 401 when credentials are required but missing", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const res = proxy(makeRequest());
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Basic");
  });

  it("returns 401 for invalid credentials", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const token = Buffer.from("user:wrong").toString("base64");
    const res = proxy(makeRequest(`Basic ${token}`));
    expect(res.status).toBe(401);
  });

  it("returns 401 for malformed authorization header", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    expect(proxy(makeRequest("Basic not-base64!!!")).status).toBe(401);
    expect(proxy(makeRequest(`Basic ${Buffer.from("nocolon").toString("base64")}`)).status).toBe(401);
  });

  it("allows valid credentials", () => {
    process.env.APP_BASIC_AUTH_USER = "user";
    process.env.APP_BASIC_AUTH_PASSWORD = "pass";
    const token = Buffer.from("user:pass").toString("base64");
    const res = proxy(makeRequest(`Basic ${token}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("www-authenticate")).toBeNull();
  });
});
