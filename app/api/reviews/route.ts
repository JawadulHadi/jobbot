import { getAgentEngineHeaders } from "@/lib/agent-engine-auth";
import {
  getAgentEngineTarget,
  isLocalReviewApiMissing,
  normalizeReviews,
  readUpstreamError,
  LOCAL_REVIEW_API_UNAVAILABLE_MESSAGE,
} from "@/lib/agent-engine-api";
import { normalizeApiErrorMessage } from "@/lib/api-errors";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { withRequestId } from "@/lib/request-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = withRequestId();
  try {
    const target = getAgentEngineTarget(process.env.MONGODB_AGENTIC_API_URL);
    const response = await fetchWithRetry(
      target.reviewsUrl,
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

    const reviews = normalizeReviews(await response.json());
    return Response.json({ reviews, count: reviews.length }, { headers });
  } catch (error) {
    return Response.json(
      {
        error: normalizeApiErrorMessage(error, "Unable to load reviews."),
      },
      { status: 500, headers }
    );
  }
}
