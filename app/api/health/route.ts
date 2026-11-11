import { getAgentEngineTarget } from "@/lib/agent-engine-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.MONGODB_AGENTIC_API_URL?.trim());

  if (!configured) {
    return Response.json(
      {
        ok: true,
        configured: false,
        message:
          "Set MONGODB_AGENTIC_API_URL (and credentials for deployed endpoints) to enable chat and reviews.",
      },
      { status: 200 }
    );
  }

  try {
    const target = getAgentEngineTarget(process.env.MONGODB_AGENTIC_API_URL);
    return Response.json({
      ok: true,
      configured: true,
      mode: target.mode,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured: true,
        error: error instanceof Error ? error.message : "Invalid Agent Engine configuration.",
      },
      { status: 500 }
    );
  }
}
