import { getAgentEngineHeaders } from "@/lib/agent-engine-auth";
import {
  getAgentEngineTarget,
  isLocalReviewApiMissing,
  normalizeReviews,
  readUpstreamError,
  LOCAL_REVIEW_API_UNAVAILABLE_MESSAGE,
} from "@/lib/agent-engine-api";
import { withRequestId } from "@/lib/request-id";

export const dynamic = "force-dynamic";

export async function GET() {
  const headers = withRequestId();
  try {
    const target = getAgentEngineTarget(process.env.MONGODB_AGENTIC_API_URL);
    const response = await fetch(target.reviewsUrl, {
      headers: await getAgentEngineHeaders(target),
      cache: "no-store",
    });

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
      { error: error instanceof Error ? error.message : "Unable to load reviews." },
      { status: 500, headers }
    );
  }
}
