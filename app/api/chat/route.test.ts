import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/chat/route";
import { resetAgentEngineAuthForTests } from "@/lib/agent-engine-auth";
import { restoreEnvironmentVariable } from "@/test/environment";

const originalApiUrl = process.env.MONGODB_AGENTIC_API_URL;
const originalClientId = process.env.MONGODB_AGENTIC_CLIENT_ID;
const originalClientSecret = process.env.MONGODB_AGENTIC_CLIENT_SECRET;

afterEach(() => {
  restoreEnvironmentVariable("MONGODB_AGENTIC_API_URL", originalApiUrl);
  restoreEnvironmentVariable("MONGODB_AGENTIC_CLIENT_ID", originalClientId);
  restoreEnvironmentVariable("MONGODB_AGENTIC_CLIENT_SECRET", originalClientSecret);
  resetAgentEngineAuthForTests();
  vi.unstubAllGlobals();
});

describe("POST /api/chat", () => {
  it("forwards session identity and emits the authoritative response session", async () => {
    process.env.MONGODB_AGENTIC_API_URL =
      "https://agent-engine.example.com/api/v1/projects/project-1/workspaces/workspace-1/invokeStream";
    process.env.MONGODB_AGENTIC_CLIENT_ID = "agp_sa_id_example";
    process.env.MONGODB_AGENTIC_CLIENT_SECRET = "agp_sa_sk_example";
    const upstream = new Response(
      'data: {"chunk_type":"text","content":"Hello"}\n\n',
      {
        headers: {
          "Content-Type": "text/event-stream",
          "X-Session-ID": "authoritative-session",
        },
      }
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ access_token: "service-account-token", expires_in: 3_600 })
      )
      .mockResolvedValueOnce(upstream);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }],
          session_id: "client-session",
          thread_id: "client-session",
        }),
      })
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[1];
    expect((init.headers as Headers).get("Authorization")).toBe(
      "Bearer service-account-token"
    );
    expect((init.headers as Headers).get("X-Session-ID")).toBe("client-session");
    const responseBody = await response.text();
    expect(responseBody).toContain('"type":"data-session"');
    expect(responseBody).toContain('"session_id":"authoritative-session"');
  });

  it("explains when the agent pauses for human review", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          'data: {"chunk_type":"done","metadata":{"status":"suspended","execution_id":"execution-1"}}\n\n',
          { headers: { "Content-Type": "text/event-stream" } }
        )
      )
    );

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: "File a claim" }] }],
          session_id: "session-1",
        }),
      })
    );

    const responseBody = await response.text();
    expect(responseBody).toContain("waiting for human review");
    expect(responseBody).toContain('"type":"data-suspension"');
    expect(responseBody).not.toContain("did not return a response");
  });

  it("rejects malformed configuration before sending a request upstream", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://agent-engine.example.com/invoke/stream";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }],
        }),
      })
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain("must use https");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON bodies and empty messages", async () => {
    const invalid = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: "{not json",
      })
    );
    expect(invalid.status).toBe(400);
    await expect(invalid.text()).resolves.toContain("Invalid request body");

    const empty = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", parts: [{ type: "text", text: "   " }] }] }),
      })
    );
    expect(empty.status).toBe(400);
    await expect(empty.text()).resolves.toContain("No message provided");
  });

  it("returns a stream error message when upstream is unavailable or not ok", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed")));
    const network = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }] }),
      })
    );
    await expect(network.text()).resolves.toContain("couldn't reach the server");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("upstream error", { status: 500 }))
    );
    const upstream = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }] }),
      })
    );
    await expect(upstream.text()).resolves.toContain("something went wrong");
  });

  it("handles interrupted streams gracefully", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"chunk_type":"text","content":"Hi"}\n'));
        controller.error(new Error("boom"));
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(stream, { headers: { "Content-Type": "text/event-stream" } }))
    );

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }],
          session_id: "session-1",
        }),
      })
    );

    const body = await response.text();
    expect(body).toContain("connection was interrupted");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("returns a stream error when upstream response has no body", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }] }),
      })
    );

    await expect(response.text()).resolves.toContain("something went wrong");
    expect(response.headers.get("X-Request-Id")).toBeTruthy();
  });

  it("ignores unsafe session and thread ids", async () => {
    process.env.MONGODB_AGENTIC_API_URL = "http://localhost:3000/invoke/stream";
    const upstream = new Response('data: {"chunk_type":"text","content":"Hello"}\n\n', {
      headers: { "Content-Type": "text/event-stream" },
    });
    const fetchMock = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", parts: [{ type: "text", text: "Hi" }] }],
          session_id: "../bad",
          thread_id: "bad space",
        }),
      })
    );

    expect(response.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.session_id).toBeUndefined();
    expect(body.thread_id).toBeUndefined();
  });
});
