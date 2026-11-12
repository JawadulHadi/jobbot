import { getAgentEngineHeaders } from "@/lib/agent-engine-auth";
import {
  getAgentEngineTarget,
  isLocalReviewApiMissing,
  isSafeSessionId,
  normalizeChatHistory,
  readUpstreamError,
  LOCAL_REVIEW_API_UNAVAILABLE_MESSAGE,
} from "@/lib/agent-engine-api";
import { normalizeApiErrorMessage } from "@/lib/api-errors";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { withRequestId } from "@/lib/request-id";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const headers = withRequestId();
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim();
  if (!sessionId || !isSafeSessionId(sessionId)) {
    return Response.json(
      { error: "A valid session_id is required." },
      { status: 400, headers }
    );
  }

  try {
    const target = getAgentEngineTarget(process.env.MONGODB_AGENTIC_API_URL);
    const response = await fetchWithRetry(
      target.sessionMessagesUrl(sessionId),
      {
        headers: await getAgentEngineHeaders(target),
        cache: "no-store",
      },
      { retries: 2, baseDelay: 300 }
    );

    if (!response.ok) {
      return Response.json(
        {
          error: isLocalReviewApiMissing(target, response)
            ? LOCAL_REVIEW_API_UNAVAILABLE_MESSAGE
            : await readUpstreamError(response),
        },
        { status: response.status, headers }
      );
    }

    return Response.json(normalizeChatHistory(await response.json(), sessionId), {
      headers,
    });
  } catch (error) {
    return Response.json(
      {
        error: normalizeApiErrorMessage(
          error,
          "Unable to load conversation history."
        ),
      },
      { status: 500, headers }
    );
  }
}
