import { getAgentEngineTarget } from "@/lib/agent-engine-api";
import { withRequestId } from "@/lib/request-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = withRequestId();
  const configured = Boolean(process.env.MONGODB_AGENTIC_API_URL?.trim());

  if (!configured) {
    return Response.json(
      {
        ok: true,
        configured: false,
        message:
          "Set MONGODB_AGENTIC_API_URL (and credentials for deployed endpoints) to enable chat and reviews.",
      },
      { status: 200, headers }
    );
  }

  try {
    const target = getAgentEngineTarget(process.env.MONGODB_AGENTIC_API_URL);
    return Response.json(
      {
        ok: true,
        configured: true,
        mode: target.mode,
      },
      { headers }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        configured: true,
        error: error instanceof Error ? error.message : "Invalid Agent Engine configuration.",
      },
      { status: 500, headers }
    );
  }
}
